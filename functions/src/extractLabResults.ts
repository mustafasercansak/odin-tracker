import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

// ─── Validation schemas ───────────────────────────────────────────────────────

const measurementSchema = z.object({
  parameter: z.string(),
  originalLabel: z.string(),
  value: z.number(),
  unit: z.string(),
  referenceMin: z.number().nullable(),
  referenceMax: z.number().nullable(),
  flag: z.enum(['high', 'low', 'normal']).nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
});

const extractionResultSchema = z.object({
  testDate: z.string().nullable(),
  labName: z.string().nullable(),
  patientName: z.string().nullable(),
  measurements: z.array(measurementSchema),
  notes: z.string().nullable(),
});

// ─── Shared prompt ────────────────────────────────────────────────────────────

export const EXTRACTION_PROMPT = `
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

Canonical parameter names (use these when matching):
creatinine, sdma, bun, phosphorus, potassium, calcium, sodium, chloride,
albumin, total_protein, urine_specific_gravity, upc_ratio, urine_ph,
hematocrit, hemoglobin, rbc, mcv, mch, mchc, rdw_cv, rdw_sd,
wbc, neutrophils, lymphocytes, monocytes, eosinophils, basophils,
platelets, mpv, pdw, pct,
alt, ast, alkp, alp, ggt, bilirubin, glucose, t4, cholesterol, triglycerides

Common Turkish/English aliases:
- Kreatinin / Creatinine / CREA / KREAT → creatinine
- Üre / Urea / BUN / URE → bun
- Fosfor / Phosphorus / PHOS → phosphorus
- Potasyum / Potassium / K → potassium
- İdrar yoğunluğu / USG / Specific Gravity → urine_specific_gravity
- İdrar protein/kreatinin / UPC / UP:CR → upc_ratio
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

Confidence rules:
- "low": digit unclear, smudged, partially cut off, or uncertain
- "medium": legible but slight ambiguity
- "high": completely clear

Rules:
- If not in canonical list, extract with snake_case parameter name
- Never invent values. If unreadable, omit the row
- Extract ALL results from ALL pages
- Set reference ranges to null if missing in report
- Map H/L flags to high/low
`.trim();

// ─── Cloud Function (Anthropic only — Gemini runs client-side) ───────────────

export const extractLabResults = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], region: 'europe-west1' },
  async (request) => {
    const { fileUrl, petId } = request.data as { fileUrl: string; petId: string };
    const auth = request.auth;

    if (!auth) throw new HttpsError('unauthenticated', 'User must be authenticated');
    const uid = auth.uid;

    // Pet ownership check
    const petDoc = await db.collection('pets').doc(petId).get();
    if (!petDoc.exists) throw new HttpsError('not-found', 'Pet not found');

    const petData = petDoc.data();
    if (petData?.ownerId !== uid) {
      const shared = await db
        .collection('shared_access')
        .where('petId', '==', petId)
        .where('sharedWithUserId', '==', uid)
        .get();
      if (shared.empty) throw new HttpsError('permission-denied', 'No access to this pet');
    }

    // Quota check & increment
    const usageRef = db.collection('users').doc(uid).collection('usage').doc('extractions');
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartIso = monthStart.toISOString();

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(usageRef);
      let count = 0;
      if (snap.exists) {
        const data = snap.data()!;
        if (data.monthStart === monthStartIso) count = data.count || 0;
      }
      if (count >= 50) throw new HttpsError('resource-exhausted', 'Monthly quota exceeded');
      tx.set(
        usageRef,
        {
          count: count + 1,
          limit: 50,
          monthStart: monthStartIso,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    // Download file from Storage
    const filePath = fileUrl.split('/o/')[1].split('?')[0].replace(/%2F/g, '/');
    const file = storage.bucket().file(filePath);
    const [buffer] = await file.download();
    const base64 = buffer.toString('base64');
    const [metadata] = await file.getMetadata();
    const contentType: string = (metadata.contentType as string) || 'image/jpeg';

    // Extract with Anthropic Claude
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const contentBlock =
        contentType === 'application/pdf'
          ? ({
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            } as const)
          : ({
              type: 'image',
              source: {
                type: 'base64',
                media_type: contentType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64,
              },
            } as const);

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [contentBlock, { type: 'text', text: EXTRACTION_PROMPT }],
          },
        ],
      });

      const textContent = message.content[0];
      if (textContent.type !== 'text') throw new Error('Unexpected response format');

      const raw = textContent.text.replace(/```json\n?|\n?```/g, '').trim();
      const validated = extractionResultSchema.parse(JSON.parse(raw));

      return {
        ...validated,
        measurements: validated.measurements.map((m) => ({ ...m, aiExtracted: true })),
        extractionMetadata: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-6',
          extractedAt: new Date().toISOString(),
        },
      };
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error;
      const msg = error instanceof Error ? error.message : 'Extraction failed';
      throw new HttpsError('internal', msg);
    }
  }
);
