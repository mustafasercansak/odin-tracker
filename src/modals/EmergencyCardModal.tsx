import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal';
import { useAppStore } from '@/store/useAppStore';
import { usePets } from '@/hooks/queries/usePets';
import { ShieldAlert, Phone, Heart, Hash, Droplet, AlertCircle, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

export const EmergencyCardModal: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { activeModal, modalData, setActiveModal } = useAppStore();
  const { pets } = usePets();
  
  const pet = pets.find(p => p.id === modalData?.petId);
  const isOpen = activeModal === 'emergency_card';
  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  if (!pet) return null;

  return (
    <Modal isOpen={isOpen} onClose={() => setActiveModal(null)} title={t('pets.emergency.title')}>
      <div className="space-y-6">
        {/* Top Alert Header */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-3xl p-6 flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center text-white shadow-xl shadow-destructive/40 animate-pulse">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-destructive">{pet.name.toUpperCase()}</h2>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t(`pets.species_values.${pet.species}`)} / {pet.breed || '---'}</p>
          </div>
        </div>

        {/* Critical Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary text-primary">
              <Hash size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('pets.microchipId')}</p>
              <p className="font-mono font-bold text-lg">{pet.microchipId || '---'}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary text-destructive">
              <Droplet size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('pets.bloodType')}</p>
              <p className="font-bold text-lg">{pet.bloodType || '---'}</p>
            </div>
          </div>
        </div>

        {/* Allergies - Full Width */}
        <div className="bg-destructive/5 border border-destructive/10 rounded-2xl p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle size={18} />
            <h3 className="font-black uppercase tracking-widest text-xs">{t('pets.allergies')}</h3>
          </div>
          <p className="text-lg font-bold leading-tight">
            {pet.allergies || '---'}
          </p>
        </div>

        {/* Owner / Contact Info */}
        <div className="bg-secondary/30 rounded-3xl p-6 space-y-4">
          <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground mb-4">{t('shares.roles.owner')}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <User size={20} />
              </div>
              <div>
                <p className="font-bold">{t('common.user')}</p>
                <p className="text-xs text-muted-foreground">---</p>
              </div>
            </div>
            <button className="p-3 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              <Phone size={20} />
            </button>
          </div>
        </div>

        <button 
          onClick={() => window.print()}
          className="w-full py-4 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Heart size={18} />
          <span>{t('report.download')} PDF</span>
        </button>
      </div>
    </Modal>
  );
};
