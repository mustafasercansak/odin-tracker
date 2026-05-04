import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { usePets } from './usePets';
import { useLabRecords } from './useHealthRecords';
import { useMedications } from './useMedications';

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
You are Odin, a 2026 veterinary AI assistant. 
Pet: ${pet.name} (${pet.species}, ${pet.breed}, ${pet.weightKg}kg)
Meds: ${JSON.stringify(medContext)}
Labs: ${JSON.stringify(labContext)}
Instructions: Be empathetic, professional and concise. Add a short medical disclaimer.
      `.trim();

      // STEP 1: DYNAMICALLY FIND AVAILABLE MODELS
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${googleKey}`;
      const listResponse = await fetch(listUrl);
      const listData = await listResponse.json();
      
      const availableModels = listData.models?.map((m: any) => m.name) || [];
      console.log('Available Google Models:', availableModels);

      // STEP 2: PICK THE BEST ONE (Preference: 3.1-flash > 2.0-flash > 1.5-flash > pro)
      const priority = ['3.1-flash', '2.0-flash', '1.5-flash', 'pro'];
      let selectedModel = '';
      
      for (const p of priority) {
        const found = availableModels.find((m: string) => m.toLowerCase().includes(p));
        if (found) {
          selectedModel = found;
          break;
        }
      }

      if (!selectedModel) {
        selectedModel = availableModels[0] || 'models/gemini-1.5-flash';
      }

      console.log('Odin selected model:', selectedModel);

      // STEP 3: EXECUTE WITH DYNAMIC MODEL
      const url = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${googleKey}`;
      
      const contents = [
        ...history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        {
          role: 'user',
          parts: [{ text: `[SYSTEM: ${systemPrompt}]\n\nQuestion: ${message}` }]
        }
      ];

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Gemini Error');
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

    } catch (error: any) {
      console.error('Odin AI Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { askAssistant, isLoading };
}
