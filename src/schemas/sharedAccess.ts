import { z } from 'zod'

export const accessRoleSchema = z.enum(['viewer', 'editor', 'admin'])

export const sharedAccessSchema = z.object({
  id: z.string(),
  petId: z.string(),
  ownerId: z.string(),
  sharedWithUserId: z.string(),
  sharedWithEmail: z.string().email(),
  role: accessRoleSchema,
  createdAt: z.string(),
})

export const sharedAccessInputSchema = z.object({
  sharedWithEmail: z.string().email('Geçerli bir e-posta girin'),
  role: accessRoleSchema,
})

export type SharedAccess = z.infer<typeof sharedAccessSchema>
export type SharedAccessInput = z.infer<typeof sharedAccessInputSchema>
export type AccessRole = z.infer<typeof accessRoleSchema>
