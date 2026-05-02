import { useEffect } from 'react';
import { 
  onAuthStateChanged, 
  type User,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateProfile = async (data: { displayName?: string; photoURL?: string }) => {
    if (!auth.currentUser) return;
    try {
      await firebaseUpdateProfile(auth.currentUser, data);
      // Force user object refresh in store
      setUser({ ...auth.currentUser });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signOut,
    updateProfile,
  };
}
