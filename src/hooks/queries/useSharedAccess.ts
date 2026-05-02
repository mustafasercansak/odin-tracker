import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type SharedAccess } from '@/schemas/sharedAccess';

export function useSharedAccess(petId: string | null) {
  const queryClient = useQueryClient();

  const sharesQuery = useQuery({
    queryKey: ['shared_access', petId],
    queryFn: async () => {
      if (!petId) return [];
      
      const q = query(
        collection(db, 'shared_access'),
        where('petId', '==', petId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SharedAccess[];
    },
    enabled: !!petId,
  });

  const sharePet = useMutation({
    mutationFn: async ({ email, role, ownerId }: { email: string, role: string, ownerId: string }) => {
      if (!petId) throw new Error('Pet ID is required');

      // 1. Find user by email
      const userQ = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
      const userSnapshot = await getDocs(userQ);
      
      if (userSnapshot.empty) {
        throw new Error('user_not_found');
      }

      const targetUser = userSnapshot.docs[0];
      const targetUserId = targetUser.id;

      // 2. Check if already shared
      const existingQ = query(
        collection(db, 'shared_access'), 
        where('petId', '==', petId), 
        where('sharedWithUserId', '==', targetUserId)
      );
      const existingSnapshot = await getDocs(existingQ);
      
      if (!existingSnapshot.empty) {
        throw new Error('already_shared');
      }

      // 3. Create share record
      await addDoc(collection(db, 'shared_access'), {
        petId,
        ownerId,
        sharedWithUserId: targetUserId,
        sharedWithEmail: email.toLowerCase(),
        role,
        createdAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared_access', petId] });
    },
  });

  const revokeAccess = useMutation({
    mutationFn: async (shareId: string) => {
      await deleteDoc(doc(db, 'shared_access', shareId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared_access', petId] });
    },
  });

  return {
    shares: sharesQuery.data || [],
    isLoading: sharesQuery.isLoading,
    sharePet,
    revokeAccess,
  };
}
