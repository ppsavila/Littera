import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { checkAndIncrementDailyLimit } from '@/lib/subscriptions/access'
import { PLANS, type Plan } from '@/lib/subscriptions/plans'

const ESSAY_CREATE_RATE_MAX = 20
const ESSAY_CREATE_RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

async function checkEssayCreateRateLimit(userId: string): Promise<boolean> {
  const db = createServiceClient()
  const { data } = await db.rpc('check_ai_rate_limit', {
    p_user_id: userId,
    p_max: ESSAY_CREATE_RATE_MAX,
    p_window_ms: ESSAY_CREATE_RATE_WINDOW_MS,
  })
  return data === true
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await checkEssayCreateRateLimit(user.id))) {
    return NextResponse.json(
      { error: 'Muitas redações criadas em pouco tempo. Tente novamente em alguns minutos.' },
      { status: 429 }
    )
  }

  // Check daily correction limit (respects feature flag)
  const limit = await checkAndIncrementDailyLimit(user.id)
  if (!limit.allowed) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single()

    const plan = (profile?.subscription_plan as Plan) ?? 'free'
    const planConfig = PLANS[plan]

    return NextResponse.json(
      {
        error: 'Limite diário de correções atingido.',
        code: 'DAILY_LIMIT_REACHED',
        used: limit.used,
        limit: limit.limit,
        plan,
        planName: planConfig.name,
        nextPlan: plan === 'free' ? 'plus' : plan === 'plus' ? 'premium' : null,
      },
      { status: 429 }
    )
  }

  const body = await request.json()

  const ALLOWED_FIELDS = [
    'student_id', 'title', 'source_type',
    'storage_path', 'raw_text', 'theme', 'status',
  ] as const

  const sanitized: Record<string, unknown> = { teacher_id: user.id }
  for (const key of ALLOWED_FIELDS) {
    if (key in body) sanitized[key] = body[key]
  }

  if (!sanitized.title || !sanitized.source_type) {
    return NextResponse.json({ error: 'title and source_type are required' }, { status: 400 })
  }

  const { data: essay, error } = await supabase
    .from('essays')
    .insert(sanitized)
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(
    { id: essay.id, dailyUsed: limit.used, dailyLimit: limit.limit },
    { status: 201 }
  )
}
