import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Info, Save } from 'lucide-react';
import type { Pet } from '@/schemas/pet';
import { usePets } from '@/hooks/queries/usePets';
import toast from 'react-hot-toast';

export const BodyConditionSlider: React.FC<{ pet: Pet }> = ({ pet }) => {
  const { t } = useTranslation();
  const { updatePet } = usePets();
  
  const [score, setScore] = useState<number>((pet as any).bcsScore || 5);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setScore((pet as any).bcsScore || 5);
  }, [(pet as any).bcsScore]);

  const getScoreDetails = (val: number) => {
    if (val <= 3) return { label: 'Zayıf (Underweight)', color: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500/30', fill: 'bg-amber-500/20' };
    if (val <= 5) return { label: 'İdeal (Ideal)', color: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500/30', fill: 'bg-emerald-500/20' };
    if (val <= 7) return { label: 'Kilolu (Overweight)', color: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500/30', fill: 'bg-orange-500/20' };
    return { label: 'Obez (Obese)', color: 'text-destructive', bg: 'bg-destructive', border: 'border-destructive/30', fill: 'bg-destructive/20' };
  };

  const details = getScoreDetails(score);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePet.mutateAsync({ id: pet.id, bcsScore: score } as any);
      toast.success(t('common.toasts.saved') + ' (BCS)');
    } catch {
      toast.error(t('common.toasts.error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`border ${details.border} ${details.fill} rounded-3xl p-6 relative overflow-hidden transition-colors duration-500`}>
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${details.bg} text-white flex items-center justify-center shadow-lg transition-colors duration-500`}>
              <Activity size={20} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight italic text-foreground">
                Vücut Kondisyon Skoru (BCS)
              </h3>
              <p className={`text-sm font-bold ${details.color} transition-colors duration-500`}>
                Skor: {score}/9 - {details.label}
              </p>
            </div>
          </div>
          {score !== ((pet as any).bcsScore || 5) && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 ${details.bg} text-white rounded-xl font-bold text-sm shadow-lg hover:brightness-110 transition-all disabled:opacity-50`}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save size={16} /> Kaydet</>
              )}
            </button>
          )}
        </div>

        {/* The Slider */}
        <div className="px-2">
          <input
            type="range"
            min="1"
            max="9"
            step="1"
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full h-3 bg-card rounded-lg appearance-none cursor-pointer outline-none border border-border slider-thumb-primary"
            style={{ accentColor: details.bg.replace('bg-', '') }}
          />
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 px-1">
            <span>Zayıf (1)</span>
            <span>İdeal (5)</span>
            <span>Obez (9)</span>
          </div>
        </div>

        {/* Visual Indicator (CSS Shapes simulating body width) */}
        <div className="flex justify-center items-end h-24 border-b-2 border-foreground/10 pb-2 relative">
          <div 
            className={`transition-all duration-500 ease-out ${details.bg} rounded-t-full shadow-lg relative`}
            style={{ 
              width: `${40 + (score * 12)}px`, 
              height: `${40 + (score * 4)}px`,
              borderBottomLeftRadius: '10px',
              borderBottomRightRadius: '10px'
            }}
          >
            {/* "Head" of the animal silhouette */}
            <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full ${details.bg} transition-colors duration-500`} />
            {/* "Ears" */}
            {pet.species === 'cat' && (
              <>
                <div className={`absolute -top-8 left-1/2 -translate-x-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] ${details.border.replace('border-', 'border-b-')} transition-colors duration-500`} />
                <div className={`absolute -top-8 left-1/2 translate-x-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] ${details.border.replace('border-', 'border-b-')} transition-colors duration-500`} />
              </>
            )}
            {pet.species === 'dog' && (
              <>
                <div className={`absolute -top-5 left-1/2 -translate-x-5 w-4 h-6 rounded-full ${details.bg} transition-colors duration-500 origin-top rotate-12`} />
                <div className={`absolute -top-5 left-1/2 translate-x-1 w-4 h-6 rounded-full ${details.bg} transition-colors duration-500 origin-top -rotate-12`} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
