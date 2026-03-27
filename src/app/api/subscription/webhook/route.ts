import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Plan } from '@/lib/subscriptions/plans'
import { createHmac, timingSafeEqual } from 'crypto'
import { logger } from '@/lib/logger'

/**
 * Abacate.pay webhook endpoint.
 *
 * In Abacate.pay dashboard: Integrações > Webhooks
 *   URL: https://seu-dominio.com/api/subscription/webhook
 *   Secret: same value as ABACATE_PAY_WEBHOOK_SECRET env var
 *
 * Signature header: X-Webhook-Signature (HMAC-SHA256 of raw body)
 *
 * Events handled:
 *   billing.paid           → first charge on ONE_TIME (legacy / dev mode)
 *   subscription.completed → first charge on MONTHLY subscription
 *   subscription.renewed   → subsequent monthly charge
 *   subscription.cancelled → user or gateway cancelled — downgrade to free
 *   checkout.refunded      → refund issued — downgrade to free
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

  logger.info('webhook.received', { event, dataId: data?.id })

  switch (event) {
    // First charge on one-time billing (legacy/dev) or MONTHLY subscription
    case 'billing.paid':
    case 'subscription.completed': {
      const userId = data?.customer?.metadata?.userId
      const plan = data?.customer?.metadata?.plan as Plan
      const paymentId = data?.id ?? null
      if (userId && plan) {
        await activateSubscription(userId, plan, paymentId, 'initial')
      }
      break
    }

    // Recurring monthly charge — extend expiry by one more month
    case 'subscription.renewed': {
      const userId = data?.customer?.metadata?.userId
      const plan = data?.customer?.metadata?.plan as Plan
      const paymentId = data?.id ?? null
      if (userId && plan) {
        await renewSubscription(userId, plan, paymentId)
      }
      break
    }

    // Cancellation (user-initiated or gateway) — downgrade immediately
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

async function activateSubscription(
  userId: string,
  plan: Plan,
  paymentId: string | null,
  paymentType: 'initial' | 'renewal' | 'manual' = 'initial',
) {
  const supabase = createServiceClient()

  // Idempotency: skip if this payment_id was already processed
  if (paymentId) {
    const { data: existing } = await supabase
      .from('subscription_payments')
      .select('id')
      .eq('payment_id', paymentId)
      .eq('status', 'paid')
      .maybeSingle()

    if (existing) {
      logger.info('webhook.idempotent_skip', { paymentId, userId })
      return
    }
  }

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

  logger.info('webhook.subscription_activated', { userId, plan, expiresAt: expiresAt.toISOString() })

  if (paymentId) {
    // Try to update an existing pending record first; insert if none found
    const { count } = await supabase
      .from('subscription_payments')
      .update({ status: 'paid', payment_id: paymentId, paid_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      // Supabase doesn't expose affected rows directly; we'll insert if nothing was updated

    if (!count) {
      // No pending record found — insert directly (renewal or delayed webhook)
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', userId)
        .single()

      await supabase.from('subscription_payments').insert({
        user_id: userId,
        plan: profile?.subscription_plan ?? plan,
        amount: 0, // amount unknown at this point; will be filled from metadata if needed
        currency: 'BRL',
        status: 'paid',
        payment_id: paymentId,
        payment_type: paymentType,
        paid_at: new Date().toISOString(),
      })
    }
  }
}

async function renewSubscription(userId: string, plan: Plan, paymentId: string | null) {
  const supabase = createServiceClient()

  // Idempotency check
  if (paymentId) {
    const { data: existing } = await supabase
      .from('subscription_payments')
      .select('id')
      .eq('payment_id', paymentId)
      .eq('status', 'paid')
      .maybeSingle()

    if (existing) return
  }

  // Extend from current expiry (or now if already expired)
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_expires_at')
    .eq('id', userId)
    .single()

  const base = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at)
    : new Date()

  // Don't extend from a date too far in the past
  if (base < new Date()) base.setTime(Date.now())
  base.setMonth(base.getMonth() + 1)

  await supabase
    .from('profiles')
    .update({
      subscription_plan: plan,
      subscription_status: 'active',
      subscription_expires_at: base.toISOString(),
    })
    .eq('id', userId)

  if (paymentId) {
    await supabase.from('subscription_payments').insert({
      user_id: userId,
      plan,
      amount: 0,
      currency: 'BRL',
      status: 'paid',
      payment_id: paymentId,
      payment_type: 'renewal',
      paid_at: new Date().toISOString(),
    })
  }
}

async function deactivateSubscription(userId: string) {
  const supabase = createServiceClient()
  await supabase
    .from('profiles')
    .update({
      subscription_plan: 'free',
      subscription_status: 'inactive',
      abacate_subscription_id: null,
    })
    .eq('id', userId)
}
