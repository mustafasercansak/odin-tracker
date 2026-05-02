import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal';
import { useAppStore } from '@/store/useAppStore';
import { usePets } from '@/hooks/queries/usePets';
import { useHealthRecords } from '@/hooks/queries/useHealthRecords';
import { Save, CheckSquare, Square, Syringe, Calendar, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export const BatchRecordModal: React.FC = () => {
  const { t } = useTranslation();
  const { activeModal, setActiveModal } = useAppStore();
  const { pets } = usePets();
  const { addRecord } = useHealthRecords(null);

  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordType, setRecordType] = useState<'vaccination' | 'vet_visit' | 'medication'>('vaccination');
  const [description, setDescription] = useState('');
  const [nextDoseDate, setNextDoseDate] = useState('');
  const [loading, setLoading] = useState(false);

  const isOpen = activeModal === 'batch_record';

  const togglePet = (id: string) => {
    setSelectedPetIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPetIds.length === 0) {
      toast.error(t('batch.errors.noPetsSelected'));
      return;
    }
    if (!description.trim()) {
      toast.error(t('healthRecords.descriptionRequired'));
      return;
    }

    setLoading(true);
    try {
      // Create records sequentially (or parallelly with Promise.all)
      await Promise.all(selectedPetIds.map(petId => 
        addRecord.mutateAsync({
          petId,
          recordDate,
          recordType,
          description,
          nextDoseDate: recordType === 'vaccination' ? nextDoseDate : undefined,
          notes: `Batch Logged: ${new Date().toLocaleDateString()}`
        })
      ));
      
      toast.success(t('batch.success', { count: selectedPetIds.length }));
      setActiveModal(null);
      // Reset state
      setSelectedPetIds([]);
      setDescription('');
      setNextDoseDate('');
    } catch (error) {
      console.error('Batch logging failed:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => setActiveModal(null)} title={t('batch.title')}>
      <form onSubmit={handleSave} className="space-y-6">
        {/* Pet Selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">
            {t('batch.selectPets')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {pets.map(pet => (
              <button
                key={pet.id}
                type="button"
                onClick={() => togglePet(pet.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  selectedPetIds.includes(pet.id) 
                    ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' 
                    : 'bg-card border-border hover:border-primary/30'
                }`}
              >
                <div className="flex-shrink-0">
                  {selectedPetIds.includes(pet.id) ? (
                    <CheckSquare size={18} className="text-primary" />
                  ) : (
                    <Square size={18} className="text-muted-foreground" />
                  )}
                </div>
                <span className={`font-bold truncate ${selectedPetIds.includes(pet.id) ? 'text-primary' : 'text-foreground'}`}>
                  {pet.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('healthRecords.recordDate')}</label>
            <input 
              type="date" 
              value={recordDate}
              onChange={e => setRecordDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-input border border-border outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('healthRecords.recordType')}</label>
            <select
              value={recordType}
              onChange={e => setRecordType(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl bg-input border border-border outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="vaccination">{t('healthRecords.recordTypes.vaccination')}</option>
              <option value="vet_visit">{t('healthRecords.recordTypes.vet_visit')}</option>
              <option value="medication">{t('healthRecords.recordTypes.medication')}</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('healthRecords.description')}</label>
          <div className="relative">
            <input 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-input border border-border outline-none focus:ring-2 focus:ring-primary pl-10"
              placeholder={t('healthRecords.description')}
            />
            <FileText size={16} className="absolute left-4 top-3.5 text-muted-foreground" />
          </div>
        </div>

        {recordType === 'vaccination' && (
          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('healthRecords.nextDoseDate')}</label>
            <div className="relative">
              <input 
                type="date"
                value={nextDoseDate}
                onChange={e => setRecordDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-input border border-border outline-none focus:ring-2 focus:ring-primary pl-10"
              />
              <Calendar size={16} className="absolute left-4 top-3.5 text-muted-foreground" />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || selectedPetIds.length === 0}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Save size={20} />
              {t('common.save')} ({selectedPetIds.length})
            </>
          )}
        </button>
      </form>
    </Modal>
  );
};
