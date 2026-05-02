import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Save, Pill } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useAppStore } from '@/store/useAppStore';
import { useMedications } from '@/hooks/queries/useMedications';
import { medicationInputSchema, type MedicationInput, type Medication } from '@/schemas/medication';

export const MedicationModal: React.FC = () => {
  const { t } = useTranslation();
  const { activeModal, setActiveModal, modalData } = useAppStore();
  const { addMedication, updateMedication } = useMedications((modalData as any)?.petId || null);
  
  const [loading, setLoading] = useState(false);

  const isEdit = activeModal === 'medication_edit';
  const medToEdit = modalData as Medication;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MedicationInput>({
    resolver: zodResolver(medicationInputSchema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      frequency: 'daily',
    },
  });

  useEffect(() => {
    if (activeModal === 'medication_add' || activeModal === 'medication_edit') {
      if (modalData) {
        if (isEdit) {
           reset({
            name: medToEdit.name,
            dosage: medToEdit.dosage,
            frequency: medToEdit.frequency,
            startDate: medToEdit.startDate.split('T')[0],
            endDate: medToEdit.endDate?.split('T')[0],
            notes: medToEdit.notes,
          });
        } else {
          reset({
            name: '',
            dosage: '',
            frequency: 'daily',
            startDate: new Date().toISOString().split('T')[0],
            notes: '',
          });
        }
      }
    }
  }, [activeModal, modalData, isEdit, reset]);

  const handleClose = () => {
    setActiveModal(null);
    reset();
  };

  const onSubmit = async (data: MedicationInput) => {
    setLoading(true);
    try {
      if (isEdit && medToEdit) {
        await updateMedication.mutateAsync({
          id: medToEdit.id,
          ...data,
        });
      } else {
        await addMedication.mutateAsync({
          petId: (modalData as any).petId,
          ...data,
        });
      }
      
      toast.success(t('common.toasts.saved'));
      handleClose();
    } catch (error) {
      console.error('Error saving medication:', error);
      toast.error(t('common.toasts.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={activeModal === 'medication_add' || activeModal === 'medication_edit'} 
      onClose={handleClose}
      title={isEdit ? t('medications.editMedication') : t('medications.addMedication')}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Pill size={32} />
          </div>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">{t('medications.name')}</label>
            <input
              {...register('name')}
              className={`w-full px-4 py-2.5 rounded-xl bg-input border ${errors.name ? 'border-destructive' : 'border-border'} focus:ring-2 focus:ring-primary outline-none`}
              placeholder={t('medications.name')}
            />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dosage */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">{t('medications.dosage')}</label>
              <input
                {...register('dosage')}
                className={`w-full px-4 py-2.5 rounded-xl bg-input border ${errors.dosage ? 'border-destructive' : 'border-border'} focus:ring-2 focus:ring-primary outline-none`}
                placeholder="e.g. 5mg, 1 tablet"
              />
              {errors.dosage && <p className="mt-1 text-xs text-destructive">{errors.dosage.message}</p>}
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">{t('medications.frequency')}</label>
              <select
                {...register('frequency')}
                className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none appearance-none"
              >
                {Object.keys(t('medications.frequencies', { returnObjects: true })).map((freq) => (
                  <option key={freq} value={freq}>
                    {t(`medications.frequencies.${freq}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">{t('medications.startDate')}</label>
              <div className="relative">
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">{t('medications.endDate')} ({t('common.optional')})</label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">{t('medications.notes')}</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none resize-none"
              placeholder={t('medications.notes')}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Save size={20} />
              {t('common.save')}
            </>
          )}
        </button>
      </form>
    </Modal>
  );
};
