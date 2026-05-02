import { db } from './firebase';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import { type Pet } from '@/schemas/pet';
import { type HealthRecord } from '@/schemas/healthRecord';
import { type Medication } from '@/schemas/medication';

export interface ExportData {
  version: string;
  exportedAt: string;
  pets: Pet[];
  healthRecords: HealthRecord[];
  medications: Medication[];
}

/**
 * Exports all data for a user as a JSON file.
 */
export async function exportUserData(userId: string) {
  try {
    // 1. Get all pets
    const petsQ = query(collection(db, 'pets'), where('ownerId', '==', userId));
    const petsSnap = await getDocs(petsQ);
    const pets = petsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Pet[];

    // 2. Get all health records
    const recordsQ = query(collection(db, 'health_records'), where('ownerId', '==', userId));
    const recordsSnap = await getDocs(recordsQ);
    const healthRecords = recordsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as HealthRecord[];

    // 3. Get all medications
    const medsQ = query(collection(db, 'medications'), where('ownerId', '==', userId));
    const medsSnap = await getDocs(medsQ);
    const medications = medsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Medication[];

    const data: ExportData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      pets,
      healthRecords,
      medications,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `odin-tracker-backup-${new Date().toISOString().split('T')[0]}.json`);

    return true;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

/**
 * Imports data from a JSON file.
 */
export async function importUserData(userId: string, data: ExportData) {
  if (data.version !== '3.0') {
    throw new Error('invalid_version');
  }

  // Flatten all operations to perform
  const operations: Array<{ ref: any, data: any }> = [];

  data.pets.forEach(pet => {
    const { id, ...rest } = pet;
    operations.push({
      ref: doc(db, 'pets', id),
      data: { ...rest, ownerId: userId }
    });
  });

  data.healthRecords.forEach(record => {
    const { id, ...rest } = record;
    operations.push({
      ref: doc(db, 'health_records', id),
      data: { ...rest, ownerId: userId }
    });
  });

  data.medications.forEach(med => {
    const { id, ...rest } = med;
    operations.push({
      ref: doc(db, 'medications', id),
      data: { ...rest, ownerId: userId }
    });
  });

  // Firestore batches are limited to 500 operations
  const BATCH_LIMIT = 500;
  for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = operations.slice(i, i + BATCH_LIMIT);
    
    chunk.forEach(op => {
      batch.set(op.ref, op.data);
    });

    await batch.commit();
  }
}
