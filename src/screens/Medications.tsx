import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Pill, Plus, Clock, CheckCircle2, AlertCircle, ChevronRight, CalendarDays } from 'lucide-react';
import { format, parseISO, isSameDay, isPast } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { usePets } from '@/hooks/queries/usePets';
import { useAllMedications, useMedications } from '@/hooks/queries/useMedications';
import { useHealthRecords } from '@/hooks/queries/useHealthRecords';
import { useAppStore } from '@/store/useAppStore';
import { calculateNextDose, isDoseOverdue } from '@/lib/medication-helpers';
import type { Medication } from '@/schemas/medication';
import type { Pet } from '@/schemas/pet';

export default function Medications() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pets, isLoading: petsLoading } = usePets();
  const { setActiveModal } = useAppStore();
  const petIds = React.useMemo(() => pets.map(p => p.id), [pets]);
  const { data: allMedications, isLoading: medsLoading } = useAllMedications(petIds);
  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  // Mutations that accept petId in the payload (same pattern as Home.tsx)
  const { addRecord } = useHealthRecords(null);
  const { updateMedication } = useMedications(null);

  const petsMap = React.useMemo(() => {
    const map: Record<string, Pet> = {};
    pets.forEach(p => { map[p.id] = p; });
    return map;
  }, [pets]);

  const petMedMap = React.useMemo(() => {
    const map: Record<string, Medication[]> = {};
    if (!allMedications) return map;
    allMedications.forEach(m => {
      if (!map[m.petId]) map[m.petId] = [];
      map[m.petId].push(m);
    });
    return map;
  }, [allMedications]);

  const todaySchedule = React.useMemo(() => {
    if (!allMedications) return [];
    return allMedications
      .filter(m => m.active && m.nextDoseDue)
      .filter(m => {
        const d = parseISO(m.nextDoseDue!);
        return isSameDay(d, new Date()) || isPast(d);
      })
      .sort((a, b) => new Date(a.nextDoseDue!).getTime() - new Date(b.nextDoseDue!).getTime());
  }, [allMedications]);

  const overdueCount = todaySchedule.filter(m => isDoseOverdue(m.nextDoseDue)).length;
  const activeMedsCount = allMedications?.filter(m => m.active).length ?? 0;
  const petsWithMeds = pets.filter(p => petMedMap[p.id]?.some(m => m.active));

  const handleLogDose = async (med: Medication) => {
    try {
      const now = new Date().toISOString();
      const nextDose = calculateNextDose(now, med.frequency);
      await addRecord.mutateAsync({
        petId: med.petId,
        recordDate: now,
        recordType: 'medication',
        medicationId: med.id,
        description: `${med.name} - ${med.dosage} (${t(`medications.frequencies.${med.frequency}`)})`,
        notes: t('medications.doseLoggedAutomatically'),
      } as any);
      await updateMedication.mutateAsync({
        id: med.id,
        nextDoseDue: nextDose.toISOString(),
      });
      toast.success(t('medications.doseLoggedSuccess'));
    } catch {
      toast.error(t('common.toasts.error'));
    }
  };

  const handleExportCalendar = () => {
    if (!todaySchedule || todaySchedule.length === 0) {
      toast.error(t('medications.noSchedule'));
      return;
    }

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Odin Tracker//TR',
      'CALSCALE:GREGORIAN'
    ];

    todaySchedule.forEach(med => {
      const pet = petsMap[med.petId];
      if (!med.nextDoseDue) return;
      
      const d = parseISO(med.nextDoseDue);
      const startDate = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(d.getTime() + 15 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; 

      icsContent = icsContent.concat([
        'BEGIN:VEVENT',
        `DTSTAMP:${startDate}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:💊 ${pet?.name} - ${med.name}`,
        `DESCRIPTION:${t('medications.dose')}: ${med.dosage} \\n${t('common.frequency')}: ${t(`medications.frequencies.${med.frequency}`)}`,
        'END:VEVENT'
      ]);
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\\r\\n')], { type: 'text/calendar;charset=utf-8' });
    saveAs(blob, 'medication-schedule.ics');
    toast.success(t('common.toasts.saved') + ' (ICS)');
  };

  if (petsLoading || medsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center">
          <Pill size={40} className="text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">{t('pets.noPets')}</p>
        <button
          onClick={() => setActiveModal('pet_add')}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold"
        >
          {t('pets.addPet')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('medications.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'PPPP', { locale: dateLocale })}
          </p>
        </div>
        <button
          onClick={handleExportCalendar}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card font-bold text-sm hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title={t('medications.exportCalendar')}
        >
          <CalendarDays size={16} />
          <span className="hidden sm:inline">.ICS</span>
        </button>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-primary">{activeMedsCount}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            {t('medications.active')}
          </p>
        </div>
        <div className={`bg-card border rounded-2xl p-4 text-center transition-colors ${
          overdueCount > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-border'
        }`}>
          <p className={`text-2xl font-black ${overdueCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {overdueCount}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            {t('medications.overdue')}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-foreground">{todaySchedule.length}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            {t('medications.dueToday')}
          </p>
        </div>
      </div>

      {/* Today's Schedule */}
      {todaySchedule.length > 0 ? (
        <section className="bg-primary/5 border border-primary/20 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Clock size={20} />
            </div>
            <h2 className="text-lg font-bold">{t('home.schedule')}</h2>
            <span className="text-xs font-bold bg-primary/20 text-primary px-2.5 py-0.5 rounded-full">
              {todaySchedule.length}
            </span>
          </div>
          <div className="space-y-3">
            {todaySchedule.map(med => {
              const pet = petsMap[med.petId];
              const overdue = isDoseOverdue(med.nextDoseDue);
              return (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {pet?.photoUrl ? (
                      <img src={pet.photoUrl} alt={pet.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {pet?.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm truncate">{med.name}</p>
                        {overdue && (
                          <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {t('medications.overdue')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {pet?.name} · {med.dosage} · {format(parseISO(med.nextDoseDue!), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLogDose(med)}
                    className={`ml-3 px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all ${
                      overdue
                        ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
                    }`}
                  >
                    {t('medications.logDose')}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="bg-card border border-border rounded-3xl p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-green-500" />
          </div>
          <p className="font-bold text-lg">{t('medications.allDosesCompleted')}</p>
          <p className="text-sm text-muted-foreground">{t('medications.noSchedule')}</p>
        </section>
      )}

      {/* Active medications grouped by pet */}
      {petsWithMeds.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xl font-bold">{t('medications.activeTreatments')}</h2>
          {petsWithMeds.map(pet => {
            const meds = (petMedMap[pet.id] ?? []).filter(m => m.active);
            return (
              <div key={pet.id} className="bg-card border border-border rounded-3xl overflow-hidden">
                {/* Pet header bar */}
                <button
                  onClick={() => navigate(`/pet/${pet.id}`)}
                  className="w-full px-5 py-4 border-b border-border flex items-center justify-between bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {pet.photoUrl ? (
                      <img src={pet.photoUrl} alt={pet.name} className="w-9 h-9 rounded-xl object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                        {pet.name[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{pet.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {t(`pets.species_values.${pet.species}`)} · {meds.length} {t('medications.active').toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setActiveModal('medication_add', { petId: pet.id }); }}
                      className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"
                      title={t('medications.addMedication')}
                    >
                      <Plus size={16} />
                    </button>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </button>

                {/* Medication cards */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {meds.map(med => {
                    const overdue = isDoseOverdue(med.nextDoseDue);
                    return (
                      <div
                        key={med.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          overdue
                            ? 'bg-destructive/5 border-destructive/20'
                            : 'bg-secondary/30 border-border hover:border-border/80'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              overdue ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                            }`}>
                              <Pill size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{med.name}</p>
                              <p className="text-xs text-muted-foreground">{med.dosage}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveModal('medication_edit', med)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all flex-shrink-0 ml-1"
                          >
                            <AlertCircle size={14} />
                          </button>
                        </div>

                        <div className="space-y-1 mb-3">
                          <p className="text-xs text-muted-foreground">
                            {t(`medications.frequencies.${med.frequency}`)}
                            {med.endDate && (
                              <> · {t('medications.endsOn')} {format(parseISO(med.endDate), 'dd MMM', { locale: dateLocale })}</>
                            )}
                          </p>
                          {med.nextDoseDue && (
                            <p className={`text-xs font-semibold ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {overdue ? '⚠ ' : '⏰ '}
                              {t('medications.nextDose')}: {format(parseISO(med.nextDoseDue), 'dd MMM HH:mm', { locale: dateLocale })}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleLogDose(med)}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                            overdue
                              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          {t('medications.logDose')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Empty state — pets exist but no active meds */}
      {petsWithMeds.length === 0 && pets.length > 0 && (
        <section className="bg-card border border-dashed border-border rounded-3xl p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
            <Pill size={32} className="text-muted-foreground" />
          </div>
          <p className="font-bold text-lg">{t('medications.noActiveMedications')}</p>
          <div className="flex gap-3 flex-wrap justify-center">
            {pets.map(pet => (
              <button
                key={pet.id}
                onClick={() => setActiveModal('medication_add', { petId: pet.id })}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-all"
              >
                <Plus size={15} />
                {pet.name}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
