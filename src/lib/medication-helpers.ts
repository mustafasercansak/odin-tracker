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
