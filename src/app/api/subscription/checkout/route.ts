import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { PLANS, type Plan } from '@/lib/subscriptions/plans'
import { logger } from '@/lib/logger'
import { parseJsonBody, SubscriptionCheckoutSchema } from '@/lib/validation/schemas'

const ABACATE_API_KEY = process.env.ABACATE_PAY_API_KEY
const ABACATE_API_URL = 'https://api.abacatepay.com/v1'

const CHECKOUT_RATE_MAX = 5
const CHECKOUT_RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

async function checkCheckoutRateLimit(userId: string): Promise<boolean> {
  const db = createServiceClient()
  const { data } = await db.rpc('check_ai_rate_limit', {
    p_user_id: userId,
    p_max: CHECKOUT_RATE_MAX,
    p_window_ms: CHECKOUT_RATE_WINDOW_MS,
  })
  return data === true
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await checkCheckoutRateLimit(user.id))) {
    return NextResponse.json(
      { error: 'Muitas tentativas de pagamento. Tente novamente mais tarde.' },
      { status: 429 }
    )
  }

  const parsed = await parseJsonBody(request)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const result = SubscriptionCheckoutSchema.safeParse(parsed.data)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { plan, taxId } = result.data

  // Validate CPF: strip formatting, must be 11 digits with valid check digits
  const cpfDigits = taxId.replace(/\D/g, '')
  if (!isValidCpf(cpfDigits)) {
    return NextResponse.json({ error: 'CPF inválido. Verifique e tente novamente.' }, { status: 400 })
  }

  const planConfig = PLANS[plan]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!ABACATE_API_KEY) {
    // Payments not configured yet — return friendly message
    return NextResponse.json(
      {
        error: 'Pagamentos ainda não disponíveis. Em breve!',
        code: 'PAYMENTS_NOT_CONFIGURED',
      },
      { status: 503 }
    )
  }

  // Fetch user profile for customer data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, cellphone')
    .eq('id', user.id)
    .single()

  // Create recurring monthly subscription via Abacate.pay
  // Docs: https://docs.abacatepay.com
  const response = await fetch(`${ABACATE_API_URL}/billing/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ABACATE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      frequency: 'ONE_TIME',
      methods: ['PIX'],
      products: [
        {
          externalId: `litterando_${plan}`,
          name: `Litterando ${planConfig.name}`,
          quantity: 1,
          price: Math.round(planConfig.price * 100), // in cents (R$ → centavos)
        },
      ],
      customer: {
        name: profile?.full_name || user.email?.split('@')[0] || 'Professor',
        email: user.email ?? '',
        cellphone: profile?.cellphone ?? '',
        taxId: cpfDigits,
        metadata: { userId: user.id, plan },
      },
      returnUrl: `${appUrl}/pricing`,
      completionUrl: `${appUrl}/pricing?success=true&plan=${plan}`,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    logger.error('checkout.abacate_error', new Error('Abacate.pay request failed'), {
      status: response.status,
      userId: user.id,
      plan,
      details: err,
    })
    return NextResponse.json(
      { error: 'Erro ao criar sessão de pagamento', details: err },
      { status: 502 }
    )
  }

  const data = await response.json()
  const subscriptionId: string | null = data.data?.id ?? null

  // Persist subscription ID for future cancellation requests
  if (subscriptionId) {
    await db
      .from('profiles')
      .update({ abacate_subscription_id: subscriptionId })
      .eq('id', user.id)
  }

  // Log initial payment attempt
  await db.from('subscription_payments').insert({
    user_id: user.id,
    plan,
    amount: planConfig.price,
    currency: 'BRL',
    status: 'pending',
    checkout_id: subscriptionId,
    payment_type: 'initial',
    metadata: { abacate: data },
  })

  logger.info('checkout.created', { userId: user.id, plan, subscriptionId })

  return NextResponse.json({
    checkoutUrl: data.data?.url ?? null,
    checkoutId: subscriptionId,
  })
}

/**
 * Validates a Brazilian CPF number.
 * Accepts 11 raw digits (no formatting).
 * Returns false for known invalid sequences (all same digit) and wrong check digits.
 */
function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let check = (sum * 10) % 11
  if (check === 10 || check === 11) check = 0
  if (check !== parseInt(cpf[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  check = (sum * 10) % 11
  if (check === 10 || check === 11) check = 0
  return check === parseInt(cpf[10])
}
