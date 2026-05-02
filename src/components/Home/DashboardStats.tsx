import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { type Pet } from '@/schemas/pet';
import { useAllMedications } from '@/hooks/queries/useMedications';
import { useAllLabRecords, useAllVaccinationRecords } from '@/hooks/queries/useHealthRecords';
import { isDoseOverdue } from '@/lib/medication-helpers';
import { parseISO, isPast, differenceInDays, isSameDay } from 'date-fns';
import { 
  Activity, 
  AlertTriangle, 
  Pill, 
  Syringe, 
  TrendingUp,
  Shield,
  Heart
} from 'lucide-react';

interface DashboardStatsProps {
  pets: Pet[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ pets }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const petIds = React.useMemo(() => pets.map(p => p.id), [pets]);
  
  const { data: allMedications } = useAllMedications(petIds);
  const { labRecords } = useAllLabRecords(petIds);
  const { vaccinationRecords } = useAllVaccinationRecords(petIds);

  const stats = React.useMemo(() => {
    const activeMeds = (allMedications || []).filter((m: any) => m.active);
    const overdueMeds = activeMeds.filter((m: any) => 
      m.nextDoseDue && isDoseOverdue(m.nextDoseDue)
    );
    const todayDoses = activeMeds.filter((m: any) => 
      m.nextDoseDue && isSameDay(parseISO(m.nextDoseDue), new Date())
    );

    // Count abnormal lab values from the latest record per pet
    let abnormalCount = 0;
    let totalMeasurements = 0;
    pets.forEach(pet => {
      const petLabs = labRecords.filter((r: any) => r.petId === pet.id);
      if (petLabs.length > 0) {
        const latest = petLabs.sort((a: any, b: any) => 
          new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
        )[0];
        (latest.measurements || []).forEach((m: any) => {
          totalMeasurements++;
          if (m.flag && m.flag !== 'normal') abnormalCount++;
        });
      }
    });

    // Overdue vaccinations
    const overdueVaccines = vaccinationRecords.filter((v: any) => {
      if (!(v as any).nextDoseDate) return false;
      return isPast(parseISO((v as any).nextDoseDate));
    });

    // Upcoming vaccinations (within 30 days)
    const upcomingVaccines = vaccinationRecords.filter((v: any) => {
      if (!(v as any).nextDoseDate) return false;
      const date = parseISO((v as any).nextDoseDate);
      const days = differenceInDays(date, new Date());
      return days > 0 && days <= 30;
    });

    // Health score (simple algorithm)
    let score = 100;
    score -= overdueMeds.length * 10;
    score -= overdueVaccines.length * 15;
    score -= abnormalCount * 5;
    score = Math.max(0, Math.min(100, score));

    return {
      activeMeds: activeMeds.length,
      overdueMeds: overdueMeds.length,
      todayDoses: todayDoses.length,
      abnormalCount,
      totalMeasurements,
      overdueVaccines: overdueVaccines.length,
      upcomingVaccines: upcomingVaccines.length,
      healthScore: score,
    };
  }, [allMedications, labRecords, vaccinationRecords, pets]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-destructive';
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return 'stroke-green-500';
    if (score >= 50) return 'stroke-amber-500';
    return 'stroke-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return t('dashboard.scoreExcellent');
    if (score >= 50) return t('dashboard.scoreGood');
    return t('dashboard.scoreNeedsAttention');
  };

  // Don't show if no data at all
  if (pets.length === 0) return null;

  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (stats.healthScore / 100) * circumference;

  const cards = [
    {
      icon: <Pill size={20} />,
      label: t('dashboard.activeMeds'),
      value: stats.activeMeds,
      sub: stats.overdueMeds > 0 
        ? `${stats.overdueMeds} ${t('dashboard.overdue')}` 
        : stats.todayDoses > 0 
          ? `${stats.todayDoses} ${t('dashboard.dueToday')}`
          : t('dashboard.allOnTrack'),
      alert: stats.overdueMeds > 0,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      icon: <Syringe size={20} />,
      label: t('dashboard.vaccinations'),
      value: stats.overdueVaccines + stats.upcomingVaccines,
      sub: stats.overdueVaccines > 0 
        ? `${stats.overdueVaccines} ${t('dashboard.overdue')}` 
        : stats.upcomingVaccines > 0 
          ? `${stats.upcomingVaccines} ${t('dashboard.upcoming')}`
          : t('dashboard.allUpToDate'),
      alert: stats.overdueVaccines > 0,
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      icon: <Activity size={20} />,
      label: t('dashboard.labResults'),
      value: stats.totalMeasurements,
      sub: stats.abnormalCount > 0 
        ? `${stats.abnormalCount} ${t('dashboard.abnormal')}` 
        : t('dashboard.allNormal'),
      alert: stats.abnormalCount > 0,
      color: 'bg-amber-500/10 text-amber-500',
    },
    {
      icon: <Shield size={20} />,
      label: t('dashboard.petsMonitored'),
      value: pets.length,
      sub: t('dashboard.activeTracking'),
      alert: false,
      color: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Health Score Ring */}
        <div className="col-span-2 lg:col-span-1 glass-panel rounded-3xl p-6 border-border flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary/30 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
              <circle 
                cx="50" cy="50" r="40" fill="none" 
                strokeWidth="6" 
                strokeLinecap="round"
                className={`${getScoreRingColor(stats.healthScore)} transition-all duration-1000`}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-black ${getScoreColor(stats.healthScore)}`}>
                {stats.healthScore}
              </span>
            </div>
          </div>
          <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${getScoreColor(stats.healthScore)}`}>
            {getScoreLabel(stats.healthScore)}
          </p>
        </div>

        {/* Stat Cards */}
        {cards.map((card, idx) => (
          <div 
            key={idx}
            className="glass-panel rounded-3xl p-5 border-border relative overflow-hidden group hover:border-primary/30 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className={`w-10 h-10 rounded-2xl ${card.color} flex items-center justify-center mb-3`}>
                {card.icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                {card.label}
              </p>
              <p className="text-3xl font-black tracking-tight leading-none mb-1">
                {card.value}
              </p>
              <p className={`text-[11px] font-bold ${card.alert ? 'text-destructive' : 'text-muted-foreground'}`}>
                {card.alert && <AlertTriangle size={11} className="inline mr-1 -mt-0.5" />}
                {card.sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
