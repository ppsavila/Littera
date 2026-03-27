import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PLANS, type Plan } from '@/lib/subscriptions/plans'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await request.json() as { plan: Plan }
  if (!plan || plan === 'free' || !PLANS[plan]) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  }

  // Verify there's a pending payment for this user + plan
  const { data: payment } = await supabase
    .from('subscription_payments')
    .select('id')
    .eq('user_id', user.id)
    .eq('plan', plan)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!payment) {
    return NextResponse.json({ error: 'Nenhum pagamento pendente encontrado' }, { status: 404 })
  }

  // Activate the plan
  await Promise.all([
    supabase
      .from('profiles')
      .update({ subscription_plan: plan })
      .eq('id', user.id),
    supabase
      .from('subscription_payments')
      .update({ status: 'completed' })
      .eq('id', payment.id),
  ])

  return NextResponse.json({ ok: true, plan })
}
