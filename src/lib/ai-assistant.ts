import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Pet } from '@/schemas/pet';
import type { LabTestRecord } from '@/schemas/healthRecord';
import { retryWithBackoff } from './ai-utils';
import { useAppStore } from '@/store/useAppStore';

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
6. Use the language specified: {{languageName}}.

Return ONLY valid JSON in this format:
{
  "summary": "...",
  "keyFindings": [
    { "parameter": "...", "explanation": "..." }
  ],
  "vetQuestions": ["...", "...", "..."]
}
`.trim();

const LANGUAGE_MAP: Record<string, string> = {
  en: 'English',
  tr: 'Turkish',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  ja: 'Japanese',
  nl: 'Dutch',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese'
};

export async function explainLabResults(record: LabTestRecord, pet: Pet, age: string, lang: string = 'en') {
  const state = useAppStore.getState();
  
  // Google Gemini
  const googleKey = state.aiKeys?.google || import.meta.env.VITE_GOOGLE_AI_API_KEY;
  // OpenAI
  const openaiKey = state.aiKeys?.openai || import.meta.env.VITE_OPENAI_API_KEY;
  // Anthropic
  const anthropicKey = state.aiKeys?.anthropic || import.meta.env.VITE_ANTHROPIC_API_KEY;
  // Groq
  const groqKey = state.aiKeys?.groq || import.meta.env.VITE_GROQ_API_KEY;
  
  if (!googleKey && !openaiKey && !anthropicKey && !groqKey) {
    throw new Error('No AI API keys provided');
  }

  const measurementsStr = (record.measurements || [])
    .map(m => `${m.parameter}: ${m.value} ${m.unit} (${m.flag || 'normal'})`)
    .join('\n');

  const languageName = LANGUAGE_MAP[lang] || 'English';

  const prompt = EXPLANATION_PROMPT
    .replace('{{petName}}', pet.name)
    .replace('{{species}}', pet.species)
    .replace('{{breed}}', pet.breed || 'Unknown')
    .replace('{{age}}', age)
    .replace('{{measurements}}', measurementsStr)
    .replace('{{languageName}}', languageName);

  const preferredProvider = state.preferredAIProvider || 'auto';

  // ─── Provider Implementations ──────────────────────────────────────────────
  
  const tryGoogle = async () => {
    if (!googleKey) throw new Error('No Google key');
    const genAI = new GoogleGenerativeAI(googleKey);
    const googleModels = ['gemini-1.5-flash', 'gemini-1.5-flash-8b'];
    let googleError: any;
    
    for (const modelName of googleModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await retryWithBackoff(async () => {
          const resp = await model.generateContent(prompt);
          return resp;
        }, 1, 500);
        const text = result.response.text();
        return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
      } catch (e: any) {
        googleError = e;
        if (e.message?.includes('429') || e.message?.includes('quota')) continue;
        throw e;
      }
    }
    throw googleError;
  };

  const tryGroq = async () => {
    if (!groqKey) throw new Error('No Groq key');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });
    if (!response.ok) throw new Error(`Groq failed: ${response.statusText}`);
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  };

  // ─── Execution Logic ───────────────────────────────────────────────────────
  
  const executionOrder = [];
  if (preferredProvider !== 'auto') {
    executionOrder.push(preferredProvider);
  }
  // Add others as fallback
  ['google', 'groq'].forEach(p => {
    if (!executionOrder.includes(p)) executionOrder.push(p);
  });

  let lastError: any;
  for (const provider of executionOrder) {
    try {
      if (provider === 'google') return await tryGoogle();
      if (provider === 'groq') return await tryGroq();
    } catch (e: any) {
      lastError = e;
      console.warn(`Provider ${provider} failed, trying next...`, e);
    }
  }

  console.error('All AI models failed:', lastError);
  if (lastError?.message?.includes('429')) throw new Error('AI_QUOTA_EXCEEDED');
  throw new Error('AI_INTERPRETATION_FAILED');
}
