import React, { useMemo } from 'react';
import { ShieldCheck, Star, Bot, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Pet } from '@/schemas/pet';
import type { HealthRecord } from '@/schemas/healthRecord';
import type { Medication } from '@/schemas/medication';
import { isDoseOverdue } from '@/lib/medication-helpers';
import { subYears } from 'date-fns';

interface PetBadgesProps {
  pet: Pet;
  records: HealthRecord[];
  medications: Medication[];
}

export const PetBadges: React.FC<PetBadgesProps> = ({ records, medications }) => {
  const { t } = useTranslation();

  const badges = useMemo(() => {
    const earned = [];

    // 1. Protection Shield (Vaccinated within last year)
    const hasRecentVaccine = records.some(r => {
      if (r.recordType !== 'vaccination') return false;
      const oneYearAgo = subYears(new Date(), 1);
      return new Date(r.recordDate) > oneYearAgo;
    });
    
    if (hasRecentVaccine) {
      earned.push({
        id: 'shield',
        icon: <ShieldCheck size={16} className="text-emerald-500" />,
        label: t('badges.shield', 'Koruma Kalkanı'),
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20'
      });
    }

    // 2. Super Carer (Has active meds and NONE are overdue)
    const activeMeds = medications.filter(m => m.active);
    if (activeMeds.length > 0) {
      const hasOverdue = activeMeds.some(m => isDoseOverdue(m.nextDoseDue));
      if (!hasOverdue) {
        earned.push({
          id: 'star',
          icon: <Star size={16} className="text-amber-500" />,
          label: t('badges.star', 'Süper Bakıcı'),
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20'
        });
      }
    } else if (records.length > 5) {
      // Alternative condition for Super Carer if no meds but lots of records
      earned.push({
        id: 'star',
        icon: <Star size={16} className="text-amber-500" />,
        label: t('badges.star', 'Süper Bakıcı'),
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20'
      });
    }

    // 3. Future Vet (Has used AI for lab tests)
    const hasLabTest = records.some(r => r.recordType === 'lab_test' && r.measurements && r.measurements.length > 0);
    if (hasLabTest) {
      earned.push({
        id: 'bot',
        icon: <Bot size={16} className="text-indigo-500" />,
        label: t('badges.bot', 'Teknoloji Kurdu'),
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/20'
      });
    }

    return earned;
  }, [records, medications, t]);

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 animate-in fade-in zoom-in duration-500">
      <Award size={14} className="text-muted-foreground/50 mr-1" />
      {badges.map(b => (
        <div 
          key={b.id} 
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${b.bg} ${b.border} shadow-sm transition-all hover:scale-105 cursor-default`}
          title={b.label}
        >
          {b.icon}
          <span className="text-[10px] font-black uppercase tracking-wider">{b.label}</span>
        </div>
      ))}
    </div>
  );
};
