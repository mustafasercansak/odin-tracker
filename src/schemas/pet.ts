import { z } from 'zod'

export const speciesSchema = z.enum(['cat', 'dog', 'bird', 'rabbit', 'other'])

// Converts NaN (from empty number inputs with valueAsNumber: true) to undefined
const optionalNumber = z.preprocess(
  (v) => (typeof v === 'number' && isNaN(v)) ? undefined : v,
  z.number().optional()
)

export const petSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string().min(1),
  species: speciesSchema,
  breed: z.string().optional(),
  dateOfBirth: z.string().optional(),
  weightKg: optionalNumber,
  targetWeightKg: optionalNumber,
  microchipId: z.string().optional(),
  passportNumber: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  emergencyContacts: z.array(z.object({
    name: z.string(),
    phone: z.string().optional(),
    relation: z.string().optional(),
  })).optional(),
  veterinarianName: z.string().optional(),
  veterinarianPhone: z.string().optional(),
  currentFood: z.string().optional(),
  feedingSchedule: z.string().optional(),
  supplements: z.string().optional(),
  photoUrl: z.string().optional(),
  notes: z.string().optional(),
  role: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const petInputSchema = z.object({
  name: z.string().min(1, 'İsim zorunlu'),
  species: speciesSchema,
  breed: z.string().optional(),
  dateOfBirth: z.string().optional(),
  weightKg: optionalNumber,
  targetWeightKg: optionalNumber,
  microchipId: z.string().optional(),
  passportNumber: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  emergencyContacts: z.array(z.object({
    name: z.string(),
    phone: z.string().optional(),
    relation: z.string().optional(),
  })).optional(),
  veterinarianName: z.string().optional(),
  veterinarianPhone: z.string().optional(),
  currentFood: z.string().optional(),
  feedingSchedule: z.string().optional(),
  supplements: z.string().optional(),
  notes: z.string().optional(),
})

export type Pet = z.infer<typeof petSchema> & {
  isShared?: boolean;
  role?: 'owner' | 'admin' | 'editor' | 'viewer';
}
export type PetInput = z.infer<typeof petInputSchema>
