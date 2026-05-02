import { z } from 'zod'
import { measurementSchema } from './measurement'

export const recordTypeSchema = z.enum([
  'medication',
  'vet_visit',
  'symptom',
  'lab_test',
  'weight',
])

export type RecordType = z.infer<typeof recordTypeSchema>

const baseRecordSchema = z.object({
  id: z.string(),
  petId: z.string(),
  recordDate: z.string(),
  description: z.string(),
  notes: z.string().optional(),
  fileUrl: z.string().optional(),
  fileUrls: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const extractionMetadataSchema = z.object({
  provider: z.enum(['anthropic', 'google']),
  model: z.string(),
  extractedAt: z.string(),
  userVerified: z.boolean(),
})

export const healthRecordSchema = z.discriminatedUnion('recordType', [
  baseRecordSchema.extend({
    recordType: z.literal('lab_test'),
    labName: z.string().optional(),
    measurements: z.array(measurementSchema).optional(),
    extractionMetadata: extractionMetadataSchema.optional(),
  }),
  baseRecordSchema.extend({
    recordType: z.literal('weight'),
    weightKg: z.number(),
  }),
  baseRecordSchema.extend({
    recordType: z.literal('medication'),
    medicationId: z.string().optional(),
  }),
  baseRecordSchema.extend({
    recordType: z.literal('vet_visit'),
  }),
  baseRecordSchema.extend({
    recordType: z.literal('symptom'),
  }),
])

export type HealthRecord = z.infer<typeof healthRecordSchema>
export type LabTestRecord = Extract<HealthRecord, { recordType: 'lab_test' }>
export type WeightRecord = Extract<HealthRecord, { recordType: 'weight' }>

export const healthRecordInputSchema = z.object({
  petId: z.string(),
  recordDate: z.string().min(1, 'Tarih zorunlu'),
  recordTime: z.string().optional(),
  recordType: recordTypeSchema,
  description: z.string(),
  notes: z.string().optional(),
  medicationId: z.string().optional(),
  fileUrl: z.string().optional(),
  fileUrls: z.array(z.string()).optional(),
  weightKg: z.number().optional(),
  labName: z.string().optional(),
  measurements: z.array(measurementSchema).optional(),
  extractionMetadata: extractionMetadataSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.recordType !== 'lab_test' && data.description.trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['description'],
      message: 'Açıklama zorunlu',
    });
  }
})

export type HealthRecordInput = z.infer<typeof healthRecordInputSchema>
