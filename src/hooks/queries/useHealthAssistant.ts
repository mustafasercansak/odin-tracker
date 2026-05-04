import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useAppStore } from '@/store/useAppStore';
import { usePets } from './usePets';
import { useLabRecords } from './useHealthRecords';
import { useMedications } from './useMedications';
import { retryWithBackoff } from '@/lib/ai-utils';

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export function useHealthAssistant(petId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const { aiKeys } = useAppStore();
  const { pets } = usePets();
  const { labRecords } = useLabRecords(petId);
  const { medications } = useMedications(petId);

  const googleKey = aiKeys?.google || import.meta.env.VITE_GOOGLE_AI_API_KEY;

  const askAssistant = async (message: string, history: Message[] = []) => {
    if (!googleKey) throw new Error('NO_API_KEY');
    
    setIsLoading(true);
    try {
      const pet = pets.find(p => p.id === petId);
      if (!pet) throw new Error('PET_NOT_FOUND');

      const ai = new GoogleGenAI({ apiKey: googleKey });
      const model = 'gemini-3-flash-preview';

      // Limit data to avoid context overflow and keep it relevant
      const labContext = labRecords.slice(0, 5).map(r => ({
        date: r.recordDate,
        lab: r.labName,
        results: r.measurements?.map(m => `${m.parameter}: ${m.value} ${m.unit} (${m.flag || 'normal'})`).join(', ')
      }));

      const medContext = medications.filter(m => m.active).map(m => ({
        name: m.name,
        dosage: m.dosage,
        freq: m.frequency
      }));

      const systemPrompt = `
You are Odin, a specialized veterinary health assistant. 
Your goal is to help pet owners understand their pet's health data based on the records provided.

Pet Profile:
Name: ${pet.name}
Species: ${pet.species}
Breed: ${pet.breed || 'Unknown'}
Weight: ${pet.weightKg}kg

Medical Context (Last 5 records):
Active Medications: ${JSON.stringify(medContext)}
Recent Lab Results: ${JSON.stringify(labContext)}

Instructions:
1. Be empathetic, professional, and supportive.
2. Use the medical context provided to answer questions specifically for this pet.
3. If asked about trends, look at the provided lab results.
4. ALWAYS add a short disclaimer that you are an AI and not a vet.
5. Keep responses concise but thorough.
6. Respond in the same language as the user.
      `.trim();

      // Convert history to SDK format
      const contents = history.map(h => ({
        role: h.role,
        parts: [{ text: h.content }]
      }));

      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const result = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
          model,
          config: {
            systemInstruction: systemPrompt,
          },
          contents
        });
      }, 1, 1000);

      return result.text || '';
    } finally {
      setIsLoading(false);
    }
  };

  return {
    askAssistant,
    isLoading
  };
}
