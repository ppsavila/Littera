import { z } from 'zod'

// Helper: parse JSON body safely, return 400 on malformed JSON
// Used by all route handlers before schema validation
export async function parseJsonBody(request: Request): Promise<{ data: unknown } | { error: string }> {
  try {
    const data = await request.json()
    return { data }
  } catch {
    return { error: 'Invalid JSON body' }
  }
}

// POST /api/essays
export const EssayCreateSchema = z.object({
  title: z.string().min(1).max(500),
  source_type: z.enum(['pdf', 'image', 'text']),
  student_id: z.string().uuid().nullish(),
  storage_path: z.string().max(1000).nullish(),
  raw_text: z.string().nullish(),
  theme: z.string().max(500).nullish(),
  status: z.string().max(50).nullish(),
})

// PATCH /api/essays/[id]
export const EssayUpdateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  theme: z.string().max(500).optional(),
  status: z.string().max(50).optional(),
  raw_text: z.string().optional(),
  score_c1: z.number().int().min(0).max(200).optional(),
  score_c2: z.number().int().min(0).max(200).optional(),
  score_c3: z.number().int().min(0).max(200).optional(),
  score_c4: z.number().int().min(0).max(200).optional(),
  score_c5: z.number().int().min(0).max(200).optional(),
  notes_c1: z.string().optional(),
  notes_c2: z.string().optional(),
  notes_c3: z.string().optional(),
  notes_c4: z.string().optional(),
  notes_c5: z.string().optional(),
  general_comment: z.string().optional(),
  ai_analysis: z.record(z.string(), z.unknown()).optional(),
}).refine(obj => Object.keys(obj).length > 0, {
  message: 'At least one field must be provided',
})

// PATCH /api/profile
export const ProfileUpdateSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  cellphone: z.string().max(20).optional(),
  school: z.string().max(200).optional(),
}).refine(obj => Object.keys(obj).length > 0, {
  message: 'At least one field must be provided',
})

// POST /api/whatsapp/send
export const WhatsappSendSchema = z.object({
  essayId: z.string().uuid(),
  phone: z.string().min(10).max(20),
  message: z.string().max(2000).optional(),
})

// POST /api/subscription/activate
export const SubscriptionActivateSchema = z.object({
  plan: z.enum(['plus', 'premium']),
})

// POST /api/subscription/checkout
export const SubscriptionCheckoutSchema = z.object({
  plan: z.enum(['plus', 'premium']),
  taxId: z.string().min(11).max(14),
})

// POST /api/ai/student-analysis
export const StudentAnalysisSchema = z.object({
  studentId: z.string().uuid(),
})
