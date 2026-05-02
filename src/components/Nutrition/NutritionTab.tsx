import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Pet } from '@/schemas/pet';
import { Utensils, Clock, Plus, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface NutritionTabProps {
  pet: Pet;
  canEdit: boolean;
  onEdit: () => void;
}

export const NutritionTab: React.FC<NutritionTabProps> = ({ pet, canEdit, onEdit }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('nutrition.title')}</h2>
        {canEdit && (
          <button 
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-all text-sm"
          >
            {t('common.edit')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Food */}
        <div className="glass-panel rounded-3xl p-6 border-border flex flex-col gap-4">
          <div className="flex items-center gap-3 text-primary">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Utensils size={20} />
            </div>
            <h3 className="font-black uppercase tracking-tight italic">{t('nutrition.currentFood')}</h3>
          </div>
          
          <div className="flex-1">
            {pet.currentFood ? (
              <p className="text-lg font-bold leading-tight">{pet.currentFood}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">{t('nutrition.noFoodSpecified')}</p>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="glass-panel rounded-3xl p-6 border-border flex flex-col gap-4">
          <div className="flex items-center gap-3 text-primary">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <h3 className="font-black uppercase tracking-tight italic">{t('nutrition.feedingSchedule')}</h3>
          </div>
          
          <div className="flex-1">
            {pet.feedingSchedule ? (
              <p className="text-lg font-bold leading-tight">{pet.feedingSchedule}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">{t('nutrition.noScheduleSpecified')}</p>
            )}
          </div>
        </div>

        {/* Supplements */}
        <div className="glass-panel rounded-3xl p-6 border-border col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 text-primary mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Plus size={20} />
            </div>
            <h3 className="font-black uppercase tracking-tight italic">{t('nutrition.supplements')}</h3>
          </div>
          
          <div>
            {pet.supplements ? (
              <p className="text-base font-medium leading-relaxed bg-secondary/30 p-4 rounded-2xl border border-border/50">
                {pet.supplements}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">{t('nutrition.noSupplementsSpecified')}</p>
            )}
          </div>
        </div>

        {/* Allergies (Highlighted) */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-6 col-span-1 md:col-span-2 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
            <AlertTriangle size={120} className="text-destructive" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 text-destructive mb-4">
              <div className="w-10 h-10 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-black uppercase tracking-tight italic">{t('pets.allergies')}</h3>
            </div>
            
            {pet.allergies ? (
              <div className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20">
                <p className="text-destructive font-black text-lg">{pet.allergies}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-500 font-bold bg-green-500/5 p-4 rounded-2xl border border-green-500/20">
                <ShieldCheck size={18} />
                <span>{t('nutrition.noKnownAllergies')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3">
        <Info size={18} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-primary/80 font-medium">
          {t('nutrition.disclaimer')}
        </p>
      </div>
    </div>
  );
};
