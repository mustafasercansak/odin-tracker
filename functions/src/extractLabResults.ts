import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Initialize admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

// Zod schemas for validation (sync with client)
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

const EXTRACTION_PROMPT = `
You are a veterinary lab report parser. Extract test results from the image.

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
  "notes": "any handwritten notes or warnings"
}

Canonical parameter names (use these when matching):
creatinine, sdma, bun, phosphorus, potassium, calcium, sodium,
chloride, albumin, total_protein, urine_specific_gravity, upc_ratio,
urine_ph, hematocrit, hemoglobin, wbc, platelets, alt, ast, alkp,
glucose, t4

Common Turkish/English aliases:
- Kreatinin / Creatinine / CREA → creatinine
- Üre / Urea / BUN → bun
- Fosfor / Phosphorus / PHOS → phosphorus
- Potasyum / Potassium / K → potassium
- İdrar yoğunluğu / USG / Specific Gravity → urine_specific_gravity
- İdrar protein/kreatinin / UPC → upc_ratio

Confidence rules:
- "low" if digit unclear, smudged, partially cut off, or your reading uncertain
- "medium" if legible but slight ambiguity
- "high" if clear

If a value is not in the canonical list, still extract it with snake_case parameter name.
Never invent values. If you cannot read it, omit the row.
`;

export const extractLabResults = onCall({ 
  secrets: ["ANTHROPIC_API_KEY"],
  region: "europe-west1" 
}, async (request) => {
  const { fileUrl, petId } = request.data;
  const auth = request.auth;

  // 1. Verify Auth
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const uid = auth.uid;

  // 2. Verify Pet Ownership
  const petDoc = await db.collection('pets').doc(petId).get();
  if (!petDoc.exists) {
    throw new HttpsError('not-found', 'Pet not found');
  }
  
  const petData = petDoc.data();
  if (petData?.ownerId !== uid) {
    // Check shared access (simplified for now)
    const sharedDoc = await db.collection('shared_access')
      .where('petId', '==', petId)
      .where('sharedWithUserId', '==', uid)
      .get();
    
    if (sharedDoc.empty) {
      throw new HttpsError('permission-denied', 'You do not have access to this pet');
    }
  }

  // 3. Quota Tracking
  const usageRef = db.collection('users').doc(uid).collection('usage').doc('extractions');
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartIso = monthStart.toISOString();

  await db.runTransaction(async (transaction) => {
    const usageDoc = await transaction.get(usageRef);
    let count = 0;
    
    if (usageDoc.exists) {
      const data = usageDoc.data();
      // Reset if it's a new month
      if (data?.monthStart === monthStartIso) {
        count = data.count || 0;
      }
    }

    if (count >= 50) {
      throw new HttpsError('resource-exhausted', 'Monthly quota exceeded');
    }

    transaction.set(usageRef, {
      count: count + 1,
      limit: 50,
      monthStart: monthStartIso,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  // 4. Download and process image
  try {
    // Get file from storage
    const bucket = storage.bucket();
    // Extract path from URL (gs://... or https://...)
    // For simplicity, assuming the URL is a relative path or we can parse it
    // In practice, we should pass the bucket path from client
    const filePath = fileUrl.split('/o/')[1].split('?')[0].replace(/%2F/g, '/');
    const file = bucket.file(filePath);
    const [buffer] = await file.download();
    const base64 = buffer.toString('base64');
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || 'image/jpeg';

    // 5. Call Anthropic
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", //Haıku is fast and cheap for vision
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: contentType as any,
                data: base64,
              },
            },
            {
              type: "text",
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    const textContent = message.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Unexpected AI response format');
    }

    const rawJson = textContent.text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(rawJson);
    
    // 6. Validate with Zod
    const validated = extractionResultSchema.parse(parsed);

    return {
      ...validated,
      extractionMetadata: {
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        extractedAt: new Date().toISOString(),
      }
    };

  } catch (error: any) {
    console.error('Extraction error:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message || 'Extraction failed');
  }
});
