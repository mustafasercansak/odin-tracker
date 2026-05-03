import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pill, Plus, Clock, CheckCircle2, AlertCircle, Calendar, ChevronDown, ChevronUp, Bell, Edit2 } from 'lucide-react';
import { useMedications } from '@/hooks/queries/useMedications';
import { useHealthRecords } from '@/hooks/queries/useHealthRecords';
import { usePets } from '@/hooks/queries/usePets';
import { useAppStore } from '@/store/useAppStore';
import { calculateNextDose, isDoseOverdue, calculateAdherence } from '@/lib/medication-helpers';
import { requestNotificationPermission } from '@/lib/messaging';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO, isSameDay, isPast } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { SwipeableRecord } from '@/components/Medical/SwipeableRecord';

interface MedicationsTabProps {
  petId: string;
}

export const MedicationsTab: React.FC<MedicationsTabProps> = ({ petId }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { pets } = usePets();
  const pet = pets.find(p => p.id === petId);
  const { medications, updateMedication, deleteMedication, isLoading } = useMedications(petId);
  const { records, addRecord } = useHealthRecords(petId);
  const { setActiveModal } = useAppStore();

  const [pendingDeletions, setPendingDeletions] = React.useState<Set<string>>(new Set());
  const deletionTimeouts = React.useRef<Record<string, any>>({});

  const handleDeleteMedication = (medId: string) => {
    // Optimistically hide from UI
    setPendingDeletions(prev => new Set(prev).add(medId));

    toast((toastInfo) => (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{t('common.toasts.deletedWithUndo')}</span>
        <button 
          onClick={() => {
            // Undo logic
            if (deletionTimeouts.current[medId]) {
              clearTimeout(deletionTimeouts.current[medId]);
              delete deletionTimeouts.current[medId];
            }
            setPendingDeletions(prev => {
              const next = new Set(prev);
              next.delete(medId);
              return next;
            });
            toast.dismiss(toastInfo.id);
          }}
          className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
        >
          {t('common.undo')}
        </button>
      </div>
    ), { duration: 5000 });

    // Actual deletion after 5 seconds
    deletionTimeouts.current[medId] = setTimeout(() => {
      deleteMedication.mutate({ id: medId, petId }, {
        onSuccess: () => {
          setPendingDeletions(prev => {
            const next = new Set(prev);
            next.delete(medId);
            return next;
          });
        },
        onError: () => {
          setPendingDeletions(prev => {
            const next = new Set(prev);
            next.delete(medId);
            return next;
          });
          toast.error(t('common.toasts.error'));
        }
      });
      delete deletionTimeouts.current[medId];
    }, 5000);
  };

  const canEdit = React.useMemo(() => {
    if (!pet) return false;
    return pet.role === 'owner' || pet.role === 'admin' || pet.role === 'editor';
  }, [pet]);
  
  const [showPast, setShowPast] = React.useState(false);
  const [notifLoading, setNotifLoading] = React.useState(false);
  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  const handleEnableNotifications = async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const token = await requestNotificationPermission(user.uid);
      if (token) {
        toast.success(t('medications.notificationsEnabled'));
      } else {
        toast.error(t('medications.notificationsDenied'));
      }
    } catch (error) {
      toast.error(t('common.toasts.error'));
    } finally {
      setNotifLoading(false);
    }
  };

  const visibleMeds = medications.filter(m => !pendingDeletions.has(m.id));
  const activeMeds = visibleMeds.filter(m => m.active);
  const pastMeds = visibleMeds.filter(m => !m.active);
  
  const dueToday = activeMeds.filter(m => {
    if (!m.nextDoseDue) return false;
    const date = parseISO(m.nextDoseDue);
    return isSameDay(date, new Date()) || isPast(date);
  });

  const handleLogDose = async (med: any) => {
    try {
      const now = new Date().toISOString();
      const nextDose = calculateNextDose(now, med.frequency);

      // 1. Create health record
      await addRecord.mutateAsync({
        petId,
        recordDate: now,
        recordType: 'medication',
        medicationId: med.id,
        description: `${med.name} - ${med.dosage} (${t(`medications.frequencies.${med.frequency}`)})`,
        notes: t('medications.doseLoggedAutomatically'),
      } as any);

      // 2. Update medication doc
      await updateMedication.mutateAsync({
        id: med.id,
        nextDoseDue: nextDose.toISOString(),
      });

      toast.success(t('medications.doseLoggedSuccess'));
    } catch (error) {
      console.error('Error logging dose:', error);
      toast.error(t('common.toasts.error'));
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('medications.activeTreatments')}</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleEnableNotifications}
            disabled={notifLoading}
            className="p-2 bg-secondary text-muted-foreground rounded-xl hover:text-primary transition-all disabled:opacity-50"
            title={t('medications.enableNotifications')}
          >
            <Bell size={18} className={notifLoading ? 'animate-pulse' : ''} />
          </button>
          {canEdit && (
            <button 
              onClick={() => setActiveModal('medication_add', { petId })}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              <Plus size={18} />
              <span>{t('medications.addMedication')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Daily Schedule - NEW SECTION */}
      {dueToday.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Clock size={18} />
            </div>
            <h3 className="text-lg font-bold text-foreground">{t('medications.dueToday')}</h3>
          </div>
          
          <div className="space-y-3">
            {dueToday.sort((a, b) => new Date(a.nextDoseDue!).getTime() - new Date(b.nextDoseDue!).getTime()).map(med => {
              const overdue = isDoseOverdue(med.nextDoseDue);
              return (
                <div key={`daily-${med.id}`} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all shadow-sm">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${overdue ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      <Pill size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{med.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {med.dosage} • {format(parseISO(med.nextDoseDue!), 'HH.mm')}
                        {overdue && <span className="ml-2 text-destructive font-bold uppercase text-[10px] tracking-tighter">({t('medications.overdue')})</span>}
                      </p>
                    </div>
                  </div>
                  {canEdit && (
                    <button 
                      onClick={() => handleLogDose(med)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        overdue 
                          ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {t('medications.logDose')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Missed/Overdue Alerts */}
      {(() => {
        const overdueMeds = activeMeds.filter(m => isDoseOverdue(m.nextDoseDue));
        if (overdueMeds.length === 0) return null;

        return (
          <div className="space-y-3 animate-bounce-subtle">
            {overdueMeds.map(med => (
              <div 
                key={`alert-${med.id}`}
                className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-destructive/5"
              >
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center text-destructive flex-shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-destructive font-bold text-sm uppercase tracking-wider mb-0.5">
                    {t('medications.missedDoseAlert')}
                  </h4>
                  <p className="text-foreground/90 text-sm font-medium">
                    {t('medications.missedDoseDescription', { name: med.name })}
                  </p>
                </div>
                {canEdit && (
                  <button 
                    onClick={() => handleLogDose(med)}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-xl text-xs font-bold hover:bg-destructive/90 transition-colors shadow-sm"
                  >
                    {t('medications.logDose')}
                  </button>
                )}
              </div>
            ))}
          </div>
        );
      })()}

      {activeMeds.length === 0 ? (
        <div className="py-12 text-center bg-card border border-dashed border-border rounded-3xl">
          <Pill size={40} className="mx-auto text-muted-foreground mb-3 opacity-20" />
          <p className="text-muted-foreground">{t('medications.noActiveMedications')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeMeds.map((med) => {
            const overdue = isDoseOverdue(med.nextDoseDue);
            
            return (
              <SwipeableRecord
                key={med.id}
                onDelete={() => handleDeleteMedication(med.id)}
                canDelete={canEdit}
              >
                <div 
                  className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-colors shadow-sm relative overflow-hidden group"
                >
                  {overdue && (
                    <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-destructive/10 rounded-full flex items-end justify-start p-4">
                      <AlertCircle size={16} className="text-destructive" />
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Pill size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold">{med.name}</h4>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                          {med.dosage} • {t(`medications.frequencies.${med.frequency}`)}
                        </p>
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => setActiveModal('medication_edit', med)}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                      <span>{t('medications.adherence')}</span>
                      <span className={calculateAdherence(records.filter(r => (r as any).medicationId === med.id), med.frequency) < 80 ? 'text-destructive' : 'text-green-500'}>
                        %{calculateAdherence(records.filter(r => (r as any).medicationId === med.id), med.frequency)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${calculateAdherence(records.filter(r => (r as any).medicationId === med.id), med.frequency) < 80 ? 'bg-destructive' : 'bg-green-500'}`}
                        style={{ width: `${calculateAdherence(records.filter(r => (r as any).medicationId === med.id), med.frequency)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={14} className={overdue ? 'text-destructive' : 'text-primary'} />
                      <span className={overdue ? 'text-destructive font-bold' : 'text-muted-foreground font-medium'}>
                        {med.nextDoseDue 
                          ? `${t('medications.nextDose')}: ${format(parseISO(med.nextDoseDue), 'dd.MM.yyyy, HH.mm', { locale: dateLocale })}`
                          : t('medications.noSchedule')
                        }
                      </span>
                    </div>
                    {med.endDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                        <Calendar size={14} />
                        <span>{t('medications.endsOn')}: {format(parseISO(med.endDate), 'dd.MM.yyyy', { locale: dateLocale })}</span>
                      </div>
                    )}
                  </div>

                  {canEdit && (
                    <button 
                      onClick={() => handleLogDose(med)}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                        overdue 
                          ? 'bg-destructive text-destructive-foreground shadow-destructive/20 hover:bg-destructive/90' 
                          : 'bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground'
                      }`}
                    >
                      <CheckCircle2 size={18} />
                      {t('medications.logDose')}
                    </button>
                  )}
                </div>
              </SwipeableRecord>
            );
          })}
        </div>
      )}

      {pastMeds.length > 0 && (
        <div className="space-y-4">
          <button 
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPast ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {t('medications.pastTreatments')} ({pastMeds.length})
          </button>

          {showPast && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
              {pastMeds.map((med) => (
                <SwipeableRecord
                  key={med.id}
                  onDelete={() => handleDeleteMedication(med.id)}
                  canDelete={canEdit}
                >
                  <div className="bg-card/50 border border-border rounded-xl p-4 opacity-70">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                        <Pill size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{med.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                          {med.dosage} • {t(`medications.frequencies.${med.frequency}`)}
                        </p>
                      </div>
                    </div>
                  </div>
                </SwipeableRecord>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dose History Timeline */}
      <div className="pt-8 border-t border-border/50">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="text-primary" size={20} />
          <h2 className="text-xl font-bold">{t('medications.doseHistory')}</h2>
          <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full ml-2">
            {t('medications.last7Days')}
          </span>
        </div>

        {(() => {
          const medLogs = records
            .filter(r => r.recordType === 'medication')
            .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())
            .slice(0, 20);

          if (medLogs.length === 0) {
            return (
              <div className="py-12 text-center bg-secondary/20 rounded-3xl border border-dashed border-border/50">
                <p className="text-muted-foreground text-sm">{t('medications.noHistory')}</p>
              </div>
            );
          }

          return (
            <div className="space-y-4 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/50">
              {medLogs.map((log) => (
                <div key={log.id} className="relative pl-12">
                  <div className="absolute left-0 top-1.5 w-10 h-10 rounded-full bg-card border-2 border-primary/20 flex items-center justify-center z-10 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-foreground">{log.description}</h4>
                        {log.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{log.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-full whitespace-nowrap">
                          <Calendar size={12} />
                          {format(parseISO(log.recordDate), 'dd.MM.yyyy, HH.mm', { locale: dateLocale })}
                        </div>
                        {canEdit && (
                          <button 
                            onClick={() => setActiveModal('record_edit', log)}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
