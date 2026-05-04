import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Save, Upload, Sparkles, FileText, X, CheckCircle2, FlaskConical, Syringe, Stethoscope, Pill, Scale, PartyPopper, HeartPulse, Activity } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useAppStore } from '@/store/useAppStore';
import { useHealthRecords } from '@/hooks/queries/useHealthRecords';
import {
  useExtractWithAnthropic,
  extractWithGemini,
  extractWithGroq,
  mapExtractionErrorToMessage,
  type ExtractionProvider,
} from '@/hooks/queries/useExtraction';
import { useExtractionUsage } from '@/hooks/queries/useUsage';
import { healthRecordInputSchema, type HealthRecordInput, type HealthRecord } from '@/schemas/healthRecord';
import { uploadFile } from '@/lib/storage';
import { MeasurementEditor } from '@/components/MeasurementEditor';
import { CustomDateInput } from '@/components/CustomDateInput';
import { CustomTimeInput } from '@/components/CustomTimeInput';
import { format, parseISO } from 'date-fns';

const EXTRACTION_STEP_KEYS = [
  'lab.extraction.loading1',
  'lab.extraction.loading2',
  'lab.extraction.loading3',
] as const;

export const HealthRecordModal: React.FC = () => {
  const { t } = useTranslation();
  const { activeModal, setActiveModal, modalData } = useAppStore();
  const { addRecord, updateRecord, deleteRecord } = useHealthRecords((modalData as any)?.petId || null);
  const anthropicMutation = useExtractWithAnthropic();
  const { data: usage } = useExtractionUsage();

  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractionStep, setExtractionStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [provider, setProvider] = useState<ExtractionProvider>('google');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = activeModal === 'record_edit';
  const recordToEdit = modalData as HealthRecord;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<HealthRecordInput>({
    resolver: zodResolver(healthRecordInputSchema) as any,
    defaultValues: {
      petId: (modalData as any)?.petId || '',
      recordDate: new Date().toISOString().split('T')[0],
      recordTime: format(new Date(), 'HH:mm'),
      recordType: 'vet_visit',
      description: '',
      measurements: [],
    },
  });

  const recordType = watch('recordType');
  const currentMeasurements = watch('measurements') || [];
  const isLabTest = recordType === 'lab_test';

  useEffect(() => {
    if (activeModal !== 'record_add' && activeModal !== 'record_edit') return;

    if (isEdit && recordToEdit) {
      reset({
        petId: recordToEdit.petId,
        recordDate: recordToEdit.recordDate.split('T')[0],
        recordTime: format(parseISO(recordToEdit.recordDate), 'HH:mm'),
        recordType: recordToEdit.recordType,
        description: recordToEdit.description,
        notes: recordToEdit.notes,
        fileUrl: recordToEdit.fileUrl,
        weightKg: (recordToEdit as any).weightKg,
        labName: (recordToEdit as any).labName,
        measurements: (recordToEdit as any).measurements || [],
        nextDoseDate: (recordToEdit as any).nextDoseDate,
        milestoneType: (recordToEdit as any).milestoneType,
        appetite: (recordToEdit as any).appetite,
        energy: (recordToEdit as any).energy,
        mood: (recordToEdit as any).mood,
        heartRate: (recordToEdit as any).heartRate,
        respiratoryRate: (recordToEdit as any).respiratoryRate,
        temperature: (recordToEdit as any).temperature,
      });
      setFileUrl(recordToEdit.fileUrl || null);
    } else if (modalData) {
      reset({
        petId: (modalData as any).petId,
        recordDate: new Date().toISOString().split('T')[0],
        recordTime: format(new Date(), 'HH:mm'),
        recordType: 'vet_visit',
        description: '',
        notes: '',
        measurements: [],
      });
      setFileUrl(null);
      setFiles([]);
    }
  }, [activeModal]);

  const handleClose = () => {
    setActiveModal(null);
    reset();
    setFiles([]);
    setFileUrl(null);
    setIsDragging(false);
    setExtracting(false);
    setExtractionStep(0);
  };

  const processFile = useCallback((f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      toast.error(t('lab.extraction.errors.large_file'));
      return;
    }
    setFiles((prev) => [...prev, f]);
  }, [t]);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    Array.from(e.dataTransfer.files).forEach((f) => processFile(f));
  }, [processFile]);

  const applyExtractionResult = (result: { testDate?: string | null; labName?: string | null; measurements?: any[]; notes?: string | null }) => {
    if (result.testDate) setValue('recordDate', result.testDate);
    if (result.labName) setValue('labName', result.labName);
    if (result.measurements?.length) {
      setValue('measurements', result.measurements.map(m => ({ ...m, aiExtracted: true })));
    }
    if (result.notes) {
      const cur = watch('notes') || '';
      setValue('notes', cur + (cur ? '\n\n' : '') + result.notes);
    }
    const count = result.measurements?.length ?? 0;
    toast.success(t('common.toasts.extractionSuccess', { count }));
    const lowCount = result.measurements?.filter(m => m.confidence === 'low').length ?? 0;
    if (lowCount > 0) {
      toast(t('common.toasts.extractionPartial', { count: lowCount }), { icon: '⚠️' });
    }
  };

  const handleAIExtract = async () => {
    if (files.length === 0 && !fileUrl) return;

    // ── Check token limits for shared keys ──
    const state = useAppStore.getState();
    const isUsingPersonalKey = 
      (provider === 'google' && !!state.aiKeys?.google) ||
      (provider === 'groq' && !!state.aiKeys?.groq) ||
      (provider === 'anthropic' && !!state.aiKeys?.anthropic);

    if (!isUsingPersonalKey && usage && usage.count >= usage.limit) {
      toast.error(t('lab.extraction.errors.quota_exceeded'));
      return;
    }

    setExtracting(true);
    setExtractionStep(0);

    try {
      if (provider === 'google' && files.length > 0) {
        // ── Gemini: direct browser call, all files in one request ──
        setExtractionStep(1);
        const result = await extractWithGemini(files);
        setExtractionStep(2);
        applyExtractionResult(result);
      } else if (provider === 'groq' && files.length > 0) {
        // ── Groq: direct browser call ──
        setExtractionStep(1);
        const result = await extractWithGroq(files);
        setExtractionStep(2);
        applyExtractionResult(result);
      } else {
        // ── Anthropic: upload first file → Cloud Function ──
        let currentFileUrl = fileUrl;
        if (files.length > 0) {
          const f = files[0];
          const path = `health_files/${watch('petId')}/${Date.now()}_${f.name}`;
          currentFileUrl = await uploadFile(f, path);
          setFileUrl(currentFileUrl);
        }
        setExtractionStep(1);
        if (!currentFileUrl) throw new Error('Upload failed');
        const result = await anthropicMutation.mutateAsync({
          fileUrl: currentFileUrl,
          petId: watch('petId'),
        });
        setExtractionStep(2);
        applyExtractionResult(result);
      }
    } catch (error: any) {
      const messageKey = mapExtractionErrorToMessage(error.code || error.message || '');
      toast.error(t(messageKey));
    } finally {
      setExtracting(false);
    }
  };

  const onSubmit = async (data: HealthRecordInput) => {
    console.log('--- HealthRecordModal: onSubmit triggered ---');
    console.log('Form Data:', data);
    console.log('Current ModalData:', modalData);

    if (!data.petId) {
      console.error('Submission blocked: petId is missing');
      toast.error('Hata: Pet ID bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
      return;
    }

    const saveToast = toast.loading(t('common.loading'));
    setLoading(true);

    try {
      let finalFileUrl = fileUrl;
      let finalFileUrls: string[] | undefined;

      if (files.length > 0) {
        console.log('Uploading files...', files.length);
        try {
          const uploaded = await Promise.all(
            files.map((f) => {
              const path = `health_files/${data.petId}/${Date.now()}_${f.name}`;
              return uploadFile(f, path);
            })
          );
          finalFileUrls = uploaded;
          finalFileUrl = uploaded[0];
          console.log('Files uploaded successfully:', finalFileUrls);
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
          toast.error(t('common.toasts.fileUploadFailed'));
        }
      }

      const finalDate = `${data.recordDate}T${data.recordTime || '00:00'}:00`;
      const finalDescription =
        data.recordType === 'lab_test'
          ? data.labName?.trim() || t('healthRecords.recordTypes.lab_test')
          : data.description?.trim() || '';

      const payload: any = {
        petId: data.petId,
        recordType: data.recordType,
        recordDate: finalDate,
        description: finalDescription,
      };

      if (data.notes) payload.notes = data.notes;
      if (finalFileUrl) payload.fileUrl = finalFileUrl;
      if (finalFileUrls) payload.fileUrls = finalFileUrls;
      if (data.recordType === 'weight' && typeof data.weightKg === 'number') payload.weightKg = data.weightKg;
      if (data.recordType === 'lab_test') {
        if (data.labName) payload.labName = data.labName;
        if (data.measurements) payload.measurements = data.measurements;
        if (data.extractionMetadata) payload.extractionMetadata = data.extractionMetadata;
      }
      if (data.recordType === 'vaccination' && data.nextDoseDate) payload.nextDoseDate = data.nextDoseDate;
      if (data.recordType === 'medication' && data.medicationId) payload.medicationId = data.medicationId;
      if (data.recordType === 'vitals') {
        if (typeof data.heartRate === 'number') payload.heartRate = data.heartRate;
        if (typeof data.respiratoryRate === 'number') payload.respiratoryRate = data.respiratoryRate;
        if (typeof data.temperature === 'number') payload.temperature = data.temperature;
      }

      console.log('Sending payload to Firebase:', payload);

      if (isEdit && recordToEdit) {
        await updateRecord.mutateAsync({ id: recordToEdit.id, ...payload });
        console.log('Record updated successfully');
      } else {
        await addRecord.mutateAsync(payload);
        console.log('Record added successfully');
      }

      toast.success(t('common.toasts.saved'), { id: saveToast });
      handleClose();
    } catch (error: any) {
      console.error('Save failed with error:', error);
      toast.error(`${t('common.toasts.error')}: ${error.message || 'Unknown error'}`, { id: saveToast });
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!recordToEdit || !window.confirm(t('common.confirmDelete'))) return;

    const deleteToast = toast.loading(t('common.loading'));
    setLoading(true);
    try {
      console.log('Attempting to delete record:', recordToEdit.id, 'for pet:', recordToEdit.petId);
      await deleteRecord.mutateAsync({ id: recordToEdit.id, petId: recordToEdit.petId });
      console.log('Delete successful');
      toast.success(t('common.toasts.deleted'), { id: deleteToast });
      handleClose();
    } catch (error: any) {
      console.error('Delete failed with error details:', error);
      toast.error(`${t('common.toasts.error')}: ${error.message || 'Silme işlemi başarısız oldu'}`, { id: deleteToast });
    } finally {
      setLoading(false);
    }
  };

  const hasFile = files.length > 0 || !!fileUrl;

  return (
    <Modal
      isOpen={activeModal === 'record_add' || activeModal === 'record_edit'}
      onClose={handleClose}
      title={
        isEdit
          ? t('healthRecords.editRecord')
          : isLabTest
            ? t('lab.addLabResult')
            : t('healthRecords.addRecord')
      }
    >
      <form
        aria-label="health-record-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 pb-4"
      >
        {/* ── Record Type Selector (always visible) ── */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
            {t('healthRecords.recordType')}
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['lab_test', 'vet_visit', 'medication', 'weight', 'vaccination', 'vitals', 'symptom_checkin', 'milestone'] as const).map((type) => {
              const Icon = 
                type === 'lab_test' ? FlaskConical :
                type === 'vet_visit' ? Stethoscope :
                type === 'medication' ? Pill :
                type === 'weight' ? Scale :
                type === 'vaccination' ? Syringe :
                type === 'vitals' ? HeartPulse :
                type === 'symptom_checkin' ? Activity :
                type === 'milestone' ? PartyPopper :
                Activity;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('recordType', type)}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold transition-all text-center flex flex-col items-center gap-1 border ${
                    recordType === type
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground border-transparent'
                  }`}
                >
                  <Icon size={14} />
                  <span className="truncate w-full">{t(`healthRecords.recordTypes.${type}`)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {isLabTest ? (
          /* ════════════════════════════════════════
             LAB TEST LAYOUT
          ════════════════════════════════════════ */
          <>
            {/* 1. File Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : hasFile
                    ? 'border-primary/40 bg-card'
                    : 'border-border hover:border-primary/30 hover:bg-secondary/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={(e) => { Array.from(e.target.files ?? []).forEach((f) => processFile(f)); e.target.value = ''; }}
                accept="image/*,application/pdf"
              />

              {hasFile ? (
                <div className="p-4 space-y-4">
                  {/* File list */}
                  <div className="space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{f.name}</p>
                          <p className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {fileUrl && files.length === 0 && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{t('healthRecords.fileUploaded')}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFileUrl(null)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                    >
                      <Upload size={13} />
                      {t('lab.dragDrop.addFile')}
                    </button>
                  </div>

                  {/* AI Extraction area */}
                  {extracting ? (
                    /* Progress steps */
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        {EXTRACTION_STEP_KEYS.map((key, i) => (
                          <React.Fragment key={i}>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ${
                                  i < extractionStep
                                    ? 'bg-primary text-primary-foreground'
                                    : i === extractionStep
                                      ? 'bg-primary/20 text-primary ring-2 ring-primary/40 animate-pulse'
                                      : 'bg-secondary border border-border text-muted-foreground'
                                }`}
                              >
                                {i < extractionStep ? (
                                  <CheckCircle2 size={14} />
                                ) : (
                                  <span className="text-[11px] font-bold">{i + 1}</span>
                                )}
                              </div>
                              <span
                                className={`text-xs font-medium hidden sm:block ${
                                  i === extractionStep ? 'text-primary' : 'text-muted-foreground'
                                }`}
                              >
                                {t(key)}
                              </span>
                            </div>
                            {i < EXTRACTION_STEP_KEYS.length - 1 && (
                              <div
                                className={`h-px flex-1 transition-all duration-500 ${
                                  i < extractionStep ? 'bg-primary' : 'bg-border'
                                }`}
                              />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Provider toggle */}
                      <div className="flex items-center gap-1.5 p-1 bg-secondary/60 rounded-xl">
                        {(['google', 'groq', 'anthropic'] as const).map((p) => {
                          const state = useAppStore.getState();
                          const hasPersonalKey = !!state.aiKeys?.[p === 'google' ? 'google' : p === 'groq' ? 'groq' : 'anthropic'];
                          
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setProvider(p)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                provider === p
                                  ? 'bg-card text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {p === 'google' ? (
                                <>
                                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-primary" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 24a12 12 0 1 1 12-12 12.013 12.013 0 0 1-12 12zm0-22a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2z"/>
                                    <path d="M12.5 7.5 11 11l-3.5 1.5L11 14l1.5 3.5 1.5-3.5 3.5-1.5L14 11z"/>
                                  </svg>
                                  <span className="text-[10px]">Gemini 3 Flash</span>
                                </>
                              ) : p === 'groq' ? (
                                <>
                                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-orange-500" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                  </svg>
                                  <span className="text-[10px]">Groq</span>
                                </>
                              ) : (
                                <>
                                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-amber-600" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                                  </svg>
                                  <span className="text-[10px]">Claude</span>
                                </>
                              )}
                              {hasPersonalKey && (
                                <div className="w-1 h-1 rounded-full bg-green-500 absolute top-1 right-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {/* Extract button */}
                      <button
                        type="button"
                        onClick={handleAIExtract}
                        className="w-full flex items-center justify-center gap-2.5 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                      >
                        <Sparkles size={18} />
                        {t('healthRecords.extractWithAI')}
                        {usage && (
                          <span className="text-xs opacity-70 font-medium bg-white/10 px-2 py-0.5 rounded-full">
                            {(provider === 'google' && useAppStore.getState().aiKeys?.google) ||
                             (provider === 'groq' && useAppStore.getState().aiKeys?.groq) ||
                             (provider === 'anthropic' && useAppStore.getState().aiKeys?.anthropic)
                              ? 'Unlimited'
                              : `${usage.limit - usage.count}/${usage.limit}`}
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty drop zone */
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 flex flex-col items-center gap-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <Upload size={26} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm text-foreground">{t('lab.dragDrop.title')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('lab.dragDrop.subtitle')}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                    {t('healthRecords.fileRequirements')}
                  </span>
                </button>
              )}
            </div>

            {/* 2. Lab Info: Date + Time + Lab Name */}
            <div className="grid grid-cols-3 gap-3">
              <Controller
                name="recordDate"
                control={control}
                render={({ field }) => (
                  <CustomDateInput
                    label={t('healthRecords.recordDate')}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.recordDate?.message}
                  />
                )}
              />
              <Controller
                name="recordTime"
                control={control}
                render={({ field }) => (
                  <CustomTimeInput
                    label={t('medications.time')}
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                )}
              />
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                  {t('healthRecords.labName')}
                </label>
                <input
                  {...register('labName')}
                  className="w-full px-3 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                  placeholder="e.g. VetLab"
                />
              </div>
            </div>

            {/* 3. Measurements – primary focus */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical size={16} className="text-primary" />
                  <h3 className="text-sm font-bold">
                    {t('healthRecords.measurements')}
                  </h3>
                  {currentMeasurements.length > 0 && (
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {currentMeasurements.length}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 min-h-[300px]">
                <Controller
                  control={control}
                  name="measurements"
                  render={({ field }) => (
                    <MeasurementEditor
                      measurements={field.value || []}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.measurements && (
                  <p className="text-destructive text-xs mt-2 font-medium">
                    {errors.measurements.message}
                  </p>
                )}
              </div>
            </div>

            {/* 4. Notes (optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                {t('healthRecords.notes')}
                <span className="normal-case font-normal ml-1.5">({t('common.optional')})</span>
              </label>
              <textarea
                {...register('notes')}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none resize-none text-sm"
                placeholder={t('healthRecords.notes')}
              />
            </div>
          </>
        ) : (
          /* ════════════════════════════════════════
             GENERIC RECORD LAYOUT
          ════════════════════════════════════════ */
          <>
            {/* Date & Time */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Controller
                name="recordDate"
                control={control}
                render={({ field }) => (
                  <CustomDateInput
                    label={t('healthRecords.recordDate')}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.recordDate?.message}
                  />
                )}
              />
              <Controller
                name="recordTime"
                control={control}
                render={({ field }) => (
                  <CustomTimeInput
                    label={t('medications.time')}
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Description (required) */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                {t('healthRecords.description')}
                <span className="text-destructive ml-0.5">*</span>
              </label>
              <input
                {...register('description')}
                className={`w-full px-4 py-2.5 rounded-xl bg-input border ${
                  errors.description ? 'border-destructive' : 'border-border'
                } focus:ring-2 focus:ring-primary focus:border-transparent outline-none`}
                placeholder={t('healthRecords.description')}
              />
              {errors.description && (
                <p className="text-destructive text-xs mt-1 font-medium">
                  {errors.description.message}
                </p>
              )}
            </div>

            {recordType === 'weight' && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-semibold mb-1.5">{t('healthRecords.weightKg')}</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('weightKg', { valueAsNumber: true })}
                  className={`w-full px-4 py-2.5 rounded-xl bg-input border ${
                    errors.weightKg ? 'border-destructive' : 'border-border'
                  } focus:ring-2 focus:ring-primary outline-none`}
                  placeholder="0.00"
                />
                {errors.weightKg && (
                  <p className="text-destructive text-xs mt-1 font-medium">
                    {errors.weightKg.message}
                  </p>
                )}
              </div>
            )}
            
            {recordType === 'vaccination' && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <Controller
                  name="nextDoseDate"
                  control={control}
                  render={({ field }) => (
                    <CustomDateInput
                      label={t('healthRecords.nextDoseDate')}
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            )}

            {recordType === 'vitals' && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      {t('healthRecords.vitals.heartRate')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        {...register('heartRate', { valueAsNumber: true })}
                        className="w-full pl-3 pr-12 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                        {t('healthRecords.vitals.bpm')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      {t('healthRecords.vitals.respiratoryRate')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        {...register('respiratoryRate', { valueAsNumber: true })}
                        className="w-full pl-3 pr-12 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                        {t('healthRecords.vitals.rr')}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                    {t('healthRecords.vitals.temperature')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      {...register('temperature', { valueAsNumber: true })}
                      className="w-full pl-3 pr-12 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
                      placeholder="0.0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                      {t('healthRecords.vitals.tempUnit')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* File upload (vet_visit, symptom) */}
            {(recordType === 'vet_visit' || recordType === 'symptom' || recordType === 'vaccination') && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-semibold mb-1.5">{t('healthRecords.file')}</label>
                <label
                  htmlFor="generic-file-input"
                  className="flex items-center gap-4 p-4 rounded-xl bg-input border border-border hover:border-primary/50 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
                    {hasFile ? <FileText size={20} /> : <Upload size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {files[0] ? files[0].name : fileUrl ? t('healthRecords.fileUploaded') : t('healthRecords.uploadFile')}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                      {t('healthRecords.fileRequirements')}
                    </p>
                  </div>
                </label>
                <input
                  id="generic-file-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.currentTarget.value = ''; }}
                  accept="image/*,application/pdf"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">{t('healthRecords.notes')}</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none resize-none"
                placeholder={t('healthRecords.notes')}
              />
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {isEdit && (
            <button
              type="button"
              onClick={onDelete}
              disabled={loading}
              className="flex-1 py-3.5 bg-secondary text-destructive rounded-2xl font-bold hover:bg-destructive/10 disabled:opacity-50 transition-all border border-transparent hover:border-destructive/20"
            >
              {t('common.delete')}
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`${isEdit ? 'flex-[2]' : 'w-full'} flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98]`}
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save size={20} />
                {isLabTest ? t('lab.saveLabResult') : t('common.save')}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
