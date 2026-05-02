import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Camera, Save } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useAppStore } from '@/store/useAppStore';
import { usePets } from '@/hooks/queries/usePets';
import { petInputSchema, type PetInput, type Pet } from '@/schemas/pet';
import { uploadFile } from '@/lib/storage';
import { CustomDateInput } from '@/components/CustomDateInput';

export const PetModal: React.FC = () => {
  const { t } = useTranslation();
  const { activeModal, setActiveModal, modalData } = useAppStore();
  const { addPet, updatePet } = usePets();
  
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    (modalData as Pet)?.photoUrl || null
  );

  const isEdit = activeModal === 'pet_edit';
  const petToEdit = modalData as Pet;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PetInput>({
    resolver: zodResolver(petInputSchema),
  });

  // Sync form with modal data
  React.useEffect(() => {
    if (activeModal === 'pet_edit' && modalData) {
      const pet = modalData as Pet;
      reset({
        name: pet.name,
        species: pet.species,
        breed: pet.breed || '',
        dateOfBirth: pet.dateOfBirth || '',
        weightKg: pet.weightKg || 0,
        notes: pet.notes || '',
      });
      setImagePreview(pet.photoUrl || null);
    } else if (activeModal === 'pet_add') {
      reset({
        species: 'cat',
        name: '',
        breed: '',
        dateOfBirth: '',
        weightKg: 0,
        notes: '',
      });
      setImagePreview(null);
    }
  }, [activeModal, modalData, reset]);

  const handleClose = () => {
    setActiveModal(null);
    reset();
    setImageFile(null);
    setImagePreview(null);
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: PetInput) => {
    setLoading(true);
    try {
      let photoUrl = imagePreview;

      // Upload image if a new one was selected
      if (imageFile) {
        const path = `pet_photos/${Date.now()}_${imageFile.name}`;
        photoUrl = await uploadFile(imageFile, path);
      }

      const payload = { ...data, photoUrl: photoUrl || undefined };
      Object.keys(payload).forEach(key => {
        if ((payload as any)[key] === undefined || (payload as any)[key] === '') {
          delete (payload as any)[key];
        }
      });

      if (isEdit && petToEdit) {
        await updatePet.mutateAsync({
          id: petToEdit.id,
          ...payload,
        });
      } else {
        await addPet.mutateAsync({
          ...payload,
        });
      }
      
      handleClose();
    } catch (error) {
      console.error('Error saving pet:', error);
      toast.error(t('common.toasts.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={activeModal === 'pet_add' || activeModal === 'pet_edit'} 
      onClose={handleClose}
      title={isEdit ? t('pets.editPet') : t('pets.addPet')}
    >
      <form 
        aria-label="pet-form"
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-6"
      >
        {/* Photo Upload */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground overflow-hidden border-2 border-dashed border-border group-hover:border-primary transition-colors">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera size={40} />
              )}
            </div>
            <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
              <span className="text-white text-xs font-bold uppercase tracking-wider">{t('healthRecords.uploadFile')}</span>
              <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1.5">{t('pets.name')}</label>
            <input
              {...control.register('name')}
              className={`w-full px-4 py-2.5 rounded-xl bg-input border ${errors.name ? 'border-destructive' : 'border-border'} focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none`}
              placeholder={t('pets.name')}
            />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Species */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">{t('pets.species')}</label>
            <select
              {...control.register('species')}
              className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none appearance-none"
            >
              <option value="cat">{t('pets.species_values.cat')}</option>
              <option value="dog">{t('pets.species_values.dog')}</option>
              <option value="bird">{t('pets.species_values.bird')}</option>
              <option value="rabbit">{t('pets.species_values.rabbit')}</option>
              <option value="other">{t('pets.species_values.other')}</option>
            </select>
          </div>

          {/* Breed */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">{t('pets.breed')}</label>
            <input
              {...control.register('breed')}
              className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              placeholder={t('pets.breed')}
            />
          </div>

          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <CustomDateInput
                label={t('pets.dateOfBirth')}
                value={field.value || ''}
                onChange={field.onChange}
                error={errors.dateOfBirth?.message}
              />
            )}
          />

          {/* Weight */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">{t('pets.weight')}</label>
            <input
              type="number"
              step="0.1"
              {...control.register('weightKg', { valueAsNumber: true })}
              className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              placeholder="0.0"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1.5">{t('pets.notes')}</label>
            <textarea
              {...control.register('notes')}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none"
              placeholder={t('pets.notes')}
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
