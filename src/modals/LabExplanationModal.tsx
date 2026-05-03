import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal';
import { useAppStore } from '@/store/useAppStore';
import type { LabTestRecord } from '@/schemas/healthRecord';
import type { Pet } from '@/schemas/pet';
import { explainLabResults } from '@/lib/ai-assistant';
import { calculateAge } from '@/lib/pet-helpers';
import { Brain, MessageSquare, Info, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';

interface LabExplanationModalProps {
  record: LabTestRecord;
  pet: Pet;
}

export const LabExplanationModal: React.FC<LabExplanationModalProps> = ({ record, pet }) => {
  const { t, i18n } = useTranslation();
  const { activeModal, setActiveModal } = useAppStore();
  const [explanation, setExplanation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOpen = activeModal === 'lab_explanation';
  const age = pet.dateOfBirth ? calculateAge(pet.dateOfBirth, t) : 'Unknown age';

  useEffect(() => {
    if (isOpen && !explanation) {
      handleExplain();
    }
  }, [isOpen]);

  const handleExplain = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await explainLabResults(record, pet, age, i18n.language);
      setExplanation(result);
    } catch (err: any) {
      if (err.message === 'AI_QUOTA_EXCEEDED') {
        setError(t('lab.extraction.errors.quota_exceeded'));
      } else {
        setError(t('lab.extraction.errors.extraction_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => setActiveModal(null)} title={t('lab.explanation.title')}>
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg animate-pulse">{t('lab.explanation.loading')}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">{t('lab.explanation.processing')}</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-3xl text-center">
            <AlertCircle size={32} className="mx-auto text-destructive mb-3" />
            <p className="font-bold text-destructive">{error}</p>
            <button 
              onClick={handleExplain}
              className="mt-4 px-6 py-2 bg-secondary rounded-xl text-sm font-bold hover:bg-secondary/80 transition-all"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : (
          <>
            {/* AI Disclaimer */}
            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
              <Info size={18} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-primary/80 font-medium leading-relaxed">
                {t('lab.explanation.disclaimer')}
              </p>
            </div>

            {/* Summary */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Brain size={20} strokeWidth={2.5} />
                <h3 className="font-black uppercase tracking-tight italic">{t('lab.explanation.summary')}</h3>
              </div>
              <div className="p-5 bg-card border border-border rounded-3xl shadow-sm leading-relaxed text-foreground/90">
                {explanation.summary}
              </div>
            </div>

            {/* Key Findings */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <AlertCircle size={20} strokeWidth={2.5} />
                <h3 className="font-black uppercase tracking-tight italic">{t('lab.explanation.keyFindings')}</h3>
              </div>
              <div className="space-y-3">
                {explanation.keyFindings.map((finding: any, idx: number) => (
                  <div key={idx} className="p-4 bg-secondary/30 border border-border rounded-2xl group hover:border-primary/30 transition-colors">
                    <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">{finding.parameter}</p>
                    <p className="text-sm font-medium leading-relaxed">{finding.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vet Questions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <MessageSquare size={20} strokeWidth={2.5} />
                <h3 className="font-black uppercase tracking-tight italic">{t('lab.explanation.vetQuestions')}</h3>
              </div>
              <div className="space-y-2">
                {explanation.vetQuestions.map((q: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <ChevronRight size={14} strokeWidth={3} />
                    </div>
                    <p className="text-sm font-bold">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
