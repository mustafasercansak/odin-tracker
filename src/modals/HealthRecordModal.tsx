import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Save, Upload, Sparkles, Plus, FileText, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useAppStore } from '@/store/useAppStore';
import { useHealthRecords } from '@/hooks/queries/useHealthRecords';
import { useExtractLabResults, mapExtractionErrorToMessage } from '@/hooks/queries/useExtraction';
import { useExtractionUsage } from '@/hooks/queries/useUsage';
import { healthRecordInputSchema, type HealthRecordInput, type HealthRecord } from '@/schemas/healthRecord';
import { uploadFile } from '@/lib/storage';
import { MeasurementEditor } from '@/components/MeasurementEditor';

export const HealthRecordModal: React.FC = () => {
  const { t } = useTranslation();
  const { activeModal, setActiveModal, modalData } = useAppStore();
  const { addRecord, updateRecord } = useHealthRecords((modalData as any)?.petId || null);
  const extractMutation = useExtractLabResults();
  const { data: usage } = useExtractionUsage();
  
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(
    (modalData as HealthRecord)?.fileUrl || null
  );

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
    resolver: zodResolver(healthRecordInputSchema),
    defaultValues: isEdit ? {
      petId: recordToEdit.petId,
      recordDate: recordToEdit.recordDate,
      recordType: recordToEdit.recordType,
      description: recordToEdit.description,
      notes: recordToEdit.notes,
      fileUrl: recordToEdit.fileUrl,
      weightKg: (recordToEdit as any).weightKg,
      labName: (recordToEdit as any).labName,
      measurements: (recordToEdit as any).measurements || [],
    } : {
      petId: (modalData as any)?.petId || '',
      recordDate: new Date().toISOString().split('T')[0],
      recordType: 'vet_visit',
      measurements: [],
    },
  });

  const recordType = watch('recordType');
  const currentMeasurements = watch('measurements') || [];

  useEffect(() => {
    if (activeModal === 'record_add' || activeModal === 'record_edit') {
      if (modalData) {
        if (isEdit) {
           reset({
            petId: recordToEdit.petId,
            recordDate: recordToEdit.recordDate.split('T')[0],
            recordType: recordToEdit.recordType,
            description: recordToEdit.description,
            notes: recordToEdit.notes,
            fileUrl: recordToEdit.fileUrl,
            weightKg: (recordToEdit as any).weightKg,
            labName: (recordToEdit as any).labName,
            measurements: (recordToEdit as any).measurements || [],
          });
          setFileUrl(recordToEdit.fileUrl || null);
        } else {
          reset({
            petId: (modalData as any).petId,
            recordDate: new Date().toISOString().split('T')[0],
            recordType: 'vet_visit',
            description: '',
            notes: '',
            measurements: [],
          });
          setFileUrl(null);
        }
      }
    }
  }, [activeModal, modalData, isEdit, reset]);

  const handleClose = () => {
    setActiveModal(null);
    reset();
    setFile(null);
    setFileUrl(null);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error(t('lab.extraction.errors.large_file'));
        return;
      }
      setFile(selectedFile);
      // In a real app, we might upload here to get a URL for AI extraction
      // For now, we'll upload on submit or when AI button is clicked
    }
  };

  const handleAIExtract = async () => {
    if (!file && !fileUrl) return;

    setExtracting(true);
    const messages = [
      t('lab.extraction.loading1'),
      t('lab.extraction.loading2'),
      t('lab.extraction.loading3'),
    ];
    let msgIdx = 0;
    setProgressMsg(messages[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setProgressMsg(messages[msgIdx]);
    }, 2000);

    try {
      let currentFileUrl = fileUrl;
      
      // Upload file first if not already uploaded
      if (file) {
        const path = `health_files/${watch('petId')}/${Date.now()}_${file.name}`;
        currentFileUrl = await uploadFile(file, path);
        setFileUrl(currentFileUrl);
        setFile(null); // Clear local file after upload
      }

      if (!currentFileUrl) throw new Error('File upload failed');

      const result = await extractMutation.mutateAsync({
        fileUrl: currentFileUrl,
        petId: watch('petId'),
      });

      // Fill form with results
      if (result.testDate) setValue('recordDate', result.testDate);
      if (result.labName) setValue('labName', result.labName);
      if (result.measurements) setValue('measurements', result.measurements);
      if (result.notes) {
        const currentNotes = watch('notes') || '';
        setValue('notes', currentNotes + (currentNotes ? '\n\n' : '') + result.notes);
      }

      toast.success(t('common.toasts.extractionSuccess', { count: result.measurements.length }));
      
      const lowConfidenceCount = result.measurements.filter(m => m.confidence === 'low').length;
      if (lowConfidenceCount > 0) {
        toast(t('common.toasts.extractionPartial', { count: lowConfidenceCount }), { icon: '⚠️' });
      }

    } catch (error: any) {
      console.error('Extraction error:', error);
      const messageKey = mapExtractionErrorToMessage(error.code);
      toast.error(t(messageKey));
    } finally {
      clearInterval(interval);
      setExtracting(false);
    }
  };

  const onSubmit = async (data: HealthRecordInput) => {
    setLoading(true);
    try {
      let finalFileUrl = fileUrl;

      if (file) {
        const path = `health_files/${data.petId}/${Date.now()}_${file.name}`;
        finalFileUrl = await uploadFile(file, path);
      }

      const payload = {
        ...data,
        fileUrl: finalFileUrl || null,
      };

      if (isEdit && recordToEdit) {
        await updateRecord.mutateAsync({
          id: recordToEdit.id,
          ...payload,
        } as any);
      } else {
        await addRecord.mutateAsync(payload as any);
      }
      
      toast.success(t('common.toasts.saved'));
      handleClose();
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error(t('common.toasts.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={activeModal === 'record_add' || activeModal === 'record_edit'} 
      onClose={handleClose}
      title={isEdit ? t('healthRecords.editRecord') : t('healthRecords.addRecord')}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Record Date */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">{t('healthRecords.recordDate')}</label>
            <input
              type="date"
              {...register('recordDate')}
              className={`w-full px-4 py-2.5 rounded-xl bg-input border ${errors.recordDate ? 'border-destructive' : 'border-border'} focus:ring-2 focus:ring-primary focus:border-transparent outline-none`}
            />
          </div>

          {/* Record Type */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">{t('healthRecords.recordType')}</label>
            <select
              {...register('recordType')}
              className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none"
            >
              {Object.keys(t('healthRecords.recordTypes', { returnObjects: true })).map((type) => (
                <option key={type} value={type}>
                  {t(`healthRecords.recordTypes.${type}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1.5">{t('healthRecords.description')}</label>
            <input
              {...register('description')}
              className={`w-full px-4 py-2.5 rounded-xl bg-input border ${errors.description ? 'border-destructive' : 'border-border'} focus:ring-2 focus:ring-primary focus:border-transparent outline-none`}
              placeholder={t('healthRecords.description')}
            />
          </div>

          {/* Conditional Fields: Weight */}
          {recordType === 'weight' && (
            <div className="md:col-span-2 animate-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-semibold mb-1.5">{t('healthRecords.weightKg')}</label>
              <input
                type="number"
                step="0.01"
                {...register('weightKg', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none"
                placeholder="0.00"
              />
            </div>
          )}

          {/* Conditional Fields: Lab Test */}
          {recordType === 'lab_test' && (
            <div className="md:col-span-2 space-y-6 animate-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-sm font-semibold mb-1.5">{t('healthRecords.labName')}</label>
                <input
                  {...register('labName')}
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none"
                  placeholder={t('healthRecords.labName')}
                />
              </div>

              {/* Lab Values Section */}
              <div className="bg-secondary/30 rounded-2xl p-4 border border-border">
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <button
                    type="button"
                    onClick={handleAIExtract}
                    disabled={(!file && !fileUrl) || extracting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                  >
                    {extracting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        <span>{progressMsg}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        {t('healthRecords.extractWithAI')}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentMeasurements.length === 0) {
                        setValue('measurements', [{
                          parameter: 'creatinine',
                          originalLabel: '',
                          value: 0,
                          unit: 'mg/dL',
                          referenceMin: null,
                          referenceMax: null,
                          flag: 'normal',
                          confidence: 'high',
                          aiExtracted: false,
                        }]);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-secondary text-foreground rounded-xl text-sm font-bold hover:bg-secondary/80 transition-all"
                  >
                    <Plus size={18} />
                    {t('healthRecords.addManually')}
                  </button>
                </div>

                {usage && (
                  <div className="mb-4 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {t('lab.extraction.remaining', { 
                        remaining: usage.limit - usage.count, 
                        limit: usage.limit 
                      })}
                    </p>
                  </div>
                )}

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
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1.5">{t('healthRecords.file')}</label>
            <div className="relative group">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-input border border-border group-hover:border-primary transition-all">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
                  {file || fileUrl ? <FileText size={20} /> : <Upload size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file ? file.name : fileUrl ? 'Uploaded file' : t('healthRecords.uploadFile')}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                    Max 10MB • PDF, JPG, PNG
                  </p>
                </div>
                <ChevronRight size={20} className="text-muted-foreground" />
              </div>
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={onFileChange}
                accept="image/*,application/pdf"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1.5">{t('healthRecords.notes')}</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:ring-2 focus:ring-primary outline-none resize-none"
              placeholder={t('healthRecords.notes')}
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
