import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { type Measurement, canonicalParameters } from '@/schemas/measurement';
import { canonicalUnits } from '@/lib/lab-defaults';
import { getParameterLabel } from '@/lib/i18n-helpers';

interface MeasurementEditorProps {
  measurements: Measurement[];
  onChange: (measurements: Measurement[]) => void;
}

export const MeasurementEditor: React.FC<MeasurementEditorProps> = ({
  measurements,
  onChange
}) => {
  const { t } = useTranslation();

  const addRow = () => {
    const newMeasurement: Measurement = {
      parameter: 'creatinine',
      originalLabel: '',
      value: 0,
      unit: canonicalUnits['creatinine'] || '',
      referenceMin: null,
      referenceMax: null,
      flag: 'normal',
      confidence: 'high',
      aiExtracted: false,
    };
    onChange([...measurements, newMeasurement]);
  };

  const removeRow = (index: number) => {
    const newMeasurements = [...measurements];
    newMeasurements.splice(index, 1);
    onChange(newMeasurements);
  };

  const updateRow = (index: number, updates: Partial<Measurement>) => {
    const newMeasurements = [...measurements];
    const updated = { ...newMeasurements[index], ...updates };

    // Auto-fill unit if parameter changed
    if (updates.parameter && canonicalUnits[updates.parameter as string]) {
      updated.unit = canonicalUnits[updates.parameter as string];
    }

    // Auto-calculate flag
    if (updated.value !== undefined || updated.referenceMin !== undefined || updated.referenceMax !== undefined) {
      const val = updated.value;
      const min = updated.referenceMin;
      const max = updated.referenceMax;

      if (min !== null && val < min) updated.flag = 'low';
      else if (max !== null && val > max) updated.flag = 'high';
      else if (min !== null || max !== null) updated.flag = 'normal';
      else updated.flag = null;
    }

    newMeasurements[index] = updated;
    onChange(newMeasurements);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t('healthRecords.measurements')}
        </h3>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors"
        >
          <Plus size={14} />
          {t('common.add')}
        </button>
      </div>

      {measurements.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-border rounded-2xl">
          <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                <th className="pb-2 font-bold">{t('lab.parameter')}</th>
                <th className="pb-2 font-bold w-20">{t('lab.value')}</th>
                <th className="pb-2 font-bold w-20">{t('lab.unit')}</th>
                <th className="pb-2 font-bold w-20">{t('lab.refMin')}</th>
                <th className="pb-2 font-bold w-20">{t('lab.refMax')}</th>
                <th className="pb-2 font-bold w-20 text-center">{t('lab.flag')}</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {measurements.map((m, index) => (
                <tr key={index} className="group">
                  <td className="py-3 pr-2">
                    <select
                      value={m.parameter}
                      onChange={(e) => updateRow(index, { parameter: e.target.value })}
                      className="w-full bg-transparent font-medium focus:text-primary outline-none"
                    >
                      {canonicalParameters.map((param) => (
                        <option key={param} value={param}>
                          {getParameterLabel(param, '', t)}
                        </option>
                      ))}
                      <option value="custom">-- {t('common.optional')} --</option>
                    </select>
                  </td>
                  <td className="py-3 pr-2">
                    <input
                      type="number"
                      step="0.01"
                      value={m.value}
                      onChange={(e) => updateRow(index, { value: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-transparent font-bold outline-none"
                    />
                  </td>
                  <td className="py-3 pr-2">
                    <input
                      type="text"
                      value={m.unit}
                      onChange={(e) => updateRow(index, { unit: e.target.value })}
                      className="w-full bg-transparent text-sm text-muted-foreground outline-none"
                    />
                  </td>
                  <td className="py-3 pr-2">
                    <input
                      type="number"
                      step="0.01"
                      value={m.referenceMin || ''}
                      onChange={(e) => updateRow(index, { referenceMin: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full bg-transparent text-sm outline-none"
                      placeholder="min"
                    />
                  </td>
                  <td className="py-3 pr-2">
                    <input
                      type="number"
                      step="0.01"
                      value={m.referenceMax || ''}
                      onChange={(e) => updateRow(index, { referenceMax: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full bg-transparent text-sm outline-none"
                      placeholder="max"
                    />
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.flag === 'high' ? 'bg-destructive/10 text-destructive' :
                        m.flag === 'low' ? 'bg-info/10 text-info' :
                          m.flag === 'normal' ? 'bg-green-500/10 text-green-500' :
                            'bg-muted text-muted-foreground'
                      }`}>
                      {m.flag ? t(`lab.flags.${m.flag}`) : '---'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {measurements.some(m => m.confidence === 'low') && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-xs font-medium leading-relaxed">
            {t('lab.confidence.low')}
          </p>
        </div>
      )}
    </div>
  );
};
