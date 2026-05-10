import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Heart, Activity } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { Modal } from '@/components/Modal';
import { useAppStore } from '@/store/useAppStore';
import { usePets } from '@/hooks/queries/usePets';
import toast from 'react-hot-toast';

export const ShareCardModal: React.FC = () => {
  const { t } = useTranslation();
  const { activeModal, setActiveModal, modalData } = useAppStore();
  const { pets } = usePets();
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const pet = pets.find(p => p.id === modalData?.petId);
  const isOpen = activeModal === 'share_card';

  if (!pet || !isOpen) return null;

  const handleExport = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    toast.success('Kart oluşturuluyor...', { icon: '📸' });

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `odin-tracker-${pet.name}.png`;
      link.href = image;
      link.click();
      
      toast.success('Resim indirildi!');
    } catch (err) {
      toast.error(t('common.toasts.error'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => setActiveModal(null)} title={t('share.card.title')}>
      <div className="flex flex-col items-center space-y-6 pb-2">
        <p className="text-sm text-center text-muted-foreground">
          {t('share.card.subtitle')}
        </p>

        {/* Capture Area (9:16 Aspect Ratio) */}
        <div 
          ref={cardRef} 
          className="w-[300px] h-[533px] relative overflow-hidden rounded-[2rem] shadow-2xl flex flex-col justify-between"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            color: 'white'
          }}
        >
          {/* Decorative Pattern Background */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/40 to-transparent z-0" />
          
          <div className="relative z-10 p-6 flex flex-col items-center flex-1">
            <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden shadow-2xl mb-4 bg-white/10 flex items-center justify-center">
              {pet.photoUrl ? (
                <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <span className="text-4xl font-black">{pet.name[0]}</span>
              )}
            </div>
            
            <h2 className="text-3xl font-black tracking-tight drop-shadow-lg text-center">{pet.name}</h2>
            <p className="text-white font-bold tracking-widest uppercase text-[10px] mt-2 bg-black/30 px-3 py-1 rounded-full shadow-inner">
              {t(`pets.species_values.${pet.species}`, pet.species.toUpperCase())}
            </p>

            <div className="mt-8 w-full space-y-3">
              {pet.weightKg && (
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20 shadow-lg">
                  <span className="font-bold text-xs uppercase tracking-wider">{t('pets.weight')}</span>
                  <span className="font-black text-lg drop-shadow">{pet.weightKg} kg</span>
                </div>
              )}
              
              {pet.bloodType && (
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20 shadow-lg">
                  <span className="font-bold text-xs uppercase tracking-wider">{t('pets.bloodType')}</span>
                  <span className="font-black text-lg drop-shadow">{pet.bloodType}</span>
                </div>
              )}

              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20 shadow-lg">
                <span className="font-bold text-xs uppercase tracking-wider">{t('tabs.healthRecords')}</span>
                <span className="font-black flex items-center gap-1 drop-shadow"><Heart size={16} className="fill-white"/> {t('common.excellent', 'Mükemmel')}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 p-6 pt-0 text-center space-y-1">
            <Activity size={24} className="mx-auto text-white mb-2 opacity-90 drop-shadow-lg" />
            <p className="font-black text-sm tracking-widest drop-shadow-md">ODIN TRACKER</p>
            <p className="text-[8px] font-bold uppercase tracking-widest opacity-80 drop-shadow">AI Pet Health Companion</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
        >
          {isExporting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><Download size={18} /> {t('share.card.download')}</>
          )}
        </button>
      </div>
    </Modal>
  );
};
