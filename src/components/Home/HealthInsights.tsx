import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useAllLabRecords } from '@/hooks/queries/useHealthRecords';
import { type Pet } from '@/schemas/pet';
import { getParameterLabel } from '@/lib/i18n-helpers';

interface HealthInsightsProps {
  pets: Pet[];
}

export const HealthInsights: React.FC<HealthInsightsProps> = ({ pets }) => {
  const { t } = useTranslation();
  const petIds = pets.map(p => p.id);
  const { labRecords, isLoading } = useAllLabRecords(petIds);

  const insights = React.useMemo(() => {
    if (!labRecords.length) return [];

    const results: any[] = [];
    
    pets.forEach(pet => {
      const petRecords = labRecords.filter(r => r.petId === pet.id);
      if (petRecords.length < 2) return;

      // Group by parameter
      const paramData: Record<string, any[]> = {};
      petRecords.forEach(record => {
        record.measurements?.forEach(m => {
          if (!paramData[m.parameter]) paramData[m.parameter] = [];
          paramData[m.parameter].push({
            value: m.value,
            date: record.recordDate,
            flag: m.flag,
            originalLabel: m.originalLabel
          });
        });
      });

      // Analyze each parameter
      Object.keys(paramData).forEach(param => {
        const series = paramData[param].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        if (series.length < 2) return;

        const latest = series[0];
        const previous = series[1];
        const change = ((latest.value - previous.value) / previous.value) * 100;

        // Insight: Significant increase in critical parameters
        const criticalParams = ['creatinine', 'sdma', 'phosphorus', 'bun'];
        if (criticalParams.includes(param) && change > 15) {
          results.push({
            petId: pet.id,
            petName: pet.name,
            parameter: param,
            originalLabel: latest.originalLabel,
            type: 'warning',
            title: t('insights.significantIncrease', { param: getParameterLabel(param, latest.originalLabel, t) }),
            description: t('insights.increaseDescription', { pet: pet.name, param: getParameterLabel(param, latest.originalLabel, t), percent: Math.round(change) }),
            icon: <TrendingUp className="text-destructive" size={18} />
          });
        }

        // Insight: Back to normal
        if (latest.flag === 'normal' && previous.flag && previous.flag !== 'normal') {
          results.push({
            petId: pet.id,
            petName: pet.name,
            parameter: param,
            originalLabel: latest.originalLabel,
            type: 'success',
            title: t('insights.backToNormal', { param: getParameterLabel(param, latest.originalLabel, t) }),
            description: t('insights.normalDescription', { pet: pet.name, param: getParameterLabel(param, latest.originalLabel, t) }),
            icon: <CheckCircle2 className="text-green-500" size={18} />
          });
        }
      });
    });

    return results;
  }, [labRecords, pets, t]);

  if (isLoading || insights.length === 0) return null;

  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 px-2">
        <Sparkles size={18} className="text-primary" />
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
          {t('insights.title')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, idx) => (
          <div 
            key={`insight-${idx}`}
            className={`p-4 rounded-2xl border flex gap-4 items-start transition-all hover:scale-[1.01] ${
              insight.type === 'warning' 
                ? 'bg-destructive/5 border-destructive/20' 
                : 'bg-green-500/5 border-green-500/20'
            }`}
          >
            <div className={`p-2 rounded-xl flex-shrink-0 ${
              insight.type === 'warning' ? 'bg-destructive/10' : 'bg-green-500/10'
            }`}>
              {insight.icon}
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight mb-1">{insight.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
