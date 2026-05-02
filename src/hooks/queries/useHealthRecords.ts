import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type HealthRecord, type LabTestRecord } from '@/schemas/healthRecord';

export function useHealthRecords(petId: string | null) {
  const queryClient = useQueryClient();

  const recordsQuery = useQuery({
    queryKey: ['healthRecords', petId],
    queryFn: async () => {
      if (!petId) return [];
      
      const q = query(
        collection(db, 'health_records'),
        where('petId', '==', petId)
      );
      
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HealthRecord[];
      
      // Sort in memory to avoid missing index errors
      return records.sort((a, b) => 
        new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
      );
    },
    enabled: !!petId,
  });

  const addRecord = useMutation({
    mutationFn: async (recordData: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, 'health_records'), {
        ...recordData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthRecords', petId] });
    },
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, ...data }: Partial<HealthRecord> & { id: string }) => {
      const docRef = doc(db, 'health_records', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthRecords', petId] });
    },
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'health_records', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthRecords', petId] });
    },
  });

  return {
    records: recordsQuery.data || [],
    isLoading: recordsQuery.isLoading,
    addRecord,
    updateRecord,
    deleteRecord,
  };
}

export function useLabRecords(petId: string | null) {
  const { records, isLoading } = useHealthRecords(petId);

  const labRecords = records.filter(
    (record): record is LabTestRecord => 
      record.recordType === 'lab_test' && 
      Array.isArray(record.measurements) && 
      record.measurements.length > 0
  );

  return {
    labRecords,
    isLoading,
  };
}

export function useAllLabRecords(petIds: string[]) {
  const queryClient = useQueryClient();

  const allRecordsQuery = useQuery({
    queryKey: ['healthRecords', 'all', petIds],
    queryFn: async () => {
      if (petIds.length === 0) return [];
      
      // Firestore 'in' query limited to 10-30 items, but we'll fetch all records for these pets
      // For large number of pets, this might need optimization
      const q = query(
        collection(db, 'health_records'),
        where('petId', 'in', petIds),
        where('recordType', '==', 'lab_test')
      );
      
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LabTestRecord[];
      
      return records.filter(r => r.measurements && r.measurements.length > 0)
        .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
    },
    enabled: petIds.length > 0,
  });

  return {
    labRecords: allRecordsQuery.data || [],
    isLoading: allRecordsQuery.isLoading,
  };
}
