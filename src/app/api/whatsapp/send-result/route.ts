import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseFeature } from '@/lib/subscriptions/access'
import { parseJsonBody } from '@/lib/validation/schemas'
import { validatePhone, sendWhatsAppMessage } from '@/lib/whatsapp/client'
import { buildEssayResultMessage } from '@/lib/whatsapp/message'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// ── Input schema ──────────────────────────────────────────────────────────────

const SendResultSchema = z.object({
  essayId: z.string().uuid(),
})

// ── Constants ─────────────────────────────────────────────────────────────────

/** Block re-sends within this window (milliseconds). */
const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * POST /api/whatsapp/send-result
 *
 * Sends a formatted essay result to the student's WhatsApp number.
 *
 * Guards:
 *   - 401 if not authenticated
 *   - 403 if user is not on Premium plan
 *   - 404 if essay not found or does not belong to teacher
 *   - 422 if student has no phone registered
 *   - 422 if phone fails format validation
 *   - 429 if already sent successfully in the last 24h
 *   - 502 if the WhatsApp provider returns an error
 */
export async function POST(request: Request) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Premium gate ───────────────────────────────────────────────────────────
  const allowed = await canUseFeature(user.id, 'whatsapp')
  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Envio por WhatsApp está disponível apenas no plano Premium.',
        code: 'FEATURE_REQUIRES_PREMIUM',
        upgrade: 'premium',
      },
      { status: 403 },
    )
  }

  // ── Parse + validate body ──────────────────────────────────────────────────
  const parsed = await parseJsonBody(request)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const result = SendResultSchema.safeParse(parsed.data)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { essayId } = result.data

  // ── Fetch essay + student ──────────────────────────────────────────────────
  // Join students table to get the phone registered on the student record.
  // Use the authenticated client so RLS ensures the teacher owns this essay.
  const { data: essay, error: essayError } = await supabase
    .from('essays')
    .select(`
      id,
      title,
      theme,
      score_c1,
      score_c2,
      score_c3,
      score_c4,
      score_c5,
      total_score,
      share_token,
      general_comment,
      student:students!essays_student_id_fkey (
        id,
        name
      )
    `)
    .eq('id', essayId)
    .eq('teacher_id', user.id)
    .single()

  if (essayError || !essay) {
    logger.warn('whatsapp.send_result.essay_not_found', { essayId, userId: user.id })
    return NextResponse.json({ error: 'Redação não encontrada.' }, { status: 404 })
  }

  // ── Resolve student phone ──────────────────────────────────────────────────
  // Phone is stored on the profiles table, keyed by the student user id.
  // Students are linked to profiles only when they have a Supabase account;
  // otherwise we fall back to the phone stored on the students row if it exists.
  //
  // Lookup order:
  //   1. profiles.cellphone where profiles.id = student.id
  //   2. (future) students.phone column
  let studentPhone: string | null = null
  const studentRecord = Array.isArray(essay.student) ? essay.student[0] : essay.student

  if (studentRecord?.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('cellphone')
      .eq('id', studentRecord.id)
      .maybeSingle()

    studentPhone = profile?.cellphone ?? null
  }

  if (!studentPhone) {
    return NextResponse.json(
      {
        error: 'O aluno não possui telefone cadastrado. Peça ao aluno que atualize seu perfil com um número de celular.',
        code: 'STUDENT_PHONE_MISSING',
      },
      { status: 422 },
    )
  }

  // ── Validate phone format ──────────────────────────────────────────────────
  const { valid, normalized, error: phoneError } = validatePhone(studentPhone)
  if (!valid) {
    return NextResponse.json(
      { error: phoneError ?? 'Número de telefone inválido.', code: 'INVALID_PHONE' },
      { status: 422 },
    )
  }

  // ── Idempotency: block re-send within 24h ──────────────────────────────────
  const windowStart = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS).toISOString()

  const { data: recentSend } = await supabase
    .from('whatsapp_sends')
    .select('id, sent_at')
    .eq('essay_id', essayId)
    .eq('status', 'sent')
    .gte('sent_at', windowStart)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recentSend) {
    const sentAt = new Date(recentSend.sent_at)
    const nextAvailable = new Date(sentAt.getTime() + IDEMPOTENCY_WINDOW_MS)
    return NextResponse.json(
      {
        error: 'Resultado já foi enviado para este aluno nas últimas 24h.',
        code: 'ALREADY_SENT',
        sentAt: recentSend.sent_at,
        nextAvailableAt: nextAvailable.toISOString(),
      },
      { status: 429 },
    )
  }

  // ── Build message ──────────────────────────────────────────────────────────
  const message = buildEssayResultMessage({
    studentName: studentRecord?.name ?? 'Aluno',
    essayTitle: essay.title,
    theme: essay.theme,
    scoreC1: essay.score_c1,
    scoreC2: essay.score_c2,
    scoreC3: essay.score_c3,
    scoreC4: essay.score_c4,
    scoreC5: essay.score_c5,
    totalScore: essay.total_score ?? 0,
    shareToken: essay.share_token,
    generalComment: essay.general_comment,
  })

  // ── Insert pending record before sending ───────────────────────────────────
  // Use service client to bypass RLS on insert (the auth guard above is sufficient).
  const serviceClient = createServiceClient()
  const { data: sendRecord, error: insertError } = await serviceClient
    .from('whatsapp_sends')
    .insert({
      essay_id: essayId,
      sent_by: user.id,
      phone_to: normalized,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !sendRecord) {
    logger.error('whatsapp.send_result.insert_failed', insertError, { essayId, userId: user.id })
    return NextResponse.json({ error: 'Erro interno ao registrar envio.' }, { status: 500 })
  }

  // ── Send message via provider ──────────────────────────────────────────────
  logger.info('whatsapp.send_result.sending', {
    essayId,
    userId: user.id,
    sendRecordId: sendRecord.id,
    phone: normalized,
  })

  const sendResult = await sendWhatsAppMessage(normalized, message)

  // ── Update record with final status ───────────────────────────────────────
  await serviceClient
    .from('whatsapp_sends')
    .update({
      status: sendResult.success ? 'sent' : 'failed',
      provider: sendResult.provider,
      error_msg: sendResult.error ?? null,
      sent_at: new Date().toISOString(),
    })
    .eq('id', sendRecord.id)

  if (!sendResult.success) {
    logger.error('whatsapp.send_result.provider_error', undefined, {
      essayId,
      userId: user.id,
      provider: sendResult.provider,
      error: sendResult.error,
    })
    return NextResponse.json(
      {
        error: 'Falha ao enviar mensagem pelo WhatsApp. Tente novamente em instantes.',
        code: 'PROVIDER_ERROR',
        detail: process.env.NODE_ENV === 'development' ? sendResult.error : undefined,
      },
      { status: 502 },
    )
  }

  logger.info('whatsapp.send_result.sent', {
    essayId,
    userId: user.id,
    provider: sendResult.provider,
    messageId: sendResult.messageId,
  })

  return NextResponse.json({
    success: true,
    provider: sendResult.provider,
    messageId: sendResult.messageId,
    phone: normalized,
    sentAt: new Date().toISOString(),
  })
}
