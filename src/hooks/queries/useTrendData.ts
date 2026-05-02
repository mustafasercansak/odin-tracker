import { useMemo } from 'react';
import { subMonths, isAfter, parseISO } from 'date-fns';
import { useLabRecords } from './useHealthRecords';
import { type TrendsTimeRange } from '@/store/useAppStore';
import { normalizeValue, convertValue } from '@/lib/unit-converters';
import { getReferenceRange } from '@/lib/lab-references';

export interface TrendDataPoint {
  date: string;
  value: number;
  unit: string;
  flag: 'high' | 'low' | 'normal' | null;
  labName?: string;
  originalLabel?: string;
  referenceMin: number | null;
  referenceMax: number | null;
  wasConverted?: boolean;
  originalValue?: number;
  originalUnit?: string;
}

export function useMeasurementSeries(
  petId: string | null,
  parameter: string,
  timeRange: TrendsTimeRange,
  labNames: string[] = []
) {
  const { labRecords, isLoading } = useLabRecords(petId);

  const series = useMemo(() => {
    if (!labRecords.length) return [];

    // 1. Calculate cutoff date
    let cutoffDate: Date | null = null;
    const now = new Date();

    if (timeRange === '3m') cutoffDate = subMonths(now, 3);
    else if (timeRange === '6m') cutoffDate = subMonths(now, 6);
    else if (timeRange === '1y') cutoffDate = subMonths(now, 12);

    // 2. Filter by date and flatten measurements
    const points: TrendDataPoint[] = [];

    labRecords.forEach((record) => {
      const recordDate = parseISO(record.recordDate);
      const recordLabName = record.labName || '';

      // Filter by time range if not 'all'
      if (cutoffDate && !isAfter(recordDate, cutoffDate)) {
        return;
      }

      // Filter by lab name if filter is active
      if (labNames.length > 0 && !labNames.includes(recordLabName)) {
        return;
      }

      // Find measurements matching the parameter
      if (!record.measurements) return;

      const matchingMeasurements = record.measurements.filter(
        (m) => m.parameter === parameter
      );

      matchingMeasurements.forEach((m) => {
        const normalized = normalizeValue(m.value, m.unit, parameter);
        
        // Also normalize reference ranges if value was converted
        let refMin = m.referenceMin;
        let refMax = m.referenceMax;
        
        if (normalized.wasConverted) {
          if (refMin !== null) refMin = convertValue(refMin, m.unit, normalized.unit, parameter);
          if (refMax !== null) refMax = convertValue(refMax, m.unit, normalized.unit, parameter);
        }

        // Fallback to standard reference range if both are null
        if (refMin === null && refMax === null) {
          const standardRef = getReferenceRange(parameter);
          if (standardRef) {
            // Need to ensure units match or convert
            refMin = standardRef.min;
            refMax = standardRef.max;
            
            // If the standard ref unit doesn't match the normalized unit, convert it
            if (standardRef.unit !== normalized.unit) {
              refMin = convertValue(refMin, standardRef.unit, normalized.unit, parameter);
              refMax = convertValue(refMax, standardRef.unit, normalized.unit, parameter);
            }
          }
        }

        points.push({
          date: record.recordDate,
          value: normalized.value,
          unit: normalized.unit,
          flag: m.flag,
          labName: record.labName,
          originalLabel: m.originalLabel,
          referenceMin: refMin,
          referenceMax: refMax,
          wasConverted: normalized.wasConverted,
          originalValue: m.value,
          originalUnit: m.unit,
        });
      });
    });

    // 3. Sort by date ascending for charts
    return points.sort((a, b) => a.date.localeCompare(b.date));
  }, [labRecords, parameter, timeRange]);

  return {
    series,
    isLoading,
  };
}
