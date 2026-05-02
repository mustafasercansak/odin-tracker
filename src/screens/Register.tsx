import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { auth } from '@/lib/firebase';
import { registerSchema, type RegisterInput } from '@/schemas/user';
import { mapAuthCodeToMessage } from '@/lib/auth-errors';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      
      await updateProfile(userCredential.user, {
        displayName: data.displayName,
      });

      // Save user to Firestore 'users' collection for sharing search
      const { setDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: data.email.toLowerCase(),
        displayName: data.displayName,
        createdAt: new Date().toISOString(),
      });

      toast.success(t('common.success'));
      navigate('/');
    } catch (error: any) {
      const messageKey = mapAuthCodeToMessage(error.code);
      toast.error(t(messageKey));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-2xl shadow-xl border border-border">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary tracking-tight">Odin Tracker</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('auth.register')}
          </p>
        </div>
        
        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
                {t('auth.displayName')}
              </label>
              <input
                id="displayName"
                type="text"
                autoComplete="name"
                className={`mt-1 block w-full px-3 py-2 bg-input border ${
                  errors.displayName ? 'border-destructive' : 'border-border'
                } rounded-lg shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                placeholder={t('auth.displayName')}
                {...register('displayName')}
              />
              {errors.displayName && (
                <p className="mt-1 text-xs text-destructive">{t(errors.displayName.message as any)}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`mt-1 block w-full px-3 py-2 bg-input border ${
                  errors.email ? 'border-destructive' : 'border-border'
                } rounded-lg shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                placeholder="name@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{t(errors.email.message as any)}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className={`mt-1 block w-full px-3 py-2 bg-input border ${
                  errors.password ? 'border-destructive' : 'border-border'
                } rounded-lg shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{t(errors.password.message as any)}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                {t('auth.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className={`mt-1 block w-full px-3 py-2 bg-input border ${
                  errors.confirmPassword ? 'border-destructive' : 'border-border'
                } rounded-lg shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                placeholder="••••••••"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-destructive">{t(errors.confirmPassword.message as any)}</p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              ) : (
                t('auth.register')
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
