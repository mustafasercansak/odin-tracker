import { z } from 'zod'

export const frequencySchema = z.enum([
  'daily',
  'twice_daily',
  'three_times_daily',
  'four_times_daily',
  'every_other_day',
  'weekly',
  'as_needed',
])

export const medicationSchema = z.object({
  id: z.string(),
  petId: z.string(),
  name: z.string().min(1),
  dosage: z.string(),
  frequency: frequencySchema,
  startDate: z.string(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  nextDoseDue: z.string().optional(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const medicationInputSchema = z.object({
  name: z.string().min(1, 'İlaç adı zorunlu'),
  dosage: z.string().min(1, 'Doz zorunlu'),
  frequency: frequencySchema,
  startDate: z.string().min(1, 'Başlangıç tarihi zorunlu'),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  nextDoseDate: z.string().optional(),
  nextDoseTime: z.string().optional(),
})

export type Medication = z.infer<typeof medicationSchema>
export type MedicationInput = z.infer<typeof medicationInputSchema>
export type Frequency = z.infer<typeof frequencySchema>
