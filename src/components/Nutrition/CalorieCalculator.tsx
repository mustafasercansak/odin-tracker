import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator } from 'lucide-react';
import type { Pet } from '@/schemas/pet';

export const CalorieCalculator: React.FC<{ pet: Pet }> = ({ pet }) => {
  const { t } = useTranslation();
  const [factor, setFactor] = useState(pet.species === 'cat' ? 1.2 : 1.6);
  const [foodCalories, setFoodCalories] = useState<number | ''>('');

  const rer = useMemo(() => {
    if (!pet.weightKg) return 0;
    return Math.round(70 * Math.pow(pet.weightKg, 0.75));
  }, [pet.weightKg]);

  const der = useMemo(() => {
    return Math.round(rer * factor);
  }, [rer, factor]);

  const foodAmount = useMemo(() => {
    if (!foodCalories || der === 0) return 0;
    return Math.round((der / Number(foodCalories)) * 100);
  }, [der, foodCalories]);

  if (!pet.weightKg) {
    return (
      <div className="bg-secondary/30 border border-border rounded-3xl p-6 text-center text-muted-foreground text-sm">
        {t('nutrition.calculator.needsWeight', 'Lütfen kalori hesabı için evcil hayvanınızın kilosunu güncelleyin.')}
      </div>
    );
  }

  const factors = pet.species === 'cat' ? [
    { value: 1.2, label: t('nutrition.factors.cat.neutered', 'Kısırlaştırılmış (Neutered)') },
    { value: 1.4, label: t('nutrition.factors.cat.intact', 'Kısırlaştırılmamış (Intact)') },
    { value: 1.0, label: t('nutrition.factors.cat.inactive', 'Düşük Aktivite (Low Activity)') },
    { value: 0.8, label: t('nutrition.factors.cat.weightLoss', 'Kilo Kaybı (Weight Loss)') }
  ] : [
    { value: 1.6, label: t('nutrition.factors.dog.neutered', 'Kısırlaştırılmış (Neutered)') },
    { value: 1.8, label: t('nutrition.factors.dog.intact', 'Kısırlaştırılmamış (Intact)') },
    { value: 1.2, label: t('nutrition.factors.dog.inactive', 'Düşük Aktivite (Low Activity)') },
    { value: 1.0, label: t('nutrition.factors.dog.weightLoss', 'Kilo Kaybı (Weight Loss)') }
  ];

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute -top-4 -right-4 opacity-5 rotate-12">
         <Calculator size={120} />
      </div>
      
      <div className="relative z-10 space-y-5">
        <div className="flex items-center gap-3 text-primary">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Calculator size={20} />
          </div>
          <h3 className="font-black uppercase tracking-tight italic">
            {t('nutrition.calculator.title', 'Günlük Kalori (DER) Hesaplayıcı')}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4">
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
               {t('nutrition.calculator.rer', 'RER (Dinlenme)')}
             </p>
             <p className="text-2xl font-black">{rer} <span className="text-sm font-bold text-muted-foreground">kcal/gün</span></p>
          </div>
          <div className="bg-primary text-primary-foreground rounded-2xl p-4 shadow-lg shadow-primary/20">
             <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">
               {t('nutrition.calculator.der', 'DER (Hedef)')}
             </p>
             <p className="text-2xl font-black">{der} <span className="text-sm font-bold opacity-80">kcal/gün</span></p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
              {t('nutrition.calculator.activityLevel', 'Aktivite Seviyesi')}
            </label>
            <select
              value={factor}
              onChange={(e) => setFactor(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
            >
              {factors.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
              {t('nutrition.calculator.foodCalories', 'Mama Kalorisi (kcal / 100g)')}
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={foodCalories}
                onChange={(e) => setFoodCalories(e.target.value ? Number(e.target.value) : '')}
                placeholder="Örn: 380"
                className="flex-1 px-3 py-2.5 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
              />
              {foodAmount > 0 && (
                <div className="flex-1 bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl flex items-center justify-center font-black">
                  {t('nutrition.calculator.dailyAmount', 'Günlük {{amount}}g').replace('{{amount}}', foodAmount.toString())}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
