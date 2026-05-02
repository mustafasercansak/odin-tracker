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
import { useAuth } from '@/hooks/useAuth';
import { type Pet } from '@/types';

export function usePets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const petsQuery = useQuery({
    queryKey: ['pets', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      
      const q = query(
        collection(db, 'pets'),
        where('ownerId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      const pets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Pet[];
      
      // Sort in memory to avoid missing index errors
      return pets.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    },
    enabled: !!user,
  });

  const addPet = useMutation({
    mutationFn: async (petData: Omit<Pet, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const docRef = await addDoc(collection(db, 'pets'), {
        ...petData,
        ownerId: user.uid,
        createdAt: new Date().toISOString(), // Using ISO string as per schemas in v2 usually
        updatedAt: new Date().toISOString(),
      });
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', user?.uid] });
    },
  });

  const updatePet = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Pet> & { id: string }) => {
      const docRef = doc(db, 'pets', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', user?.uid] });
    },
  });

  const deletePet = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'pets', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', user?.uid] });
    },
  });

  return {
    pets: petsQuery.data || [],
    isLoading: petsQuery.isLoading,
    addPet,
    updatePet,
    deletePet,
  };
}
