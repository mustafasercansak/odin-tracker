import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHealthRecords } from '@/hooks/queries/useHealthRecords';
import { Heart, Utensils, Zap, Smile, Check, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface SymptomLoggerProps {
  petId: string;
}

export const SymptomLogger: React.FC<SymptomLoggerProps> = ({ petId }) => {
  const { t } = useTranslation();
  const { addRecord } = useHealthRecords(petId);
  const [appetite, setAppetite] = useState<'low' | 'normal' | 'high'>('normal');
  const [energy, setEnergy] = useState<'low' | 'normal' | 'high'>('normal');
  const [mood, setMood] = useState<'low' | 'normal' | 'high'>('normal');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await addRecord.mutateAsync({
        petId,
        recordDate: new Date().toISOString(),
        recordType: 'symptom_checkin',
        description: t('symptoms.checkin.dailySummary'),
        appetite,
        energy,
        mood,
      });
      toast.success(t('symptoms.checkin.success'));
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const OptionButton = ({ label, value, current, setter, icon: Icon, color }: any) => (
    <button
      onClick={() => setter(value)}
      className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
        current === value 
          ? `${color} border-current shadow-sm` 
          : 'bg-card border-border text-muted-foreground hover:border-primary/30'
      }`}
    >
      <Icon size={16} className={current === value ? 'animate-pulse' : ''} />
      <span className="text-[10px] font-bold uppercase tracking-tighter">{t(`common.${label}`)}</span>
    </button>
  );

  return (
    <div className="glass-panel rounded-3xl p-6 border-border relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Heart size={64} fill="currentColor" className="text-primary" />
      </div>

      <div className="relative z-10">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
          <Zap size={16} fill="currentColor" />
          {t('symptoms.checkin.title')}
        </h3>

        <div className="space-y-6">
          {/* Appetite */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Utensils size={12} />
                {t('symptoms.checkin.appetite')}
              </span>
              <span className="text-[10px] font-bold text-primary uppercase">{t(`common.${appetite}`)}</span>
            </div>
            <div className="flex gap-2">
              <OptionButton label="low" value="low" current={appetite} setter={setAppetite} icon={Utensils} color="text-orange-500 bg-orange-500/10" />
              <OptionButton label="normal" value="normal" current={appetite} setter={setAppetite} icon={Utensils} color="text-green-500 bg-green-500/10" />
              <OptionButton label="high" value="high" current={appetite} setter={setAppetite} icon={Utensils} color="text-blue-500 bg-blue-500/10" />
            </div>
          </div>

          {/* Energy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Zap size={12} />
                {t('symptoms.checkin.energy')}
              </span>
              <span className="text-[10px] font-bold text-primary uppercase">{t(`common.${energy}`)}</span>
            </div>
            <div className="flex gap-2">
              <OptionButton label="low" value="low" current={energy} setter={setEnergy} icon={Zap} color="text-orange-500 bg-orange-500/10" />
              <OptionButton label="normal" value="normal" current={energy} setter={setEnergy} icon={Zap} color="text-green-500 bg-green-500/10" />
              <OptionButton label="high" value="high" current={energy} setter={setEnergy} icon={Zap} color="text-blue-500 bg-blue-500/10" />
            </div>
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Smile size={12} />
                {t('symptoms.checkin.mood')}
              </span>
              <span className="text-[10px] font-bold text-primary uppercase">{t(`common.${mood}`)}</span>
            </div>
            <div className="flex gap-2">
              <OptionButton label="low" value="low" current={mood} setter={setMood} icon={Smile} color="text-orange-500 bg-orange-500/10" />
              <OptionButton label="normal" value="normal" current={mood} setter={setMood} icon={Smile} color="text-green-500 bg-green-500/10" />
              <OptionButton label="high" value="high" current={mood} setter={setMood} icon={Smile} color="text-blue-500 bg-blue-500/10" />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Check size={16} strokeWidth={3} />
                {t('symptoms.checkin.logNow')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
