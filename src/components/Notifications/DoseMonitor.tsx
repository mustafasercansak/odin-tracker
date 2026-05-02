import React, { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { usePets } from '@/hooks/queries/usePets';
import { useAllMedications } from '@/hooks/queries/useMedications';
import { useAllVaccinationRecords } from '@/hooks/queries/useHealthRecords';

import { parseISO, isSameDay, isPast, addMinutes, isBefore } from 'date-fns';

export const DoseMonitor: React.FC = () => {
  const { t } = useTranslation();
  const { notificationsEnabled } = useAppStore();
  const { pets } = usePets();
  
  const petIds = React.useMemo(() => pets.map(p => p.id), [pets]);
  const { data: allMedications } = useAllMedications(petIds);
  const { vaccinationRecords } = useAllVaccinationRecords(petIds);

  const notifiedIds = React.useRef<Set<string>>(new Set());

  const checkReminders = useCallback(() => {
    if (!notificationsEnabled || Notification.permission !== 'granted') return;

    const now = new Date();
    const soon = addMinutes(now, 60); // Check for things due in the next hour

    // 1. Check Medications
    if (allMedications) {
      allMedications.forEach(med => {
        if (!med.active || !med.nextDoseDue) return;
        
        const dueAt = parseISO(med.nextDoseDue);
        const pet = pets.find(p => p.id === med.petId);
        const notificationKey = `med-${med.id}-${med.nextDoseDue}`;

        if (!notifiedIds.current.has(notificationKey) && isBefore(dueAt, soon) && (isPast(dueAt) || isSameDay(dueAt, now))) {
          new Notification(t('notifications.medicationReminder.title', { petName: pet?.name }), {
            body: t('notifications.medicationReminder.body', { medName: med.name, time: med.nextDoseDue.split('T')[1].substring(0, 5) }),
            icon: '/favicon.svg'
          });
          notifiedIds.current.add(notificationKey);
        }
      });
    }

    // 2. Check Vaccination Boosters
    vaccinationRecords.forEach(v => {
      const nextDate = (v as any).nextDoseDate;
      if (!nextDate) return;

      const dueAt = parseISO(nextDate);
      const pet = pets.find(p => p.id === v.petId);
      const notificationKey = `vac-${v.id}-${nextDate}`;

      if (!notifiedIds.current.has(notificationKey) && isSameDay(dueAt, now)) {
        new Notification(t('notifications.vaccineReminder.title', { petName: pet?.name }), {
          body: t('notifications.vaccineReminder.body', { vaccineName: v.description }),
          icon: '/favicon.svg'
        });
        notifiedIds.current.add(notificationKey);
      }
    });
  }, [notificationsEnabled, allMedications, vaccinationRecords, pets, t]);

  useEffect(() => {
    // Initial check
    checkReminders();

    // Set up interval to check every 15 minutes
    const interval = setInterval(checkReminders, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkReminders]);

  return null; // This component doesn't render anything
};
