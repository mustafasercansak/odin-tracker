import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Moon, 
  Sun, 
  Globe, 
  LogOut, 
  Sparkles, 
  Info, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Download,
  Upload
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { useExtractionUsage } from '@/hooks/queries/useUsage';
import { exportUserData, importUserData } from '@/lib/dataManagement';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { theme, setTheme, setLocale } = useAppStore();
  const { data: usage, isLoading: usageLoading } = useExtractionUsage();
  
  const [exporting, setExporting] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      await exportUserData(user.uid);
      toast.success(t('settings.exportSuccess'));
    } catch (error) {
      toast.error(t('settings.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setImporting(true);
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importUserData(user.uid, data);
      toast.success(t('settings.importSuccess'));
      window.location.reload(); // Refresh to show new data
    } catch (error: any) {
      console.error('Import failed:', error);
      if (error.message === 'invalid_version') {
        toast.error(t('settings.importErrorVersion'));
      } else {
        toast.error(t('settings.importError'));
      }
    } finally {
      setImporting(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const changeLanguage = (lang: 'tr' | 'en') => {
    i18n.changeLanguage(lang);
    setLocale(lang);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
      </header>

      {/* User Profile */}
      <section className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.displayName || t('common.user')}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* App Settings */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">
          {t('settings.appSettings')}
        </h3>
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm divide-y divide-border">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary text-primary">
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <p className="font-bold">{t('settings.darkMode')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.darkModeDescription')}</p>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-muted'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Language Selector */}
          <div className="p-4 hover:bg-secondary/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary text-primary">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="font-bold">{t('settings.language')}</p>
                  <p className="text-xs text-muted-foreground">{i18n.language === 'tr' ? 'Türkçe' : 'English'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => changeLanguage('tr')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${i18n.language === 'tr' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
                >
                  TR
                </button>
                <button 
                  onClick={() => changeLanguage('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${i18n.language === 'en' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Extraction Status */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {t('settings.aiExtraction')}
          </h3>
          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase tracking-widest">
            {t('common.active')}
          </span>
        </div>
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="font-bold">{t('settings.aiProviderName')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.aiProviderDescription')}</p>
              </div>
            </div>
            <Zap size={20} className="text-primary" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {t('settings.monthlyUsage', { 
                  used: usage?.count || 0, 
                  limit: usage?.limit || 50 
                })}
              </span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000" 
                style={{ width: `${Math.min(((usage?.count || 0) / (usage?.limit || 50)) * 100, 100)}%` }}
              />
            </div>
            {usage?.monthStart && (
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest pt-1">
                {t('settings.quotaResetsOn')}: {format(parseISO(usage.monthStart), 'd MMMM', { locale: dateLocale })}
              </p>
            )}
          </div>

          <div className="p-4 bg-secondary/30 rounded-2xl border border-border flex items-start gap-3">
            <Info size={16} className="text-primary mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t('settings.aiPrivacyNotice')}
            </p>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">
          {t('settings.dataManagement')}
        </h3>
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm divide-y divide-border">
          {/* Export */}
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary text-primary">
                <Download size={20} />
              </div>
              <div>
                <p className="font-bold">{t('settings.exportData')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.exportDataDescription')}</p>
              </div>
            </div>
            {exporting ? (
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ChevronRight size={18} className="text-muted-foreground" />
            )}
          </button>

          {/* Import */}
          <div className="relative group">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={importing}
            />
            <div className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary text-primary">
                  <Upload size={20} />
                </div>
                <div>
                  <p className="font-bold">{t('settings.importData')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.importDataDescription')}</p>
                </div>
              </div>
              {importing ? (
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ChevronRight size={18} className="text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Privacy */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">
          {t('settings.privacy')}
        </h3>
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary text-primary">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="font-bold">{t('settings.shareDataAnon')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.shareDataAnonDescription')}</p>
              </div>
            </div>
            <button className="w-12 h-6 rounded-full bg-muted p-1 transition-colors">
              <div className="w-4 h-4 rounded-full bg-white transition-transform translate-x-0" />
            </button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="pt-4">
        <button 
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-4 bg-destructive/10 text-destructive rounded-2xl font-bold hover:bg-destructive/20 transition-all active:scale-[0.98]"
        >
          <LogOut size={20} />
          {t('common.logout')}
        </button>
      </section>

      <footer className="text-center py-8">
        <p className="text-xs text-muted-foreground">Odin Tracker v3.0.0-alpha</p>
        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mt-1 font-bold">Google DeepMind Edition</p>
      </footer>
    </div>
  );
}
