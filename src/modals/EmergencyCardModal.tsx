import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ShieldAlert, Phone, AlertCircle, Hash, Droplet, Stethoscope, Edit2, Save, X, Plus, User } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useAppStore } from '@/store/useAppStore';
import { usePets } from '@/hooks/queries/usePets';

interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

interface EmergencyFormData {
  microchipId: string;
  bloodType: string;
  allergies: string;
  emergencyContacts: EmergencyContact[];
  veterinarianName: string;
  veterinarianPhone: string;
}

export const EmergencyCardModal: React.FC = () => {
  const { t } = useTranslation();
  const { activeModal, modalData, setActiveModal } = useAppStore();
  const { pets, updatePet } = usePets();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const pet = pets.find(p => p.id === modalData?.petId);
  const isOpen = activeModal === 'emergency_card';

  const { register, handleSubmit, reset, control } = useForm<EmergencyFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'emergencyContacts' });

  useEffect(() => {
    if (pet && isOpen) {
      reset({
        microchipId: pet.microchipId || '',
        bloodType: pet.bloodType || '',
        allergies: pet.allergies || '',
        emergencyContacts: (pet as any).emergencyContacts || [],
        veterinarianName: (pet as any).veterinarianName || '',
        veterinarianPhone: (pet as any).veterinarianPhone || '',
      });
      setEditing(false);
    }
  }, [pet, isOpen]);

  if (!pet) return null;

  const onSave = async (data: EmergencyFormData) => {
    setSaving(true);
    try {
      await updatePet.mutateAsync({ id: pet.id, ...data });
      toast.success(t('common.toasts.saved'));
      setEditing(false);
    } catch {
      toast.error(t('common.toasts.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setActiveModal(null);
    setEditing(false);
  };

  const contacts: EmergencyContact[] = (pet as any).emergencyContacts || [];
  const veterinarianPhone = (pet as any).veterinarianPhone;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('pets.emergency.title')}>
      {editing ? (
        /* ── Edit Mode ── */
        <form onSubmit={handleSubmit(onSave)} className="space-y-5 pb-2">
          {/* Medical info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                {t('pets.microchipId')}
              </label>
              <input
                {...register('microchipId')}
                className="w-full px-3 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none text-sm font-mono"
                placeholder="---"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                {t('pets.bloodType')}
              </label>
              <input
                {...register('bloodType')}
                className="w-full px-3 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
                placeholder="DEA 1.1+"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              {t('pets.allergies')}
            </label>
            <textarea
              {...register('allergies')}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none resize-none text-sm"
              placeholder="---"
            />
          </div>

          {/* Emergency contacts */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t('pets.emergency.emergencyContacts')}
              </p>
              <button
                type="button"
                onClick={() => append({ name: '', phone: '', relation: '' })}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                <Plus size={13} />
                {t('pets.emergency.addContact')}
              </button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">{t('pets.emergency.noContacts')}</p>
            )}

            {fields.map((field, i) => (
              <div key={field.id} className="bg-secondary/40 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    {...register(`emergencyContacts.${i}.name`)}
                    placeholder={t('common.user')}
                    className="px-3 py-2 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
                  />
                  <input
                    {...register(`emergencyContacts.${i}.relation`)}
                    placeholder={t('pets.emergency.relation')}
                    className="px-3 py-2 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
                  />
                </div>
                <input
                  {...register(`emergencyContacts.${i}.phone`)}
                  type="tel"
                  placeholder={t('pets.emergency.emergencyPhone')}
                  className="w-full px-3 py-2 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
                />
              </div>
            ))}
          </div>

          {/* Vet */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              {t('pets.emergency.veterinarianName')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <input
                {...register('veterinarianName')}
                placeholder={t('pets.emergency.veterinarianName')}
                className="px-3 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
              />
              <input
                {...register('veterinarianPhone')}
                type="tel"
                placeholder={t('pets.emergency.veterinarianPhone')}
                className="px-3 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-border text-muted-foreground hover:text-foreground font-bold transition-colors"
            >
              <X size={16} />
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save size={16} />{t('common.save')}</>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* ── View Mode ── */
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-3xl p-5 flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center text-white shadow-xl shadow-destructive/40 animate-pulse">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-destructive">{pet.name.toUpperCase()}</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {t(`pets.species_values.${pet.species}`)} {pet.breed ? `/ ${pet.breed}` : ''}
              </p>
            </div>
          </div>

          {/* Microchip + Blood Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-secondary text-primary flex-shrink-0"><Hash size={18} /></div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('pets.microchipId')}</p>
                <p className="font-mono font-bold text-sm truncate">{pet.microchipId || '---'}</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-secondary text-destructive flex-shrink-0"><Droplet size={18} /></div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('pets.bloodType')}</p>
                <p className="font-bold text-sm">{pet.bloodType || '---'}</p>
              </div>
            </div>
          </div>

          {/* Allergies */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 flex gap-3">
            <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-destructive uppercase tracking-widest mb-1">{t('pets.allergies')}</p>
              <p className="font-bold text-sm leading-snug">{pet.allergies || '---'}</p>
            </div>
          </div>

          {/* Emergency contacts */}
          <div className="bg-secondary/40 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {t('pets.emergency.emergencyContacts')}
            </p>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('pets.emergency.noContacts')}</p>
            ) : (
              contacts.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <User size={15} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.relation ? `${c.relation} · ` : ''}{c.phone || t('pets.emergency.noPhone')}
                      </p>
                    </div>
                  </div>
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Phone size={15} />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Vet */}
          <div className="bg-secondary/40 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {t('pets.emergency.veterinarianName')}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Stethoscope size={15} />
                </div>
                <div>
                  <p className="font-bold text-sm">{(pet as any).veterinarianName || '---'}</p>
                  <p className="text-xs text-muted-foreground">{veterinarianPhone || t('pets.emergency.noPhone')}</p>
                </div>
              </div>
              {veterinarianPhone && (
                <a
                  href={`tel:${veterinarianPhone}`}
                  className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Phone size={15} />
                </a>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setEditing(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-border font-bold text-sm hover:bg-secondary transition-colors"
            >
              <Edit2 size={15} />
              {t('pets.emergency.editCard')}
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-foreground text-background rounded-2xl font-bold text-sm hover:opacity-90 transition-all"
            >
              <ShieldAlert size={15} />
              {t('report.download')} PDF
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
