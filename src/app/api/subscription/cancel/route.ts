import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

const ABACATE_API_KEY = process.env.ABACATE_PAY_API_KEY
const ABACATE_API_URL = 'https://api.abacatepay.com/v1'

/**
 * Cancel the current user's subscription.
 *
 * Behaviour: "cancel at period end"
 *   - Calls Abacate.pay to stop future charges
 *   - Sets subscription_status = 'cancelled' in the DB
 *   - The user keeps access until subscription_expires_at
 *   - The gateway will also fire a 'subscription.cancelled' webhook
 *     which will call deactivateSubscription — that's the final cleanup
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan, subscription_status, abacate_subscription_id, subscription_expires_at')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  if (profile.subscription_plan === 'free' || profile.subscription_status !== 'active') {
    return NextResponse.json(
      { error: 'Nenhuma assinatura ativa para cancelar.' },
      { status: 400 }
    )
  }

  if (ABACATE_API_KEY && profile.abacate_subscription_id) {
    // Attempt to cancel on Abacate.pay side
    // Endpoint documented as DELETE /v1/subscription/:id or POST /v1/subscription/:id/cancel
    const res = await fetch(
      `${ABACATE_API_URL}/subscription/${profile.abacate_subscription_id}/cancel`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${ABACATE_API_KEY}` },
      }
    )

    if (!res.ok && res.status !== 404) {
      const err = await res.json().catch(() => ({}))
      console.error('[cancel] Abacate.pay error:', res.status, JSON.stringify(err))
      return NextResponse.json(
        { error: 'Não foi possível cancelar no gateway. Tente novamente.' },
        { status: 502 }
      )
    }
  }

  // Mark as cancelled — user keeps access until expires_at
  const db = createServiceClient()
  await db
    .from('profiles')
    .update({ subscription_status: 'cancelled' })
    .eq('id', user.id)

  return NextResponse.json({
    ok: true,
    accessUntil: profile.subscription_expires_at,
  })
}
