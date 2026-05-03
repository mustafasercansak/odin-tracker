import { useMutation } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { functions } from '@/lib/firebase';
import { type ExtractionResult } from '@/schemas/extraction';
import { retryWithBackoff } from '@/lib/ai-utils';
import { useAppStore } from '@/store/useAppStore';

export type ExtractionProvider = 'anthropic' | 'google';

// ─── Prompt (mirrored from cloud function) ────────────────────────────────────

const EXTRACTION_PROMPT = `
You are a veterinary lab report parser. Extract test results from the image or document.

Return ONLY valid JSON, no prose, no markdown fences, in this exact schema:
{
  "testDate": "YYYY-MM-DD or null",
  "labName": "string or null",
  "patientName": "string or null",
  "measurements": [
    {
      "parameter": "canonical name from list below, or snake_case of original if not in list",
      "originalLabel": "exact text from image",
      "value": number,
      "unit": "string",
      "referenceMin": number or null,
      "referenceMax": number or null,
      "flag": "high|low|normal|null",
      "confidence": "high|medium|low"
    }
  ],
  "notes": "any handwritten notes or warnings or null"
}

Canonical parameter names:
creatinine, sdma, bun, phosphorus, potassium, calcium, sodium, chloride,
albumin, total_protein, urine_specific_gravity, upc_ratio, urine_ph,
hematocrit, hemoglobin, rbc, mcv, mch, mchc, rdw_cv, rdw_sd,
wbc, neutrophils, lymphocytes, monocytes, eosinophils, basophils,
platelets, mpv, pdw, pct,
alt, ast, alkp, alp, ggt, bilirubin, glucose, t4, cholesterol, triglycerides

Common Turkish/English aliases:
- Kreatinin / Creatinine / CREA → creatinine
- Üre / Urea / BUN → bun
- Fosfor / Phosphorus / PHOS → phosphorus
- Potasyum / Potassium / K → potassium
- İdrar yoğunluğu / USG → urine_specific_gravity
- Albümin / Albumin / ALB → albumin
- Total Protein / TP → total_protein
- Glukoz / Glucose / GLU → glucose
- ALT (SGPT), AST (SGOT), ALKP (ALP), GGT
- Tiroid: T4, Free T4
- Eritrosit / RBC / Red Blood Cell → rbc
- Hematokrit / Hct / HCT → hematocrit
- Hemoglobin / HGB / Hgb → hemoglobin
- MCV / Ortalama Eritrosit Hacmi → mcv
- MCH / Ortalama Eritrosit Hb → mch
- MCHC / Ortalama Eritrosit Hb Konsantrasyonu → mchc
- RDW-CV / RDW-SD / Eritrosit Dağılım Genişliği → rdw_cv / rdw_sd
- Lökosit / WBC / White Blood Cell → wbc
- Nötrofil / Neutrophil / NEU → neutrophils
- Lenfosit / Lymphocyte / LYM → lymphocytes
- Monosit / Monocyte / MON → monocytes
- Eozinofil / Eosinophil / EOS → eosinophils
- Bazofil / Basophil / BAS → basophils
- Trombosit / Platelet / PLT → platelets
- MPV / Ortalama Trombosit Hacmi → mpv
- PDW / Trombosit Dağılım Genişliği → pdw
- PCT / Trombosit Hacim Oranı → pct

Confidence: "low"=unclear, "medium"=some ambiguity, "high"=clear.
Never invent values. Extract ALL pages. Map H/L flags to high/low.
`.trim();

// ─── File → base64 helper ─────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Sanitize AI output to match strict Zod enums ────────────────────────────

const VALID_FLAGS = new Set(['high', 'low', 'normal']);
const VALID_CONFIDENCE = new Set(['high', 'medium', 'low']);

function sanitizeMeasurement(m: Record<string, unknown>) {
  const rawFlag = String(m.flag ?? '').toLowerCase();
  const rawConf = String(m.confidence ?? '').toLowerCase();
  return {
    parameter: String(m.parameter || 'unknown'),
    originalLabel: String(m.originalLabel || ''),
    value: typeof m.value === 'number' ? m.value : parseFloat(String(m.value)) || 0,
    unit: String(m.unit || ''),
    referenceMin: m.referenceMin != null ? Number(m.referenceMin) : null,
    referenceMax: m.referenceMax != null ? Number(m.referenceMax) : null,
    flag: (VALID_FLAGS.has(rawFlag) ? rawFlag : null) as 'high' | 'low' | 'normal' | null,
    confidence: (VALID_CONFIDENCE.has(rawConf) ? rawConf : 'medium') as 'high' | 'medium' | 'low',
    aiExtracted: true,
  };
}

// ─── Direct Gemini call (browser-side, no Cloud Function) ────────────────────

export async function extractWithGemini(files: File[]): Promise<ExtractionResult> {
  const state = useAppStore.getState();
  const googleKey = state.aiKeys?.google || import.meta.env.VITE_GOOGLE_AI_API_KEY;

  if (!googleKey) {
    throw new Error('VITE_GOOGLE_AI_API_KEY is not set');
  }

  const genAI = new GoogleGenerativeAI(googleKey);
  
  // List of models to try in order of preference
  const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-exp'];

  const fileParts = await Promise.all(
    files.map(async (file) => {
      const base64 = await fileToBase64(file);
      return { inlineData: { data: base64, mimeType: file.type } };
    })
  );

  let lastError: any;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await retryWithBackoff(async () => {
        const resp = await model.generateContent([EXTRACTION_PROMPT, ...fileParts]);
        return resp;
      }, 2, 1000);

      const text = result.response.text();
      const raw = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(raw);

      return {
        ...parsed,
        measurements: (parsed.measurements ?? []).map((m: Record<string, unknown>) =>
          sanitizeMeasurement(m)
        ),
      } as ExtractionResult;
    } catch (error: any) {
      lastError = error;
      const isQuotaError = error.message?.includes('429') || error.message?.includes('quota');
      
      if (isQuotaError) {
        console.warn(`Extraction model ${modelName} quota exceeded, trying fallback...`);
        continue;
      }
      
      break;
    }
  }

  console.error('All extraction models failed:', lastError);
  if (lastError?.message?.includes('429')) {
    throw new Error('quota-exceeded');
  }
  throw lastError;
}

// ─── Cloud Function call (Anthropic via Firebase) ────────────────────────────

interface AnthropicInput {
  fileUrl: string;
  petId: string;
}

export function useExtractWithAnthropic() {
  return useMutation({
    mutationFn: async (input: AnthropicInput) => {
      const fn = httpsCallable<AnthropicInput, ExtractionResult>(functions, 'extractLabResults');
      const result = await fn(input);
      return result.data;
    },
  });
}

// ─── Error message mapping ────────────────────────────────────────────────────

export function mapExtractionErrorToMessage(code: string): string {
  const normalized = (code || '').replace(/^functions\//, '');
  switch (normalized) {
    case 'resource-exhausted':
    case 'quota-exceeded':
      return 'lab.extraction.errors.quota_exceeded';
    case 'permission-denied':
    case 'unauthenticated':
      return 'common.toasts.unauthorized';
    case 'invalid-argument':
      return 'lab.extraction.errors.invalid_image';
    default:
      return 'lab.extraction.errors.extraction_failed';
  }
}
