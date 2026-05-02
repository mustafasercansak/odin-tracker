import React from 'react';
import { useTranslation } from 'react-i18next';
import type { HealthRecord } from '@/schemas/healthRecord';
import { format, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { Syringe, Stethoscope, Pill, Activity, FlaskConical, Weight, PartyPopper, HeartPulse, CalendarPlus } from 'lucide-react';
import { downloadICS } from '@/lib/ics-generator';

interface HistoryTimelineProps {
  records: HealthRecord[];
}

const getIcon = (type: string) => {
  switch (type) {
    case 'vaccination': return <Syringe size={18} />;
    case 'vet_visit': return <Stethoscope size={18} />;
    case 'medication': return <Pill size={18} />;
    case 'lab_test': return <FlaskConical size={18} />;
    case 'weight': return <Weight size={18} />;
    case 'milestone': return <PartyPopper size={18} />;
    case 'symptom_checkin': return <HeartPulse size={18} />;
    default: return <Activity size={18} />;
  }
};

const getColor = (type: string) => {
  switch (type) {
    case 'vaccination': return 'bg-blue-500';
    case 'vet_visit': return 'bg-purple-500';
    case 'medication': return 'bg-green-500';
    case 'lab_test': return 'bg-primary';
    case 'weight': return 'bg-orange-500';
    case 'milestone': return 'bg-amber-400 text-black';
    case 'symptom_checkin': return 'bg-rose-500';
    default: return 'bg-slate-500';
  }
};

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ records }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  // Sort records by date descending
  const sortedRecords = [...records].sort((a, b) => 
    parseISO(b.recordDate).getTime() - parseISO(a.recordDate).getTime()
  );

  return (
    <div className="relative py-8">
      {/* Vertical Line */}
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 hidden md:block"></div>
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border md:hidden"></div>

      <div className="space-y-12">
        {sortedRecords.map((record, index) => (
          <div key={record.id} className="relative flex items-center group">
            {/* Dot/Icon Container */}
            <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10">
              <div className={`w-12 h-12 rounded-2xl ${getColor(record.recordType)} text-white flex items-center justify-center shadow-lg shadow-black/10 group-hover:scale-110 transition-transform`}>
                {getIcon(record.recordType)}
              </div>
            </div>

            {/* Content Card */}
            <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-16' : 'md:pl-16 md:ml-auto'} pl-20 pr-4 md:px-16`}>
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group/card">
                {/* Date Badge */}
                <div className="inline-block px-3 py-1 bg-secondary rounded-lg text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                  {format(parseISO(record.recordDate), 'dd MMMM yyyy', { locale: dateLocale })}
                </div>

                <h3 className="text-lg font-bold leading-tight mb-2 group-hover/card:text-primary transition-colors">
                  {record.description}
                </h3>

                {record.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2 italic mb-3">
                    "{record.notes}"
                  </p>
                )}

                {record.recordType === 'lab_test' && (record as any).labName && (
                  <div className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider mb-2">
                    <FlaskConical size={14} />
                    {(record as any).labName}
                  </div>
                )}

                {record.recordType === 'vaccination' && (record as any).nextDoseDate && (
                  <button
                    onClick={() => {
                      const event = {
                        title: `🐾 ${t('shares.roles.vet')} - ${record.description}`,
                        description: record.notes || '',
                        startDate: parseISO((record as any).nextDoseDate),
                      };
                      downloadICS(event, `vet-visit-${record.id}`);
                    }}
                    className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors w-fit border border-primary/20"
                  >
                    <CalendarPlus size={14} />
                    {t('common.add')}
                  </button>
                )}

                {/* Type Indicator Background Accent */}
                <div className={`absolute top-0 right-0 w-2 h-full ${getColor(record.recordType)} opacity-10`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
