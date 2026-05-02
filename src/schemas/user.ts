import { z } from 'zod'

export const userSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  locale: z.enum(['tr', 'en']).default('tr'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  createdAt: z.string(),
})

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
})

export const registerSchema = loginSchema.extend({
  displayName: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
})

export const profileInputSchema = z.object({
  displayName: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  photoURL: z.string().optional(),
  newPassword: z.string().min(6, 'Şifre en az 6 karakter olmalı').optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});


export type AppUser = z.infer<typeof userSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProfileInput = z.infer<typeof profileInputSchema>
