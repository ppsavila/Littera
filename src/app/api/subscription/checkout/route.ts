import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { PLANS, type Plan } from '@/lib/subscriptions/plans'

const ABACATE_API_KEY = process.env.ABACATE_PAY_API_KEY
const ABACATE_API_URL = 'https://api.abacatepay.com/v1'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan, taxId } = await request.json() as { plan: Plan; taxId: string }
  // taxId arrives as 11 raw digits from the client
  if (!plan || plan === 'free') {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
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
    .select('full_name')
    .eq('id', user.id)
    .single()

  console.log('[checkout] taxId being sent:', taxId)
  // Create billing session via Abacate.pay
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
        cellphone: '',
        taxId,
        metadata: { userId: user.id, plan },
      },
      returnUrl: `${appUrl}/pricing`,
      completionUrl: `${appUrl}/pricing?success=true&plan=${plan}`,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    console.error('[checkout] Abacate.pay error:', response.status, JSON.stringify(err))
    return NextResponse.json(
      { error: 'Erro ao criar sessão de pagamento', details: err },
      { status: 502 }
    )
  }

  const data = await response.json()

  // Log payment attempt
  await db.from('subscription_payments').insert({
    user_id: user.id,
    plan,
    amount: planConfig.price,
    currency: 'BRL',
    status: 'pending',
    checkout_id: data.data?.id ?? null,
    metadata: { abacate: data },
  })

  return NextResponse.json({
    checkoutUrl: data.data?.url ?? null,
    checkoutId: data.data?.id ?? null,
  })
}
