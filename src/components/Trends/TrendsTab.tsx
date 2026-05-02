import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore, type TrendsTimeRange } from '@/store/useAppStore';
import { useLabRecords } from '@/hooks/queries/useHealthRecords';
import { useMeasurementSeries } from '@/hooks/queries/useTrendData';
import { TrendChart } from './TrendChart';
import { getParameterLabel } from '@/lib/i18n-helpers';
import { TrendingUp, Filter, Search, X, CheckSquare, Square, AlertTriangle, Building2 } from 'lucide-react';

interface TrendsTabProps {
  petId: string;
}

export const TrendsTab: React.FC<TrendsTabProps> = ({ petId }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAnomalous, setShowOnlyAnomalous] = useState(false);
  
  const {
    trendsTimeRange, 
    setTrendsTimeRange, 
    trendsSelectedParams, 
    setTrendsSelectedParams,
    trendsSelectedLabs,
    setTrendsSelectedLabs
  } = useAppStore();
  
  const { labRecords, isLoading } = useLabRecords(petId);

  // Get all unique parameters with metadata (count and status)
  const availableParams = useMemo(() => {
    const paramsMap: Record<string, { label: string, originalLabel: string, count: number, hasAnomalies: boolean }> = {};

    labRecords.forEach(record => {
      if (!record.measurements) return;
      record.measurements.forEach(m => {
        if (!paramsMap[m.parameter]) {
          paramsMap[m.parameter] = {
            label: getParameterLabel(m.parameter, m.originalLabel || '', t),
            originalLabel: m.originalLabel || '',
            count: 0,
            hasAnomalies: false
          };
        }
        paramsMap[m.parameter].count++;
        if (m.flag === 'high' || m.flag === 'low') {
          paramsMap[m.parameter].hasAnomalies = true;
        }
      });
    });

    return Object.entries(paramsMap)
      .filter(([_, data]) => data.count >= 2)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [labRecords, t]);

  const availableLabs = useMemo(() => {
    const labs = new Set<string>();
    labRecords.forEach(record => {
      if (record.labName) labs.add(record.labName);
    });
    return Array.from(labs).sort();
  }, [labRecords]);

  const filteredParams = useMemo(() => {
    return availableParams.filter(p => {
      const matchesSearch = p.label.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAnomalous = !showOnlyAnomalous || p.hasAnomalies;
      return matchesSearch && matchesAnomalous;
    });
  }, [availableParams, searchQuery, showOnlyAnomalous]);

  const toggleParam = (paramId: string) => {
    if (trendsSelectedParams.includes(paramId)) {
      setTrendsSelectedParams(trendsSelectedParams.filter(id => id !== paramId));
    } else {
      setTrendsSelectedParams([...trendsSelectedParams, paramId]);
    }
  };

  const selectAll = () => setTrendsSelectedParams(availableParams.map(p => p.id));
  const clearAll = () => setTrendsSelectedParams([]);

  const toggleLab = (labName: string) => {
    if (trendsSelectedLabs.includes(labName)) {
      setTrendsSelectedLabs(trendsSelectedLabs.filter(l => l !== labName));
    } else {
      setTrendsSelectedLabs([...trendsSelectedLabs, labName]);
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
      {/* Controls Container - Sticky */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 border-b border-border shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Row 1: Time Range & Main Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
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

            <div className="flex items-center gap-2">
              <button 
                onClick={selectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                <CheckSquare size={14} />
                {t('trends.selectAll')}
              </button>
              <button 
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-destructive transition-colors"
              >
                <Square size={14} />
                {t('trends.clearAll')}
              </button>
            </div>
          </div>

          {/* Row 2: Search & Anomalous Toggle */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder={t('trends.searchParameters')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary border-none rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowOnlyAnomalous(!showOnlyAnomalous)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                showOnlyAnomalous 
                  ? 'bg-destructive/10 border-destructive text-destructive' 
                  : 'bg-secondary border-transparent text-muted-foreground hover:border-border'
              }`}
            >
              <AlertTriangle size={16} />
              {t('trends.showAnomalous')}
            </button>
          </div>
        </div>
      </div>

      {/* Lab Filter Selection */}
      {availableLabs.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 delay-75">
          <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
            <Building2 size={14} />
            {t('trends.labs')} ({availableLabs.length})
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTrendsSelectedLabs([])}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
                trendsSelectedLabs.length === 0
                  ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {t('common.all')}
            </button>
            {availableLabs.map((lab) => {
              const isSelected = trendsSelectedLabs.includes(lab);
              return (
                <button
                  key={lab}
                  onClick={() => toggleLab(lab)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {lab}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Parameter Selection Grid */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500 delay-150">
        <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          <Filter size={14} />
          {t('trends.parameters')} ({filteredParams.length})
        </label>
        <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
          {filteredParams.length === 0 ? (
            <div className="w-full py-8 text-center bg-secondary/50 rounded-2xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">{t('trends.noParametersMatch')}</p>
            </div>
          ) : (
            filteredParams.map((param) => {
              const isSelected = trendsSelectedParams.includes(param.id);
              return (
                <button
                  key={param.id}
                  onClick={() => toggleParam(param.id)}
                  className={`group relative flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {param.hasAnomalies && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground animate-pulse' : 'bg-destructive'}`} />
                  )}
                  {param.label}
                  <span className={`ml-1 text-[10px] opacity-50 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                    {param.count}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {trendsSelectedParams.map(paramId => (
          <ChartWrapper 
            key={paramId} 
            petId={petId} 
            parameter={paramId} 
            timeRange={trendsTimeRange} 
            labNames={trendsSelectedLabs}
          />
        ))}
        
        {trendsSelectedParams.length === 0 && availableParams.length > 0 && (
          <div className="md:col-span-2 lg:col-span-3 py-32 text-center bg-secondary/20 rounded-[40px] border border-dashed border-border group hover:border-primary/30 transition-colors">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp size={40} className="text-primary/40" />
            </div>
            <h4 className="text-lg font-bold text-foreground mb-2">{t('trends.selectParameterTitle')}</h4>
            <p className="text-muted-foreground font-medium max-w-xs mx-auto">
              Trendleri ve değişimleri incelemek için yukarıdaki listeden parametre seçin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Internal wrapper to handle data fetching per chart to avoid giant re-renders
const ChartWrapper: React.FC<{ 
  petId: string, 
  parameter: string, 
  timeRange: TrendsTimeRange,
  labNames: string[]
}> = ({ 
  petId, 
  parameter, 
  timeRange,
  labNames
}) => {
  const { series, isLoading } = useMeasurementSeries(petId, parameter, timeRange, labNames);

  if (isLoading || series.length < 2) return null;

  return (
    <div className="animate-in zoom-in-95 fade-in duration-500">
      <TrendChart parameter={parameter} data={series} />
    </div>
  );
};
