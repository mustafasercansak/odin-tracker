import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Camera, Save } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { profileInputSchema, type ProfileInput } from '@/schemas/user';
import { uploadFile } from '@/lib/storage';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const ProfileModal: React.FC = () => {
  const { t } = useTranslation();
  const { activeModal, setActiveModal } = useAppStore();
  const { user, updateProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user?.photoURL || null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileInputSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      photoURL: user?.photoURL || '',
    },
  });

  // Sync form with user data when modal opens
  React.useEffect(() => {
    if (activeModal === 'profile_edit' && user) {
      reset({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        newPassword: '',
        confirmPassword: '',
      });
      setImagePreview(user.photoURL || null);
    }
  }, [activeModal, user, reset]);

  const handleClose = () => {
    setActiveModal(null);
    setImageFile(null);
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileInput) => {
    setLoading(true);
    try {
      let photoURL = imagePreview;

      if (imageFile) {
        const path = `user_photos/${user?.uid}_${Date.now()}_${imageFile.name}`;
        photoURL = await uploadFile(imageFile, path);
      }

      await updateProfile({
        displayName: data.displayName,
        photoURL: photoURL || undefined,
      });

      // Sync with Firestore 'users' collection
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid), {
          displayName: data.displayName,
          photoURL: photoURL || null,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      if (data.newPassword && data.currentPassword && auth.currentUser?.email) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, data.currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, data.newPassword);
        toast.success(t('settings.passwordChanged'));
      }

      toast.success(t('common.toasts.saved'));
      handleClose();
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error(t('auth.errors.wrong-password'));
      } else {
        toast.error(t('common.toasts.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={activeModal === 'profile_edit'} 
      onClose={handleClose}
      title={t('settings.editProfile')}
    >
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-6"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground overflow-hidden border-2 border-dashed border-border group-hover:border-primary transition-colors">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera size={40} />
              )}
            </div>
            <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
              <span className="text-white text-xs font-bold uppercase tracking-wider">{t('healthRecords.uploadFile')}</span>
              <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">{t('settings.displayName')}</label>
            <input
              {...register('displayName')}
              className={`w-full px-4 py-2.5 rounded-xl bg-input border ${errors.displayName ? 'border-destructive' : 'border-border'} focus:ring-2 focus:ring-primary outline-none transition-all`}
              placeholder={t('settings.displayName')}
            />
            {errors.displayName && <p className="mt-1 text-xs text-destructive">{errors.displayName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">{t('common.email')}</label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-muted-foreground cursor-not-allowed outline-none"
            />
            <p className="mt-1.5 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              {t('settings.emailCannotBeChanged')}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-border">
            <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">{t('settings.changePassword')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">{t('settings.currentPassword')}</label>
                <input
                  type="password"
                  {...register('currentPassword')}
                  className={`w-full px-4 py-2.5 rounded-xl bg-input border ${errors.currentPassword ? 'border-destructive' : 'border-border'} focus:ring-2 focus:ring-primary outline-none transition-all`}
                  placeholder="••••••••"
                />
                {errors.currentPassword && <p className="mt-1 text-xs text-destructive">{errors.currentPassword.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">{t('settings.newPassword')}</label>
                <input
                  type="password"
                  {...register('newPassword')}
                  className={`w-full px-4 py-2.5 rounded-xl bg-input border ${errors.newPassword ? 'border-destructive' : 'border-border'} focus:ring-2 focus:ring-primary outline-none transition-all`}
                  placeholder="••••••••"
                />
                {errors.newPassword && <p className="mt-1 text-xs text-destructive">{errors.newPassword.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">{t('settings.confirmPassword')}</label>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className={`w-full px-4 py-2.5 rounded-xl bg-input border ${errors.confirmPassword ? 'border-destructive' : 'border-border'} focus:ring-2 focus:ring-primary outline-none transition-all`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Save size={20} />
              {t('common.save')}
            </>
          )}
        </button>
      </form>
    </Modal>
  );
};
