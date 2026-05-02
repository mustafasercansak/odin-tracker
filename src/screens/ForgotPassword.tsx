import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { mapAuthCodeToMessage } from '@/lib/auth-errors';

const resetSchema = z.object({
  email: z.string().email('auth.errors.invalid-email'),
});
type ResetInput = z.infer<typeof resetSchema>;

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetInput) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setSent(true);
      toast.success(t('auth.resetEmailSent'));
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
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.resetPassword')}</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <CheckCircle2 size={32} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{t('auth.resetEmailSent')}</p>
            <p className="text-xs text-muted-foreground font-medium">{getValues('email')}</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft size={16} />
              {t('auth.backToLogin')}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground text-center -mt-2">
              {t('auth.resetPasswordDescription')}
            </p>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  {t('auth.email')}
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                    <Mail size={16} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`block w-full pl-9 pr-3 py-2 bg-input border ${
                      errors.email ? 'border-destructive' : 'border-border'
                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                    placeholder="name@example.com"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">{t(errors.email.message as any)}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  t('auth.sendResetEmail')
                )}
              </button>
            </form>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft size={15} />
                {t('auth.backToLogin')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
