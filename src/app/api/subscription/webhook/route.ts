import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Plan } from '@/lib/subscriptions/plans'
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Abacate.pay webhook endpoint.
 *
 * In Abacate.pay dashboard: Integrações > Webhooks
 *   URL: https://seu-dominio.com/api/subscription/webhook
 *   Secret: same value as ABACATE_PAY_WEBHOOK_SECRET env var
 *
 * Signature header: X-Webhook-Signature (HMAC-SHA256 of raw body)
 */
export async function POST(request: Request) {
  const rawBody = await request.text()
  const webhookSecret = process.env.ABACATE_PAY_WEBHOOK_SECRET

  // Verify signature if secret is configured
  if (webhookSecret) {
    const signature = request.headers.get('x-webhook-signature') ?? ''
    if (!verifySignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const body = JSON.parse(rawBody)

  // Webhook payload: { id, event, apiVersion, devMode, data }
  const event = body?.event as string | undefined
  const data = body?.data

  switch (event) {
    case 'billing.paid': {
      const userId = data?.customer?.metadata?.userId
      const plan = data?.customer?.metadata?.plan as Plan
      const paymentId = data?.id ?? null
      if (userId && plan) {
        await activateSubscription(userId, plan, paymentId)
      }
      break
    }

    case 'subscription.cancelled':
    case 'checkout.refunded': {
      const userId = data?.customer?.metadata?.userId
      if (userId) await deactivateSubscription(userId)
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    const a = Buffer.from(signature, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

async function activateSubscription(userId: string, plan: Plan, paymentId: string | null) {
  const supabase = await createClient()

  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 1)

  await supabase
    .from('profiles')
    .update({
      subscription_plan: plan,
      subscription_status: 'active',
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq('id', userId)

  if (paymentId) {
    await supabase
      .from('subscription_payments')
      .update({ status: 'paid', payment_id: paymentId, paid_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
  }
}

async function deactivateSubscription(userId: string) {
  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({ subscription_plan: 'free', subscription_status: 'inactive' })
    .eq('id', userId)
}
