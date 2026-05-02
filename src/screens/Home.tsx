import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePets } from '@/hooks/queries/usePets';
import { useAppStore } from '@/store/useAppStore';
import { Plus, Heart, ChevronRight, Calendar, Info, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
//import { loginSchema, type LoginInput } from '@/schemas/user';
import { tr, enUS } from 'date-fns/locale';

export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pets, isLoading } = usePets();
  const { setSelectedPetId, setActiveModal, searchQuery } = useAppStore();

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

      {pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 px-6 glass-panel rounded-4xl text-center border-white/5">
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
                          ? format(parseISO(pet.dateOfBirth), 'd MMMM yyyy', { locale: dateLocale })
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
            className="flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-xl hover:border-white/30 hover:bg-secondary/30 transition-all group"
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
