import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Pet } from '@/schemas/pet';
import { useHealthRecords, useLabRecords } from '@/hooks/queries/useHealthRecords';
import { useMedications } from '@/hooks/queries/useMedications';
import { HistoryTimeline } from './HistoryTimeline';
import { TrendsTab } from '../Trends/TrendsTab';
import { AlertCircle, Stethoscope, Pill, FlaskConical } from 'lucide-react';
import { calculateAge } from '@/lib/pet-helpers';

interface VetDashboardProps {
  pet: Pet;
}

export const VetDashboard: React.FC<VetDashboardProps> = ({ pet }) => {
  const { t } = useTranslation();
  const { records = [] } = useHealthRecords(pet.id);
  const { medications = [] } = useMedications(pet.id);
  const { labRecords } = useLabRecords(pet.id);

  const activeMedications = medications.filter((m: any) => m.status === 'active');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 py-6 md:px-8">
      {/* Vet Header Badge */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          <Stethoscope size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-primary uppercase tracking-widest">{t('shares.roles.vet')} Dashboard</h2>
          <p className="text-sm font-medium text-muted-foreground">Read-only medical overview for {pet.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Critical Info & Meds */}
        <div className="space-y-6 lg:col-span-1">
          {/* Vitals Summary */}
          <div className="glass-panel rounded-3xl p-6 border-border space-y-4">
            <h3 className="font-bold text-lg border-b border-border pb-2">Patient Vitals</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider">Age</span>
                <span className="font-semibold">{pet.dateOfBirth ? calculateAge(pet.dateOfBirth, t) : 'Unknown'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider">Weight</span>
                <span className="font-semibold">{pet.weightKg ? `${pet.weightKg} kg` : 'Unknown'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider">Blood Type</span>
                <span className="font-semibold">{pet.bloodType || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider">Microchip</span>
                <span className="font-semibold">{pet.microchipId || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Allergies (Red) */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-3xl p-6">
            <div className="flex items-center gap-2 text-destructive mb-3">
              <AlertCircle size={20} />
              <h3 className="font-black uppercase tracking-tight">Allergies</h3>
            </div>
            <p className="text-lg font-bold text-destructive leading-tight">
              {pet.allergies || 'No known allergies reported.'}
            </p>
          </div>

          {/* Active Medications */}
          <div className="glass-panel rounded-3xl p-6 border-border">
            <div className="flex items-center gap-2 text-primary mb-4">
              <Pill size={20} />
              <h3 className="font-black uppercase tracking-tight">Active Medications</h3>
            </div>
            {activeMedications.length > 0 ? (
              <ul className="space-y-3">
                {activeMedications.map((med: any) => (
                  <li key={med.id} className="bg-secondary/50 p-3 rounded-xl border border-border">
                    <p className="font-bold">{med.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{med.dosage} - {med.frequency}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No active medications.</p>
            )}
          </div>
        </div>

        {/* Right Column: Timeline & Labs */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Lab Trends (if any) */}
          {labRecords && labRecords.length > 0 && (
            <div className="glass-panel rounded-3xl p-6 border-border">
              <div className="flex items-center gap-2 text-primary mb-4 border-b border-border pb-4">
                <FlaskConical size={24} />
                <h3 className="font-black text-xl uppercase tracking-tight">Lab Trends</h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 <TrendsTab petId={pet.id} />
              </div>
            </div>
          )}

          {/* Full Medical History */}
          <div className="glass-panel rounded-3xl p-6 border-border">
            <h3 className="font-black text-xl uppercase tracking-tight border-b border-border pb-4 mb-4">Complete Medical History</h3>
            <HistoryTimeline records={records} />
          </div>

        </div>
      </div>
    </div>
  );
};
