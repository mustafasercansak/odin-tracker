import { z } from 'zod'

export const canonicalParameterSchema = z.enum([
  // Chemistry / kidney
  'creatinine', 'sdma', 'bun', 'phosphorus', 'potassium', 'calcium', 'sodium', 'chloride',
  // Protein
  'albumin', 'total_protein',
  // Urine
  'urine_specific_gravity', 'upc_ratio', 'urine_ph',
  // CBC – red cell series
  'hematocrit', 'hemoglobin', 'rbc', 'mcv', 'mch', 'mchc', 'rdw_cv', 'rdw_sd',
  // CBC – white cell series
  'wbc', 'neutrophils', 'lymphocytes', 'monocytes', 'eosinophils', 'basophils',
  // CBC – platelets
  'platelets', 'mpv', 'pdw', 'pct',
  // Liver / endocrine
  'alt', 'ast', 'alkp', 'alp', 'ggt', 'bilirubin',
  'glucose', 't4', 'cholesterol', 'triglycerides',
])

export type CanonicalParameter = z.infer<typeof canonicalParameterSchema>

export const measurementSchema = z.object({
  parameter: z.union([canonicalParameterSchema, z.string()]),
  originalLabel: z.string().catch(''),
  value: z.number(),
  unit: z.string().catch(''),
  referenceMin: z.number().nullable().catch(null),
  referenceMax: z.number().nullable().catch(null),
  flag: z.enum(['high', 'low', 'normal']).nullable().catch(null),
  confidence: z.enum(['high', 'medium', 'low']).catch('medium'),
  aiExtracted: z.boolean().catch(false),
})

export type Measurement = z.infer<typeof measurementSchema>

export const canonicalParameters = canonicalParameterSchema.options
