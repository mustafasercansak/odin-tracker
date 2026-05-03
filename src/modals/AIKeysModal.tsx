import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal';
import { useAppStore } from '@/store/useAppStore';
import { Key, Shield, Info, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export const AIKeysModal: React.FC = () => {
  const { t } = useTranslation();
  const { activeModal, setActiveModal, aiKeys, setAIKeys, preferredAIProvider, setPreferredAIProvider } = useAppStore();
  
  const [keys, setKeys] = React.useState(aiKeys);

  const isOpen = activeModal === 'ai_keys';

  const handleSave = () => {
    setAIKeys(keys);
    toast.success(t('common.toasts.saved'));
    setActiveModal(null);
  };

  const providers = [
    { id: 'auto', name: 'Auto (Best Availability)' },
    { id: 'google', name: 'Google Gemini' },
    { id: 'groq', name: 'Groq (Ultra-Fast)' },
    { id: 'openai', name: 'OpenAI (GPT)' },
    { id: 'anthropic', name: 'Anthropic (Claude)' },
  ] as const;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => setActiveModal(null)} 
      title={t('settings.aiKeys.title')}
    >
      <div className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
            Preferred Provider
          </label>
          <div className="grid grid-cols-1 gap-2">
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreferredAIProvider(p.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${preferredAIProvider === p.id ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-secondary/30 border-border hover:border-primary/30'}`}
              >
                <span className={`text-sm font-bold ${preferredAIProvider === p.id ? 'text-primary' : 'text-foreground'}`}>
                  {p.name}
                </span>
                {preferredAIProvider === p.id && (
                  <Shield size={16} className="text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-3">
          <Shield size={18} className="text-primary mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('settings.aiKeys.privacyNote')}
          </p>
        </div>

        <div className="space-y-4">
          {/* Google Gemini */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold flex items-center gap-2">
                Google Gemini API Key
              </label>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
              >
                Get Key <ExternalLink size={10} />
              </a>
            </div>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={keys.google || ''}
                onChange={(e) => setKeys({ ...keys, google: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full bg-secondary/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Used for 1.5-flash, 1.5-pro, and data extraction.
            </p>
          </div>

          {/* OpenAI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold flex items-center gap-2">
                OpenAI API Key
              </label>
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
              >
                Get Key <ExternalLink size={10} />
              </a>
            </div>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={keys.openai || ''}
                onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
                placeholder="sk-..."
                className="w-full bg-secondary/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Enables GPT-4o-mini as a high-speed fallback.
            </p>
          </div>

          {/* Anthropic */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold flex items-center gap-2">
                Anthropic API Key
              </label>
              <a 
                href="https://console.anthropic.com/settings/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
              >
                Get Key <ExternalLink size={10} />
              </a>
            </div>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={keys.anthropic || ''}
                onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
                placeholder="sk-ant-..."
                className="w-full bg-secondary/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Enables Claude 3.5 Sonnet for advanced analysis.
            </p>
          </div>

          {/* Groq */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold flex items-center gap-2">
                Groq API Key
              </label>
              <a 
                href="https://console.groq.com/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
              >
                Get Key <ExternalLink size={10} />
              </a>
            </div>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={keys.groq || ''}
                onChange={(e) => setKeys({ ...keys, groq: e.target.value })}
                placeholder="gsk_..."
                className="w-full bg-secondary/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Ultra-fast analysis using Llama 3 or Mixtral.
            </p>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button
            onClick={() => setActiveModal(null)}
            className="flex-1 py-3 rounded-xl bg-secondary font-bold text-sm hover:bg-secondary/80 transition-all"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
