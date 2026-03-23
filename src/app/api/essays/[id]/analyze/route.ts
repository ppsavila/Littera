import { createClient } from '@/lib/supabase/server'
import { analyzeEssayStream } from '@/lib/ai/analyze-essay'
import { NextResponse } from 'next/server'

// Simple in-memory rate limiter: max 5 analyses per user per 10 minutes
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Limite de análises atingido. Tente novamente em 10 minutos.' },
      { status: 429 }
    )
  }

  const { data: essay, error } = await supabase
    .from('essays')
    .select('*')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single()

  if (error || !essay) {
    return NextResponse.json({ error: 'Essay not found' }, { status: 404 })
  }

  const text = essay.raw_text ?? 'Texto da redação não disponível para análise automática.'

  // Fetch error markers for context
  const { data: errorMarkers } = await supabase
    .from('error_markers')
    .select('*')
    .eq('essay_id', id)

  let errorContext: string | undefined
  if (errorMarkers && errorMarkers.length > 0) {
    const { ERROR_TYPES_BY_COMPETENCY } = await import('@/types/error-marker')
    const lines: string[] = []
    for (const m of errorMarkers) {
      const et = ERROR_TYPES_BY_COMPETENCY[m.competency]?.find((e: { code: string }) => e.code === m.error_code)
      if (et) {
        lines.push(`- C${m.competency}: ${et.label} (${et.code}) — dedução: -${et.deduction} pts`)
      }
    }
    if (lines.length > 0) {
      errorContext = `O professor já identificou os seguintes erros na redação:\n${lines.join('\n')}\nConsidere esses erros identificados em sua análise.`
    }
  }

  // Update status to analyzing
  await supabase.from('essays').update({ status: 'analyzing' }).eq('id', id)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of analyzeEssayStream(text, essay.theme ?? undefined, errorContext)) {
          if (event.type === 'chunk') {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: event.text })}\n\n`)
            )
          } else if (event.type === 'done') {
            // Save analysis to DB
            await supabase
              .from('essays')
              .update({
                ai_analysis: event.analysis,
                status: 'analyzed',
                score_c1: event.analysis.competencies.c1.suggested_score,
                score_c2: event.analysis.competencies.c2.suggested_score,
                score_c3: event.analysis.competencies.c3.suggested_score,
                score_c4: event.analysis.competencies.c4.suggested_score,
                score_c5: event.analysis.competencies.c5.suggested_score,
              })
              .eq('id', id)

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'done', analysis: event.analysis })}\n\n`
              )
            )
          } else if (event.type === 'error') {
            await supabase.from('essays').update({ status: 'pending' }).eq('id', id)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', message: event.message })}\n\n`)
            )
          }
        }
      } catch (err) {
        await supabase.from('essays').update({ status: 'pending' }).eq('id', id)
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: 'Erro interno na análise' })}\n\n`
          )
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
