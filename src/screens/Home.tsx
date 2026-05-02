import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePets } from '@/hooks/queries/usePets';
import { useAppStore } from '@/store/useAppStore';
import { Plus, Heart, ChevronRight, Calendar, Info, Search, Clock, Pill, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';
import { format, parseISO, isSameDay, isPast } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useAllMedications, useMedications } from '@/hooks/queries/useMedications';
import { useHealthRecords } from '@/hooks/queries/useHealthRecords';
import { calculateNextDose, isDoseOverdue } from '@/lib/medication-helpers';
import toast from 'react-hot-toast';
import { HealthInsights } from '@/components/Home/HealthInsights';

export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pets, isLoading } = usePets();
  const { setSelectedPetId, setActiveModal, searchQuery } = useAppStore();
  
  const petIds = React.useMemo(() => pets.map(p => p.id), [pets]);
  const { data: allMedications, isLoading: medsLoading } = useAllMedications(petIds);
  
  // Need mutations for logging dose from Home
  const { addRecord } = useHealthRecords(null); // We'll pass petId manually
  const { updateMedication } = useMedications(null);

  // Self-healing: Ensure user exists in 'users' collection for sharing
  React.useEffect(() => {
    const syncUser = async () => {
      const { auth } = await import('@/lib/firebase');
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        const { setDoc, doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            email: currentUser.email.toLowerCase(),
            displayName: currentUser.displayName || null,
            createdAt: new Date().toISOString(),
          });
        }
      }
    };
    syncUser();
  }, []);

  const filteredPets = React.useMemo(() => {
    if (!searchQuery) return pets;
    const query = searchQuery.toLowerCase();
    return pets.filter(pet =>
      pet.name.toLowerCase().includes(query) ||
      pet.breed?.toLowerCase().includes(query) ||
      pet.species.toLowerCase().includes(query)
    );
  }, [pets, searchQuery]);

  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  const { pendingMeds, completedMeds } = React.useMemo(() => {
    if (!allMedications) return { pendingMeds: [], completedMeds: [] };
    const active = allMedications.filter(m => m.active && m.nextDoseDue);
    
    const pending = active.filter(m => {
      const date = parseISO(m.nextDoseDue!);
      return isSameDay(date, new Date()) || isPast(date);
    }).sort((a, b) => new Date(a.nextDoseDue!).getTime() - new Date(b.nextDoseDue!).getTime());

    const completed = active.filter(m => {
      const date = parseISO(m.nextDoseDue!);
      return !isSameDay(date, new Date()) && !isPast(date);
    }).sort((a, b) => new Date(a.nextDoseDue!).getTime() - new Date(b.nextDoseDue!).getTime());

    return { pendingMeds: pending, completedMeds: completed };
  }, [allMedications]);

  const handleLogDose = async (med: any) => {
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
      });

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('pets.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {pets.length > 0
              ? t('healthRecords.nRecords', { count: pets.length }).replace('kayıt', t('pets.title').toLowerCase()) // Quick fix for "X pets"
              : t('pets.noPets')
            }
          </p>
        </div>
        <button
          onClick={() => setActiveModal('pet_add')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full btn-neon"
        >
          <Plus size={20} strokeWidth={3} />
          <span className="hidden sm:inline font-extrabold">{t('pets.addPet')}</span>
        </button>
      </header>

      {pets.length > 0 && <HealthInsights pets={pets} />}

      {/* Global Daily Schedule */}
      <section className="glass-panel rounded-4xl p-8 border-border shadow-sm relative overflow-hidden">
        {/* Animated Background Pulse for the whole section */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                <Clock size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tight">{t('home.schedule') || 'GÜNLÜK PROGRAM'}</h2>
                <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase">
                  {pendingMeds.length} {t('medications.title').toLowerCase()}
                </p>
              </div>
            </div>
            
            {pendingMeds.some(m => isDoseOverdue(m.nextDoseDue)) && (
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse">
                {t('common.active')}
              </span>
            )}
          </div>

          {pendingMeds.length === 0 ? (
            <div className="py-10 text-center bg-secondary/10 rounded-3xl border border-dashed border-border">
              <CheckCircle2 size={32} className="mx-auto text-primary mb-3 opacity-20" />
              <p className="text-muted-foreground font-bold italic">
                {completedMeds.length > 0 ? t('medications.allDosesCompleted') || 'Tüm dozlar tamamlandı!' : t('medications.noActiveMedications')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingMeds.map(med => {
                const pet = pets.find(p => p.id === med.petId);
                const overdue = isDoseOverdue(med.nextDoseDue);
                const isDueToday = med.nextDoseDue && isSameDay(parseISO(med.nextDoseDue), new Date());
                return (
                  <div key={`home-due-${med.id}`} className="group flex flex-col p-4 bg-secondary/30 border border-border rounded-2xl hover:border-primary/50 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary group-hover:scale-110 transition-transform relative">
                        {pet?.photoUrl ? (
                          <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Pill size={20} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-primary uppercase tracking-wider">{pet?.name}</p>
                        <p className="font-bold truncate text-sm">{med.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                      <div className="text-[11px] font-bold">
                        <span className={`uppercase ${isDueToday ? 'text-primary' : 'text-muted-foreground'}`}>
                          {format(parseISO(med.nextDoseDue!), 'dd.MM.yyyy, HH.mm')}
                        </span>
                        {overdue && <span className="ml-2 text-destructive uppercase italic">! {t('medications.overdue')}</span>}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogDose(med);
                        }}
                        className={`p-2 rounded-xl transition-all ${
                          overdue 
                            ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 hover:scale-110' 
                            : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-110'
                        }`}
                      >
                        <CheckCircle2 size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed Today Section */}
          {completedMeds.length > 0 && (
            <div className="mt-12 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500">
                  <CheckCircle2 size={18} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                  {t('medications.completedToday') || 'BUGÜN TAMAMLANANLAR'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {completedMeds.map(med => {
                  const pet = pets.find(p => p.id === med.petId);
                  return (
                    <div key={`home-done-${med.id}`} className="flex items-center gap-3 p-3 bg-secondary/20 border border-border rounded-2xl">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground overflow-hidden">
                        {pet?.photoUrl ? (
                          <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                        ) : (
                          <Pill size={16} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{pet?.name}</p>
                        <p className="text-xs font-bold truncate">{med.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {med.dosage} - {t(`medications.frequencies.${med.frequency}`)}
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full uppercase">
                        {t('common.done')}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModal('medication_edit', med);
                        }}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 px-6 glass-panel rounded-4xl text-center border-border">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-8 shadow-neon animate-pulse">
            <Heart size={40} fill="currentColor" />
          </div>
          <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">{t('pets.noPets')}</h2>
          <p className="text-muted-foreground max-w-sm mb-12 text-lg font-medium leading-relaxed">
            {t('pets.emptyDescription')}
          </p>
          <button
            onClick={() => setActiveModal('pet_add')}
            className="px-12 py-4 rounded-full btn-neon text-lg"
          >
            {t('pets.addPet')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPets.length === 0 && searchQuery && (
            <div className="md:col-span-2 lg:col-span-3 py-20 text-center glass-panel rounded-4xl border-dashed">
              <Search size={48} className="mx-auto text-primary mb-4 opacity-50" />
              <p className="text-muted-foreground text-xl font-bold italic">{t('common.noResultsFor', { query: searchQuery })}</p>
            </div>
          )}
          {filteredPets.map((pet) => (
            <div
              key={pet.id}
              onClick={() => {
                setSelectedPetId(pet.id);
                navigate(`/pet/${pet.id}`);
              }}
              className="group relative rounded-3xl p-8 transition-all duration-500 cursor-pointer overflow-hidden card-hyper"
            >
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

              <div className="relative flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center text-primary text-2xl font-bold shadow-inner overflow-hidden flex-shrink-0">
                  {pet.photoUrl ? (
                    <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{pet.name[0].toUpperCase()}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-bold truncate group-hover:text-primary transition-colors">
                      {pet.name}
                    </h3>
                    <ChevronRight size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs font-semibold rounded-md">
                      {t(`pets.species_values.${pet.species}`)}
                    </span>
                    {pet.breed && (
                      <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs font-semibold rounded-md truncate max-w-[120px]">
                        {pet.breed}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={14} className="flex-shrink-0" />
                      <span>
                        {pet.dateOfBirth
                          ? format(parseISO(pet.dateOfBirth), 'dd.MM.yyyy', { locale: dateLocale })
                          : '---'
                        }
                      </span>
                    </div>
                    {pet.weightKg && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info size={14} className="flex-shrink-0" />
                        <span>{pet.weightKg} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bar or stats placeholder */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span className="uppercase tracking-wider">{t('pets.lastCheck')}</span>
                <span className="text-foreground">{t('common.yesterday')}</span>
              </div>
            </div>
          ))}

          {/* Add New Pet Card */}
          <button
            onClick={() => setActiveModal('pet_add')}
            className="flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-xl hover:border-primary/30 hover:bg-secondary transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all mb-3">
              <Plus size={20} />
            </div>
            <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">{t('pets.addPet')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
