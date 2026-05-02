import { useMutation } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { type ExtractionResult } from '@/schemas/extraction';

interface ExtractionInput {
  fileUrl: string;
  petId: string;
}

export function useExtractLabResults() {
  return useMutation({
    mutationFn: async (input: ExtractionInput) => {
      const extractFn = httpsCallable<ExtractionInput, ExtractionResult>(
        functions,
        'extractLabResults'
      );
      
      const result = await extractFn(input);
      return result.data;
    },
  });
}

/**
 * Maps Cloud Function error codes to i18n keys.
 * 
 * @param code Firebase Functions error code or internal error code
 * @returns i18n key for translation
 */
export function mapExtractionErrorToMessage(code: string): string {
  switch (code) {
    case 'resource-exhausted':
    case 'quota_exceeded':
      return 'lab.extraction.errors.quota_exceeded';
    case 'invalid-argument':
    case 'invalid_image':
      return 'lab.extraction.errors.invalid_image';
    case 'internal':
    case 'extraction_failed':
    default:
      return 'lab.extraction.errors.extraction_failed';
  }
}
