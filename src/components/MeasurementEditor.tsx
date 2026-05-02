import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, AlertTriangle, Sparkles } from 'lucide-react';
import { type Measurement, canonicalParameters } from '@/schemas/measurement';
import { canonicalUnits } from '@/lib/lab-defaults';
import { getParameterLabel } from '@/lib/i18n-helpers';

interface MeasurementEditorProps {
  measurements: Measurement[];
  onChange: (measurements: Measurement[]) => void;
}

const FLAG_STYLES = {
  high: { row: 'bg-destructive/5', badge: 'bg-destructive/10 text-destructive' },
  low: { row: 'bg-info/5', badge: 'bg-info/10 text-info' },
  normal: { row: '', badge: 'bg-green-500/10 text-green-600' },
  null: { row: '', badge: 'bg-muted text-muted-foreground' },
} as const;

const CONFIDENCE_STYLES = {
  high: 'text-primary/60',
  medium: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
  low: 'bg-destructive/10 text-destructive border border-destructive/20',
} as const;

export const MeasurementEditor: React.FC<MeasurementEditorProps> = ({ measurements, onChange }) => {
  const { t } = useTranslation();

  const addRow = () => {
    onChange([
      ...measurements,
      {
        parameter: 'creatinine',
        originalLabel: '',
        value: 0,
        unit: canonicalUnits['creatinine'] || '',
        referenceMin: null,
        referenceMax: null,
        flag: null,
        confidence: 'high',
        aiExtracted: false,
      },
    ]);
  };

  const removeRow = (index: number) => {
    const next = [...measurements];
    next.splice(index, 1);
    onChange(next);
  };

  const updateRow = (index: number, updates: Partial<Measurement>) => {
    const next = [...measurements];
    const updated = { ...next[index], ...updates };

    if (updates.parameter && canonicalUnits[updates.parameter as string]) {
      updated.unit = canonicalUnits[updates.parameter as string];
    }

    const val = updated.value;
    const min = updated.referenceMin;
    const max = updated.referenceMax;
    if (val !== undefined) {
      if (min !== null && val < min) updated.flag = 'low';
      else if (max !== null && val > max) updated.flag = 'high';
      else if (min !== null || max !== null) updated.flag = 'normal';
      else updated.flag = null;
    }

    next[index] = updated;
    onChange(next);
  };

  const lowConfidenceCount = measurements.filter(m => m.confidence === 'low').length;
  const aiCount = measurements.filter(m => m.aiExtracted).length;

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {aiCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              <Sparkles size={10} />
              {aiCount} {t('lab.aiExtractedBadge')}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-xs font-bold transition-colors"
        >
          <Plus size={13} />
          {t('common.add')}
        </button>
      </div>

      {measurements.length === 0 ? (
        <div
          className="py-10 flex flex-col items-center gap-3 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/30 hover:bg-secondary/20 transition-all"
          onClick={addRow}
        >
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
            <Plus size={20} />
          </div>
          <p className="text-sm text-muted-foreground font-medium">{t('common.noData')}</p>
          <p className="text-xs text-muted-foreground/70">{t('common.add')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[580px]">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('lab.parameter')}</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20">{t('lab.value')}</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20">{t('lab.unit')}</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-16">{t('lab.refMin')}</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-16">{t('lab.refMax')}</th>
                <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-24">{t('lab.flag')}</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((m, index) => {
                const flagKey = (m.flag ?? 'null') as keyof typeof FLAG_STYLES;
                const flagStyle = FLAG_STYLES[flagKey];
                const isAI = m.aiExtracted;
                const isLowConf = m.confidence === 'low';
                const isMedConf = m.confidence === 'medium';

                return (
                  <tr
                    key={index}
                    className={`group border-b border-border/50 last:border-0 transition-colors ${flagStyle.row} hover:bg-secondary/30`}
                  >
                    {/* Parameter */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={m.parameter}
                          onChange={(e) => updateRow(index, { parameter: e.target.value })}
                          className="bg-transparent text-sm font-semibold outline-none focus:text-primary cursor-pointer max-w-[140px] truncate"
                        >
                          {canonicalParameters.map((param) => (
                            <option key={param} value={param}>
                              {getParameterLabel(param, '', t)}
                            </option>
                          ))}
                          <option value={m.parameter !== 'creatinine' && !canonicalParameters.includes(m.parameter as any) ? m.parameter : 'other'}>
                            {m.parameter !== 'creatinine' && !canonicalParameters.includes(m.parameter as any)
                              ? m.parameter
                              : `— ${t('common.optional')} —`}
                          </option>
                        </select>
                        {isAI && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isLowConf ? CONFIDENCE_STYLES.low : isMedConf ? CONFIDENCE_STYLES.medium : 'text-primary/50 bg-primary/5'
                          }`}>
                            {isLowConf ? t('lab.verifyBadge') : t('lab.aiExtractedBadge')}
                          </span>
                        )}
                      </div>
                      {isAI && m.originalLabel && m.originalLabel !== getParameterLabel(m.parameter, '', t) && (
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate max-w-[160px]">
                          {m.originalLabel}
                        </p>
                      )}
                    </td>

                    {/* Value */}
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        step="0.01"
                        value={m.value}
                        onChange={(e) => updateRow(index, { value: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent text-sm font-bold outline-none focus:text-primary"
                      />
                    </td>

                    {/* Unit */}
                    <td className="px-3 py-2.5">
                      <input
                        type="text"
                        value={m.unit}
                        onChange={(e) => updateRow(index, { unit: e.target.value })}
                        className="w-full bg-transparent text-xs text-muted-foreground outline-none focus:text-foreground"
                      />
                    </td>

                    {/* Ref Min */}
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        step="0.01"
                        value={m.referenceMin ?? ''}
                        onChange={(e) => updateRow(index, { referenceMin: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full bg-transparent text-xs text-muted-foreground outline-none"
                        placeholder="—"
                      />
                    </td>

                    {/* Ref Max */}
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        step="0.01"
                        value={m.referenceMax ?? ''}
                        onChange={(e) => updateRow(index, { referenceMax: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full bg-transparent text-xs text-muted-foreground outline-none"
                        placeholder="—"
                      />
                    </td>

                    {/* Flag badge */}
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${flagStyle.badge}`}>
                        {m.flag ? t(`lab.flags.${m.flag}`) : '—'}
                      </span>
                    </td>

                    {/* Delete */}
                    <td className="px-2 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Low confidence warning */}
      {lowConfidenceCount > 0 && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
          <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 leading-relaxed">
            {t('lab.confidence.low')} ({lowConfidenceCount})
          </p>
        </div>
      )}
    </div>
  );
};
