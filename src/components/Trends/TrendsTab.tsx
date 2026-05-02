import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore, type TrendsTimeRange } from '@/store/useAppStore';
import { useLabRecords } from '@/hooks/queries/useHealthRecords';
import { useMeasurementSeries } from '@/hooks/queries/useTrendData';
import { TrendChart } from './TrendChart';
import { getParameterLabel } from '@/lib/i18n-helpers';
import { TrendingUp, Filter, Calendar } from 'lucide-react';

interface TrendsTabProps {
  petId: string;
}

export const TrendsTab: React.FC<TrendsTabProps> = ({ petId }) => {
  const { t } = useTranslation();
  const { 
    trendsTimeRange, 
    setTrendsTimeRange, 
    trendsSelectedParams, 
    setTrendsSelectedParams 
  } = useAppStore();
  
  const { labRecords, isLoading } = useLabRecords(petId);

  // Get all unique parameters that have at least 2 measurements
  const availableParams = useMemo(() => {
    const counts: Record<string, number> = {};
    const labels: Record<string, string> = {};

    labRecords.forEach(record => {
      if (!record.measurements) return;
      record.measurements.forEach(m => {
        counts[m.parameter] = (counts[m.parameter] || 0) + 1;
        if (!labels[m.parameter]) {
          labels[m.parameter] = m.originalLabel;
        }
      });
    });

    return Object.keys(counts)
      .filter(param => counts[param] >= 2)
      .map(param => ({
        id: param,
        label: getParameterLabel(param, labels[param] || '', t),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [labRecords, t]);

  const toggleParam = (paramId: string) => {
    if (trendsSelectedParams.includes(paramId)) {
      setTrendsSelectedParams(trendsSelectedParams.filter(id => id !== paramId));
    } else {
      setTrendsSelectedParams([...trendsSelectedParams, paramId]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  if (labRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-card border border-dashed border-border rounded-3xl text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
          <TrendingUp size={32} />
        </div>
        <h3 className="text-xl font-bold mb-2">{t('trends.noData')}</h3>
        <p className="text-muted-foreground max-w-sm">
          Grafikleri görebilmek için öncelikle laboratuvar sonuçlarını ekleyin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Time Range Selector */}
        <div className="flex-shrink-0">
          <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            <Calendar size={14} />
            {t('trends.timeRange')}
          </label>
          <div className="flex gap-1 p-1 bg-secondary rounded-xl">
            {(['3m', '6m', '1y', 'all'] as TrendsTimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTrendsTimeRange(range)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  trendsTimeRange === range 
                    ? 'bg-card text-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(`trends.timeRanges.${range}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Parameter Selector */}
        <div className="flex-1">
          <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            <Filter size={14} />
            {t('trends.parameters')}
          </label>
          <div className="flex flex-wrap gap-2">
            {availableParams.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 italic">{t('trends.insufficientData')}</p>
            ) : (
              availableParams.map((param) => (
                <button
                  key={param.id}
                  onClick={() => toggleParam(param.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    trendsSelectedParams.includes(param.id)
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {param.label}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendsSelectedParams.map(paramId => (
          <ChartWrapper key={paramId} petId={petId} parameter={paramId} timeRange={trendsTimeRange} />
        ))}
        
        {trendsSelectedParams.length === 0 && availableParams.length > 0 && (
          <div className="md:col-span-2 lg:col-span-3 py-20 text-center bg-secondary/30 rounded-3xl border border-dashed border-border">
            <TrendingUp size={48} className="mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">Trendleri görmek için yukarıdan parametre seçin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Internal wrapper to handle data fetching per chart to avoid giant re-renders
const ChartWrapper: React.FC<{ petId: string, parameter: string, timeRange: TrendsTimeRange }> = ({ 
  petId, 
  parameter, 
  timeRange 
}) => {
  const { series, isLoading } = useMeasurementSeries(petId, parameter, timeRange);

  if (isLoading || series.length < 2) return null;

  return <TrendChart parameter={parameter} data={series} />;
};
