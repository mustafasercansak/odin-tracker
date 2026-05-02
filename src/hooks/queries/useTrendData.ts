import { useMemo } from 'react';
import { subMonths, isAfter, parseISO } from 'date-fns';
import { useLabRecords } from './useHealthRecords';
import { type TrendsTimeRange } from '@/store/useAppStore';

export interface TrendDataPoint {
  date: string;
  value: number;
  unit: string;
  flag: 'high' | 'low' | 'normal' | null;
  labName?: string;
  originalLabel?: string;
  referenceMin: number | null;
  referenceMax: number | null;
}

export function useMeasurementSeries(
  petId: string | null,
  parameter: string,
  timeRange: TrendsTimeRange
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

      // Filter by time range if not 'all'
      if (cutoffDate && !isAfter(recordDate, cutoffDate)) {
        return;
      }

      // Find measurements matching the parameter
      if (!record.measurements) return;

      const matchingMeasurements = record.measurements.filter(
        (m) => m.parameter === parameter
      );

      matchingMeasurements.forEach((m) => {
        points.push({
          date: record.recordDate,
          value: m.value,
          unit: m.unit,
          flag: m.flag,
          labName: record.labName,
          originalLabel: m.originalLabel,
          referenceMin: m.referenceMin,
          referenceMax: m.referenceMax,
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
