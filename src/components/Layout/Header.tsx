import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePets } from '@/hooks/queries/usePets';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { ChevronDown, Plus, User, Search, Command } from 'lucide-react';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const { pets } = usePets();
  const { user } = useAuth();
  const { selectedPetId, setSelectedPetId, setActiveModal, searchQuery, setSearchQuery } = useAppStore();

  const selectedPet = pets.find(p => p.id === selectedPetId) || pets[0];

  // If no pet is selected but pets exist, select the first one
  React.useEffect(() => {
    if (!selectedPetId && pets.length > 0) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId, setSelectedPetId]);

  return (
    <header className="sticky top-0 z-40 w-full bg-background border-b border-border px-4 py-3 md:px-8">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Pet Selector */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden">
                {selectedPet?.photoUrl ? (
                  <img src={selectedPet.photoUrl} alt={selectedPet.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold">{selectedPet?.name?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
              <span className="font-semibold text-sm max-w-[100px] truncate">
                {selectedPet?.name || t('pets.title')}
              </span>
              <ChevronDown size={16} className="text-muted-foreground" />
            </button>
            
            {/* Dropdown (Simple implementation) */}
            <div className="absolute top-full left-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left scale-95 group-hover:scale-100">
              <div className="p-2 space-y-1">
                {pets.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPetId(pet.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      pet.id === selectedPetId ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs overflow-hidden">
                      {pet.photoUrl ? (
                        <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{pet.name[0].toUpperCase()}</span>
                      )}
                    </div>
                    <span className="flex-1 text-left text-sm font-medium">{pet.name}</span>
                  </button>
                ))}
                <div className="border-t border-border mt-2 pt-2">
                  <button 
                    onClick={() => setActiveModal('pet_add')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary text-primary transition-colors"
                  >
                    <Plus size={16} />
                    <span className="text-sm font-semibold">{t('pets.addPet')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-10 pr-12 py-2 rounded-xl bg-secondary/50 border border-transparent focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm font-medium"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-bold text-muted-foreground pointer-events-none">
              <Command size={10} />
              <span>K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
            ) : (
              <User size={20} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
