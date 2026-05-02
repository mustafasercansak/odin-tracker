import { z } from 'zod'

export const speciesSchema = z.enum(['cat', 'dog', 'bird', 'rabbit', 'other'])

export const petSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string().min(1),
  species: speciesSchema,
  breed: z.string().optional(),
  dateOfBirth: z.string().optional(),
  weightKg: z.number().optional(),
  photoUrl: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const petInputSchema = z.object({
  name: z.string().min(1, 'İsim zorunlu'),
  species: speciesSchema,
  breed: z.string().optional(),
  dateOfBirth: z.string().optional(),
  weightKg: z.number().optional(),
  notes: z.string().optional(),
})

export type Pet = z.infer<typeof petSchema>
export type PetInput = z.infer<typeof petInputSchema>
