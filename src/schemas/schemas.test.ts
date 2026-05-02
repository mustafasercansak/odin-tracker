import { describe, it, expect } from 'vitest';
import { measurementSchema } from './measurement';
import { healthRecordSchema } from './healthRecord';

describe('Schemas Validation', () => {
  describe('measurementSchema', () => {
    it('should validate a correct canonical measurement', () => {
      const validData = {
        parameter: 'creatinine',
        originalLabel: 'Creatinine',
        value: 1.5,
        unit: 'mg/dL',
        referenceMin: 0.5,
        referenceMax: 1.8,
        flag: 'normal',
        confidence: 'high',
        aiExtracted: true
      };
      const result = measurementSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail on invalid parameter', () => {
      const invalidData = {
        parameter: '', // empty
        value: 'not a number'
      };
      const result = measurementSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('healthRecordSchema', () => {
    it('should validate a correct weight record', () => {
      const validData = {
        id: '123',
        petId: 'pet-1',
        ownerId: 'user-1',
        recordDate: '2024-05-01',
        recordType: 'weight',
        description: 'Monthly weight check',
        weightKg: 4.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const result = healthRecordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail if lab_test missing measurements', () => {
      const invalidData = {
        id: '123',
        petId: 'pet-1',
        ownerId: 'user-1',
        recordDate: '2024-05-01',
        recordType: 'lab_test',
        description: 'Incomplete lab test'
        // measurements missing
      };
      const result = healthRecordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
