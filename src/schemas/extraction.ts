import { z } from 'zod'
import { measurementSchema } from './measurement'

export const extractionResultSchema = z.object({
  testDate: z.string().nullable(),
  labName: z.string().nullable(),
  patientName: z.string().nullable(),
  measurements: z.array(
    measurementSchema.omit({ aiExtracted: true }).extend({
      aiExtracted: z.literal(true).default(true),
    })
  ),
  notes: z.string().nullable(),
})

export type ExtractionResult = z.infer<typeof extractionResultSchema>
