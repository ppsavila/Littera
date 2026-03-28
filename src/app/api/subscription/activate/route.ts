import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { parseJsonBody, SubscriptionActivateSchema } from '@/lib/validation/schemas'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = await parseJsonBody(request)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const result = SubscriptionActivateSchema.safeParse(parsed.data)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { plan } = result.data

  const db = createServiceClient()

  // Verify there's a pending payment for this user + plan
  const { data: payment } = await db
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

  await Promise.all([
    db.from('profiles').update({ subscription_plan: plan }).eq('id', user.id),
    db.from('subscription_payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', payment.id),
  ])

  return NextResponse.json({ ok: true, plan })
}
