import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export interface ExtractionUsage {
  count: number;
  limit: number;
  monthStart: string;
}

export function useExtractionUsage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['usage', user?.uid],
    queryFn: async () => {
      if (!user) return null;
      
      const docRef = doc(db, 'users', user.uid, 'usage', 'extractions');
      const snapshot = await getDoc(docRef);
      
      if (!snapshot.exists()) {
        // Default values if document doesn't exist yet
        return {
          count: 0,
          limit: 50,
          monthStart: new Date().toISOString(),
        } as ExtractionUsage;
      }
      
      return snapshot.data() as ExtractionUsage;
    },
    enabled: !!user,
  });
}
