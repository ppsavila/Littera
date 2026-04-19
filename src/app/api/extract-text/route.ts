import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { extractTextFromImage } from '@/lib/ai/extract-text'
import { parseJsonBody } from '@/lib/validation/schemas'
import { z } from 'zod'

const EXTRACT_RATE_MAX = 20
const EXTRACT_RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

// ~6MB base64 corresponds to ~4.5MB raw — safe margin under Claude's 5MB limit
const MAX_BASE64_LENGTH = 6 * 1024 * 1024

const ExtractTextSchema = z.object({
  imageBase64: z.string().min(1).max(MAX_BASE64_LENGTH),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
})

async function checkExtractRateLimit(userId: string): Promise<boolean> {
  const db = createServiceClient()
  const { data } = await db.rpc('check_ai_rate_limit', {
    p_user_id: userId,
    p_max: EXTRACT_RATE_MAX,
    p_window_ms: EXTRACT_RATE_WINDOW_MS,
  })
  return data === true
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await checkExtractRateLimit(user.id))) {
    return NextResponse.json(
      { error: 'Muitas extrações em pouco tempo. Tente novamente em alguns minutos.' },
      { status: 429 }
    )
  }

  const parsed = await parseJsonBody(request)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const result = ExtractTextSchema.safeParse(parsed.data)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', issues: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { imageBase64, mimeType } = result.data as { imageBase64: string; mimeType: AllowedMimeType }

  try {
    const text = await extractTextFromImage(imageBase64, mimeType)
    return NextResponse.json({ text })
  } catch (err) {
    console.error('[extract-text] Error:', err)
    return NextResponse.json({ error: 'Falha ao extrair texto da imagem' }, { status: 500 })
  }
}
