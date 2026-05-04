import { useMutation } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { type ExtractionResult } from '@/schemas/extraction';
import { useAppStore } from '@/store/useAppStore';

export type ExtractionProvider = 'anthropic' | 'google' | 'groq';

const EXTRACTION_PROMPT = `
Extract veterinary lab results from the document.
Return ONLY valid JSON.
Schema: { "testDate": "YYYY-MM-DD", "labName": "string", "patientName": "string", "measurements": [{ "parameter": "name", "originalLabel": "text", "value": number, "unit": "string", "referenceMin": number, "referenceMax": number, "flag": "high|low|normal", "confidence": "high|medium|low" }], "notes": "string" }
`.trim();

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function sanitizeMeasurement(m: any) {
  return {
    parameter: String(m.parameter || 'unknown'),
    originalLabel: String(m.originalLabel || ''),
    value: Number(m.value) || 0,
    unit: String(m.unit || ''),
    referenceMin: m.referenceMin != null ? Number(m.referenceMin) : null,
    referenceMax: m.referenceMax != null ? Number(m.referenceMax) : null,
    flag: m.flag || null,
    confidence: m.confidence || 'medium',
    aiExtracted: true,
  };
}

export async function extractWithGemini(files: File[]): Promise<ExtractionResult> {
  const state = useAppStore.getState();
  const googleKey = state.aiKeys?.google || import.meta.env.VITE_GOOGLE_AI_API_KEY;
  if (!googleKey) throw new Error('API Key missing');

  // STEP 1: DYNAMIC MODEL DISCOVERY
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${googleKey}`;
  const listRes = await fetch(listUrl);
  const listData = await listRes.json();
  const availableModels = listData.models?.map((m: any) => m.name) || [];

  // Pick best vision-capable model
  const priority = ['3.1-flash', '2.0-flash', '1.5-flash', 'pro-vision'];
  let selectedModel = '';
  for (const p of priority) {
    const found = availableModels.find((m: string) => m.toLowerCase().includes(p));
    if (found) { selectedModel = found; break; }
  }
  if (!selectedModel) selectedModel = availableModels.find((m: string) => m.includes('vision')) || 'models/gemini-1.5-flash';

  const fileParts = await Promise.all(
    files.map(async (file) => ({
      inline_data: { data: await fileToBase64(file), mime_type: file.type }
    }))
  );

  const url = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${googleKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: EXTRACTION_PROMPT }, ...fileParts] }],
      generation_config: { response_mime_type: "application/json" }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Extraction Failed');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const cleanJson = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  return {
    ...parsed,
    measurements: (parsed.measurements ?? []).map((m: any) => sanitizeMeasurement(m)),
  } as ExtractionResult;
}

export function useExtractWithAnthropic() {
  return useMutation({
    mutationFn: async (input: { fileUrl: string; petId: string }) => {
      const fn = httpsCallable<any, ExtractionResult>(functions, 'extractLabResults');
      const result = await fn(input);
      return result.data;
    },
  });
}

export async function extractWithGroq(files: File[]): Promise<ExtractionResult> {
  const state = useAppStore.getState();
  const groqKey = state.aiKeys?.groq || import.meta.env.VITE_GROQ_API_KEY;
  if (!groqKey) throw new Error('Groq Key missing');

  const file = files[0];
  const base64 = await fileToBase64(file);

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.2-11b-vision-preview',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: EXTRACTION_PROMPT },
          { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } }
        ]
      }],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) throw new Error('Groq Extraction Failed');
  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);

  return {
    ...parsed,
    measurements: (parsed.measurements ?? []).map((m: any) => sanitizeMeasurement(m)),
  } as ExtractionResult;
}

export function mapExtractionErrorToMessage(code: string): string {
  return 'lab.extraction.errors.extraction_failed';
}
