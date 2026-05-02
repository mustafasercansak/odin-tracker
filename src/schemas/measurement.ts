import { z } from 'zod'

export const canonicalParameterSchema = z.enum([
  'creatinine',
  'sdma',
  'bun',
  'phosphorus',
  'potassium',
  'calcium',
  'sodium',
  'chloride',
  'albumin',
  'total_protein',
  'urine_specific_gravity',
  'upc_ratio',
  'urine_ph',
  'hematocrit',
  'hemoglobin',
  'wbc',
  'platelets',
  'alt',
  'ast',
  'alkp',
  'glucose',
  't4',
])

export type CanonicalParameter = z.infer<typeof canonicalParameterSchema>

export const measurementSchema = z.object({
  parameter: z.union([canonicalParameterSchema, z.string()]),
  originalLabel: z.string(),
  value: z.number(),
  unit: z.string(),
  referenceMin: z.number().nullable(),
  referenceMax: z.number().nullable(),
  flag: z.enum(['high', 'low', 'normal']).nullable(),
  confidence: z.enum(['high', 'medium', 'low']).nullable(),
  aiExtracted: z.boolean(),
})

export type Measurement = z.infer<typeof measurementSchema>

export const canonicalParameters = canonicalParameterSchema.options
