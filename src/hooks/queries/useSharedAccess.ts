import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc,
  updateDoc
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
        where('petId', '==', petId)
      );
      
      const snapshot = await getDocs(q);
      const shares = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SharedAccess[];
      
      // Fetch current names from users collection to ensure they are up to date
      const enrichedShares = await Promise.all(shares.map(async (share) => {
        try {
          const userSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', share.sharedWithEmail)));
          if (!userSnapshot.empty) {
             const userData = userSnapshot.docs[0].data();
             const name = (userData.displayName && userData.displayName !== 'User') ? userData.displayName : null;
             return { ...share, sharedWithDisplayName: name };
          }
        } catch (e) {
          console.error('Error fetching user name:', e);
        }
        
        // If we reach here, we didn't enrich. Strip 'User' from the original share if present.
        if (share.sharedWithDisplayName === 'User') {
          return { ...share, sharedWithDisplayName: null };
        }
        return share;
      }));

      return enrichedShares.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
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
      const targetUserData = targetUser.data();

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
        sharedWithDisplayName: targetUserData.displayName || null,
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

  const updateAccess = useMutation({
    mutationFn: async ({ shareId, role }: { shareId: string, role: string }) => {
      await updateDoc(doc(db, 'shared_access', shareId), {
        role,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared_access', petId] });
      // dynamic import for toast to avoid top-level issues if not needed
      import('react-hot-toast').then(({ toast }) => toast.success('Yetki güncellendi'));
    },
    onError: (err) => {
      console.error('Update access failed:', err);
      import('react-hot-toast').then(({ toast }) => toast.error('Yetki güncellenirken bir hata oluştu'));
    }
  });

  return {
    shares: sharesQuery.data || [],
    isLoading: sharesQuery.isLoading,
    sharePet,
    revokeAccess,
    updateAccess,
  };
}
