import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PLANS, type Plan } from '@/lib/subscriptions/plans'
import { isSubscriptionsEnabled } from '@/lib/subscriptions/flags'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan, subscription_status, subscription_expires_at, daily_corrections_count, daily_corrections_reset_date')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const subscriptionsEnabled = isSubscriptionsEnabled()
  const plan = (profile.subscription_plan as Plan) ?? 'free'
  const planConfig = PLANS[plan]
  const today = new Date().toISOString().slice(0, 10)
  const isNewDay = profile.daily_corrections_reset_date !== today
  const usedToday = isNewDay ? 0 : (profile.daily_corrections_count ?? 0)

  return NextResponse.json({
    subscriptionsEnabled,
    plan,
    planConfig,
    status: profile.subscription_status,
    expiresAt: profile.subscription_expires_at,
    usage: {
      corrections: {
        used: subscriptionsEnabled ? usedToday : 0,
        limit: subscriptionsEnabled ? planConfig.dailyCorrections : -1,
        unlimited: !subscriptionsEnabled || planConfig.dailyCorrections === -1,
      },
    },
    features: subscriptionsEnabled ? planConfig.features : { aiAnalysis: true, studentInsights: true, whatsapp: true },
  })
}

