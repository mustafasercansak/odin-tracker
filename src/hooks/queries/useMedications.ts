import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Medication } from '@/schemas/medication';

export function useMedications(petId: string | null) {
  const queryClient = useQueryClient();

  const medicationsQuery = useQuery({
    queryKey: ['medications', petId],
    queryFn: async () => {
      if (!petId) return [];
      
      const q = query(
        collection(db, 'medications'),
        where('petId', '==', petId)
      );
      
      const snapshot = await getDocs(q);
      const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Medication[];
      
      // In-memory sorting to avoid composite index requirements
      return meds.sort((a, b) => {
        // Active first
        if (a.active !== b.active) return a.active ? -1 : 1;
        // Then by createdAt (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    },
    enabled: !!petId,
  });

  const addMedication = useMutation({
    mutationFn: async (medData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt' | 'active'>) => {
      const docRef = await addDoc(collection(db, 'medications'), {
        ...medData,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', petId] });
    },
  });

  const updateMedication = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Medication> & { id: string }) => {
      const docRef = doc(db, 'medications', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', petId] });
    },
  });

  const deleteMedication = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'medications', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', petId] });
    },
  });

  return {
    medications: medicationsQuery.data || [],
    isLoading: medicationsQuery.isLoading,
    addMedication,
    updateMedication,
    deleteMedication,
  };
}
