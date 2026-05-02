import { differenceInYears, differenceInMonths, differenceInDays, parseISO } from 'date-fns';
import type { TFunction } from 'i18next';

export const calculateAge = (dateOfBirth: string, t: TFunction): string => {
  try {
    const birthDate = parseISO(dateOfBirth);
    const now = new Date();

    const years = differenceInYears(now, birthDate);
    if (years > 0) {
      return t('pets.age.years', { count: years });
    }

    const months = differenceInMonths(now, birthDate);
    if (months > 0) {
      return t('pets.age.months', { count: months });
    }

    const days = differenceInDays(now, birthDate);
    if (days > 0) {
      return t('pets.age.days', { count: days });
    }

    return t('pets.age.lessThanADay');
  } catch (error) {
    return '';
  }
};
