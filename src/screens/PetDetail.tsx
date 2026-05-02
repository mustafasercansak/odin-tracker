import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, 
  Edit2, 
  Plus, 
  Activity, 
  Pill, 
  TrendingUp, 
  Users,
  Calendar,
  Weight,
  FileText,
  FileDown,
  Search
} from 'lucide-react';
import { usePets } from '@/hooks/queries/usePets';
import { useHealthRecords, useLabRecords } from '@/hooks/queries/useHealthRecords';
import { useMedications } from '@/hooks/queries/useMedications';
import { useAppStore } from '@/store/useAppStore';
import { generatePetReport } from '@/lib/reportGenerator';
import { format, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { TrendsTab } from '@/components/Trends/TrendsTab';
import { MedicationsTab } from '@/components/Medications/MedicationsTab';

type TabType = 'health_records' | 'medications' | 'trends' | 'shared_access';

export default function PetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { pets, isLoading: petsLoading } = usePets();
  const { records, isLoading: recordsLoading } = useHealthRecords(id || null);
  const { labRecords } = useLabRecords(id || null);
  const { medications } = useMedications(id || null);
  const { setActiveModal, searchQuery } = useAppStore();

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records;
    const query = searchQuery.toLowerCase();
    return records.filter(record => 
      record.description?.toLowerCase().includes(query) ||
      record.recordType.toLowerCase().includes(query) ||
      record.notes?.toLowerCase().includes(query)
    );
  }, [records, searchQuery]);
  
  const [activeTab, setActiveTab] = useState<TabType>('health_records');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  const handleDownloadReport = async () => {
    if (!pet) return;
    setIsGeneratingReport(true);
    try {
      // Small delay to allow hidden charts to render
      await new Promise(resolve => setTimeout(resolve, 800));

      // Find all chart containers in the DOM
      const chartContainers = document.querySelectorAll('[data-report-chart]');
      const charts: Record<string, HTMLElement> = {};
      chartContainers.forEach(el => {
        const param = el.getAttribute('data-report-chart');
        if (param) charts[param] = el as HTMLElement;
      });

      await generatePetReport({
        pet,
        records,
        medications,
        charts,
        t,
        locale: i18n.language
      });
      // @ts-ignore
      import('react-hot-toast').then(({ toast }) => toast.success(t('report.success')));
    } catch (error) {
      console.error('Report generation failed:', error);
      // @ts-ignore
      import('react-hot-toast').then(({ toast }) => toast.error(t('report.error')));
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const pet = useMemo(() => pets.find(p => p.id === id), [pets, id]);

  if (petsLoading || recordsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold mb-2">{t('pets.petNotFound')}</h2>
        <button onClick={() => navigate('/')} className="text-primary font-semibold hover:underline">
          {t('common.back')}
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'health_records', label: t('tabs.healthRecords'), icon: Activity, hidden: false },
    { id: 'medications', label: t('tabs.medications'), icon: Pill, hidden: false },
    { id: 'trends', label: t('tabs.trends'), icon: TrendingUp, hidden: labRecords.length === 0 },
    { id: 'shared_access', label: t('tabs.sharedAccess'), icon: Users, hidden: false },
  ] as const;

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="font-medium">{t('common.back')}</span>
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadReport}
              disabled={isGeneratingReport}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors text-sm font-semibold disabled:opacity-50"
            >
              {isGeneratingReport ? (
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FileDown size={18} className="text-primary" />
              )}
              <span className="hidden sm:inline">{t('report.download')}</span>
            </button>
            <button 
              onClick={() => setActiveModal('pet_edit', pet)}
              className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <Edit2 size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold overflow-hidden shadow-inner flex-shrink-0">
            {pet.photoUrl ? (
              <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              <span>{pet.name[0].toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight truncate">{pet.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-muted-foreground">
              <span className="font-semibold text-foreground/80">{t(`pets.species_values.${pet.species}`)}</span>
              {pet.breed && <span>{pet.breed}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm bg-card border border-border px-3 py-1 rounded-full">
                <Calendar size={14} className="text-primary" />
                <span>
                  {pet.dateOfBirth 
                    ? format(parseISO(pet.dateOfBirth), 'd MMMM yyyy', { locale: dateLocale })
                    : '---'
                  }
                </span>
              </div>
              {pet.weightKg && (
                <div className="flex items-center gap-1.5 text-sm bg-card border border-border px-3 py-1 rounded-full">
                  <Weight size={14} className="text-primary" />
                  <span>{pet.weightKg} kg</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-2xl w-fit">
        {tabs.filter(t => !t.hidden).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 text-sm font-bold
              ${activeTab === tab.id 
                ? 'bg-card text-primary shadow-sm shadow-primary/10' 
                : 'text-muted-foreground hover:text-foreground hover:bg-card/30'
              }
            `}
          >
            <tab.icon size={18} className={activeTab === tab.id ? 'text-primary' : ''} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'health_records' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('healthRecords.title')}</h2>
              <button 
                onClick={() => setActiveModal('record_add', { petId: pet.id })}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                <Plus size={18} />
                <span>{t('healthRecords.addRecord')}</span>
              </button>
            </div>

            {records.length === 0 ? (
              <div className="py-12 text-center bg-card border border-dashed border-border rounded-3xl">
                <FileText size={40} className="mx-auto text-muted-foreground mb-3 opacity-20" />
                <p className="text-muted-foreground">{t('common.noData')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRecords.length === 0 && searchQuery && (
                  <div className="py-12 text-center bg-secondary/30 rounded-3xl border border-dashed border-border">
                    <Search size={40} className="mx-auto text-muted-foreground mb-3 opacity-20" />
                    <p className="text-muted-foreground">{t('common.noResultsFor', { query: searchQuery })}</p>
                  </div>
                )}
                {filteredRecords.map((record) => (
                  <div 
                    key={record.id}
                    className="bg-card border border-border rounded-2xl p-4 hover:border-primary/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                          {/* Record type icon logic here */}
                          <Activity size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold group-hover:text-primary transition-colors">
                            {t(`healthRecords.recordTypes.${record.recordType}`)}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(record.recordDate), 'd MMMM yyyy', { locale: dateLocale })}
                          </p>
                        </div>
                      </div>
                      {record.recordType === 'lab_test' && record.measurements && (
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                            {t('healthRecords.nMeasurements', { count: record.measurements.length })}
                          </span>
                        </div>
                      )}
                    </div>
                    {record.description && (
                      <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
                        {record.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'medications' && pet.id && (
          <MedicationsTab petId={pet.id} />
        )}

        {activeTab === 'trends' && pet.id && (
          <TrendsTab petId={pet.id} />
        )}

        {activeTab === 'shared_access' && pet.id && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('tabs.sharedAccess')}</h2>
              <button 
                onClick={() => setActiveModal('share_pet', { petId: pet.id })}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-all"
              >
                <Plus size={18} />
                <span>{t('shares.invite')}</span>
              </button>
            </div>

            <div className="py-12 text-center bg-card border border-dashed border-border rounded-3xl">
              <Users size={40} className="mx-auto text-muted-foreground mb-3 opacity-20" />
              <p className="text-muted-foreground mb-6">
                {t('shares.description')}
              </p>
              <button 
                onClick={() => setActiveModal('share_pet', { petId: pet.id })}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                {t('shares.invite')}
              </button>
            </div>
          </div>
        )}

        {/* Hidden Container for Report Charts (Only used during PDF generation) */}
        {isGeneratingReport && pet.id && (
          <div className="fixed -left-[2000px] -top-[2000px] w-[800px]">
            <TrendsTab petId={pet.id} />
          </div>
        )}
      </div>
    </div>
  );
}
