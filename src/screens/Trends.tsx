import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';
import { usePets } from '@/hooks/queries/usePets';
import { TrendsTab } from '@/components/Trends/TrendsTab';
import { useAppStore } from '@/store/useAppStore';

export default function Trends() {
  const { t } = useTranslation();
  const { pets, isLoading } = usePets();
  const { setActiveModal } = useAppStore();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const currentPetId = selectedPetId ?? pets[0]?.id ?? null;
  const currentPet = pets.find(p => p.id === currentPetId);

  if (isLoading) {
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
          <TrendingUp size={40} className="text-muted-foreground" />
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t('trends.title')}</h1>
      </header>

      {/* Pet selector — only shown when there are multiple pets */}
      {pets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {pets.map(pet => (
            <button
              key={pet.id}
              onClick={() => setSelectedPetId(pet.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                pet.id === currentPetId
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              {pet.photoUrl ? (
                <img src={pet.photoUrl} alt={pet.name} className="w-6 h-6 rounded-lg object-cover" />
              ) : (
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black ${
                  pet.id === currentPetId ? 'bg-white/20' : 'bg-primary/15 text-primary'
                }`}>
                  {pet.name[0].toUpperCase()}
                </div>
              )}
              {pet.name}
            </button>
          ))}
        </div>
      )}

      {/* Trends content for selected pet */}
      {currentPetId && (
        <TrendsTab petId={currentPetId} species={currentPet?.species} />
      )}
    </div>
  );
}
