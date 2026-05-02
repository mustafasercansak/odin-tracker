import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Share2, UserPlus, Trash2, Shield, Mail } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useAppStore } from '@/store/useAppStore';
import { useSharedAccess } from '@/hooks/queries/useSharedAccess';
import { sharedAccessInputSchema, type SharedAccessInput } from '@/schemas/sharedAccess';
import { useAuth } from '@/hooks/useAuth';

export const ShareModal: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeModal, setActiveModal, modalData } = useAppStore();
  const petId = (modalData as any)?.petId;
  const { shares, sharePet, revokeAccess, isLoading } = useSharedAccess(petId || null);
  
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SharedAccessInput>({
    resolver: zodResolver(sharedAccessInputSchema),
    defaultValues: {
      role: 'viewer',
    },
  });

  const handleClose = () => {
    setActiveModal(null);
    reset();
  };

  const onSubmit = async (data: SharedAccessInput) => {
    if (!user) return;
    setLoading(true);
    try {
      await sharePet.mutateAsync({
        email: data.sharedWithEmail,
        role: data.role,
        ownerId: user.uid,
      });
      toast.success(t('shares.shareSuccess'));
      reset();
    } catch (error: any) {
      console.error('Error sharing pet:', error);
      if (error.message === 'user_not_found') {
        toast.error(t('shares.errors.userNotFound'));
      } else if (error.message === 'already_shared') {
        toast.error(t('shares.errors.alreadyShared'));
      } else {
        toast.error(t('common.toasts.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeAccess.mutateAsync(id);
      toast.success(t('shares.revokeSuccess'));
    } catch (error) {
      toast.error(t('common.toasts.error'));
    }
  };

  return (
    <Modal 
      isOpen={activeModal === 'share_pet'} 
      onClose={handleClose}
      title={t('shares.title')}
    >
      <div className="space-y-8">
        {/* Form - Only Owner can invite */}
        {user?.uid === (modalData as any)?.ownerId && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold mb-1.5">{t('shares.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    {...register('sharedWithEmail')}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-input border ${errors.sharedWithEmail ? 'border-destructive' : 'border-border'} focus:ring-2 focus:ring-primary outline-none`}
                    placeholder="user@example.com"
                  />
                </div>
                {errors.sharedWithEmail && <p className="mt-1 text-xs text-destructive">{errors.sharedWithEmail.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">{t('shares.role')}</label>
                <select
                  {...register('role')}
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none appearance-none"
                >
                  <option value="viewer">{t('shares.roles.viewer')}</option>
                  <option value="editor">{t('shares.roles.editor')}</option>
                  <option value="admin">{t('shares.roles.admin')}</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      {t('shares.invite')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* List of Shares */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {t('shares.existingAccess')}
          </h3>
          
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-12 bg-secondary rounded-xl w-full"></div>
              <div className="h-12 bg-secondary rounded-xl w-full"></div>
            </div>
          ) : shares.length === 0 ? (
            <div className="py-8 text-center bg-secondary/30 rounded-2xl border border-dashed border-border">
              <Share2 size={32} className="mx-auto text-muted-foreground mb-2 opacity-20" />
              <p className="text-sm text-muted-foreground">{t('shares.noShares')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-primary border border-border">
                      <Mail size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{share.sharedWithEmail}</p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        <Shield size={10} />
                        {t(`shares.roles.${share.role}`)}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRevoke(share.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`revoke-${share.sharedWithEmail}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
