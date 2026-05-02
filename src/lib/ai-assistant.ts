import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Pet } from '@/schemas/pet';
import type { LabTestRecord } from '@/schemas/healthRecord';

const EXPLANATION_PROMPT = `
You are a supportive and expert veterinary assistant. Your goal is to explain lab results to a pet owner in a way that is easy to understand, calming, but medically accurate.

Context:
Pet Name: {{petName}}
Species: {{species}}
Breed: {{breed}}
Age: {{age}}

Lab Results:
{{measurements}}

Instructions:
1. Provide a "Bottom Line" summary: Is this generally good, concerning, or mixed?
2. Explain 2-3 most important findings (especially if high/low). Why do they matter for this specific pet?
3. Suggest 3 specific, high-quality questions the owner should ask their veterinarian during the next visit.
4. Keep the tone empathetic and professional. 
5. Mention that this is an AI interpretation and always consult a vet for final diagnosis.
6. Use the language of the request (Turkish or English).

Return ONLY valid JSON in this format:
{
  "summary": "...",
  "keyFindings": [
    { "parameter": "...", "explanation": "..." }
  ],
  "vetQuestions": ["...", "...", "..."]
}
`.trim();

export async function explainLabResults(record: LabTestRecord, pet: Pet, age: string, lang: string = 'en') {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error('VITE_GOOGLE_AI_API_KEY is not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const measurementsStr = (record.measurements || [])
    .map(m => `${m.parameter}: ${m.value} ${m.unit} (${m.flag || 'normal'})`)
    .join('\n');

  const prompt = EXPLANATION_PROMPT
    .replace('{{petName}}', pet.name)
    .replace('{{species}}', pet.species)
    .replace('{{breed}}', pet.breed || 'Unknown')
    .replace('{{age}}', age)
    .replace('{{measurements}}', measurementsStr);

  const finalPrompt = lang === 'tr' ? `${prompt}\nLütfen Türkçe yanıt ver.` : prompt;

  const result = await model.generateContent(finalPrompt);
  const text = result.response.text();
  const raw = text.replace(/```json\n?|\n?```/g, '').trim();
  
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse AI response:', text);
    throw new Error('AI interpretation failed to format correctly.');
  }
}
