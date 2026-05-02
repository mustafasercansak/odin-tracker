import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { type Pet } from '@/schemas/pet';

export function usePets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const petsQuery = useQuery({
    queryKey: ['pets', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      
      // 1. Fetch pets owned by the user
      const ownedQ = query(
        collection(db, 'pets'),
        where('ownerId', '==', user.uid)
      );
      const ownedSnapshot = await getDocs(ownedQ);
      const ownedPets = ownedSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        role: 'owner' 
      })) as any as Pet[];

      // 2. Fetch pets shared with the user
      const sharedQ = query(
        collection(db, 'shared_access'),
        where('sharedWithUserId', '==', user.uid)
      );
      const sharedSnapshot = await getDocs(sharedQ);
      const sharedAccessRecords = sharedSnapshot.docs.map(doc => doc.data());

      const sharedPetsPromises = sharedAccessRecords.map(async (record) => {
        const petDoc = await getDoc(doc(db, 'pets', record.petId));
        if (petDoc.exists()) {
          return { 
            id: petDoc.id, 
            ...petDoc.data(), 
            isShared: true,
            role: record.role 
          } as any as Pet;
        }
        return null;
      });

      const sharedPets = (await Promise.all(sharedPetsPromises)).filter(p => p !== null) as Pet[];

      // 3. Combine and sort
      const allPets = [...ownedPets, ...sharedPets];
      
      return allPets.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    },
    enabled: !!user,
  });

  const addPet = useMutation({
    mutationFn: async (petData: Omit<Pet, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const docRef = await addDoc(collection(db, 'pets'), cleanData({
        ...petData,
        ownerId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', user?.uid] });
    },
  });

  const updatePet = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Pet> & { id: string }) => {
      const docRef = doc(db, 'pets', id);
      await updateDoc(docRef, cleanData({
        ...data,
        updatedAt: new Date().toISOString(),
      }));
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

function cleanData(data: any) {
  const cleaned: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      cleaned[key] = data[key];
    }
  });
  return cleaned;
}
