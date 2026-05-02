import { addHours, addDays, parseISO } from 'date-fns';
import { type Frequency } from '@/schemas/medication';

/**
 * Calculates the next dose due date based on the last dose date and frequency.
 * 
 * @param lastDoseAt ISO date string of the last dose
 * @param frequency Medication frequency
 * @returns Date object for the next dose
 */
export function calculateNextDose(lastDoseAt: string, frequency: Frequency): Date {
  const lastDate = parseISO(lastDoseAt);

  switch (frequency) {
    case 'daily':
      return addDays(lastDate, 1);
    case 'twice_daily':
      return addHours(lastDate, 12);
    case 'three_times_daily':
      return addHours(lastDate, 8);
    case 'four_times_daily':
      return addHours(lastDate, 6);
    case 'every_other_day':
      return addDays(lastDate, 2);
    case 'weekly':
      return addDays(lastDate, 7);
    case 'as_needed':
    default:
      return lastDate; // No fixed schedule
  }
}

/**
 * Checks if a dose is overdue.
 * 
 * @param nextDoseDue ISO date string
 * @returns boolean
 */
export function isDoseOverdue(nextDoseDue: string | undefined): boolean {
  if (!nextDoseDue) return false;
  return new Date() > parseISO(nextDoseDue);
}

/**
 * Calculates medication adherence (percentage of doses logged vs expected) 
 * for the last 7 days.
 */
export function calculateAdherence(
  logs: { recordDate: string }[],
  frequency: Frequency
): number {
  if (frequency === 'as_needed') return 100;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const relevantLogs = logs.filter(l => parseISO(l.recordDate) >= sevenDaysAgo);
  
  let expectedDoses = 0;
  switch (frequency) {
    case 'daily': expectedDoses = 7; break;
    case 'twice_daily': expectedDoses = 14; break;
    case 'three_times_daily': expectedDoses = 21; break;
    case 'four_times_daily': expectedDoses = 28; break;
    case 'every_other_day': expectedDoses = 3.5; break;
    case 'weekly': expectedDoses = 1; break;
    default: expectedDoses = 7;
  }

  if (expectedDoses === 0) return 100;
  
  const score = (relevantLogs.length / expectedDoses) * 100;
  return Math.min(Math.round(score), 100);
}
