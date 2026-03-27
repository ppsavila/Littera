import { createClient } from '@/lib/supabase/server'
import { isSubscriptionsEnabled } from './flags'
import { PLANS, type Plan, type PlanFeatures } from './plans'

export interface DailyLimitResult {
  allowed: boolean
  used: number
  limit: number  // -1 = unlimited
  resetDate: string
}

/**
 * Checks if the user is within their daily correction limit.
 * If allowed, increments the counter.
 * When subscriptions are disabled, always returns allowed.
 */
export async function checkAndIncrementDailyLimit(userId: string): Promise<DailyLimitResult> {
  const today = new Date().toISOString().slice(0, 10)

  if (!isSubscriptionsEnabled()) {
    return { allowed: true, used: 0, limit: -1, resetDate: today }
  }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan, daily_corrections_count, daily_corrections_reset_date')
    .eq('id', userId)
    .single()

  if (!profile) return { allowed: false, used: 0, limit: 0, resetDate: today }

  const plan = PLANS[profile.subscription_plan as Plan]
  const isNewDay = profile.daily_corrections_reset_date !== today
  const count = isNewDay ? 0 : (profile.daily_corrections_count ?? 0)

  // Unlimited plan — still track for analytics
  if (plan.dailyCorrections === -1) {
    await supabase
      .from('profiles')
      .update({ daily_corrections_count: count + 1, daily_corrections_reset_date: today })
      .eq('id', userId)
    return { allowed: true, used: count + 1, limit: -1, resetDate: today }
  }

  if (count >= plan.dailyCorrections) {
    // Reset date if it's a new day but already at limit (edge case: same-day reset)
    if (isNewDay) {
      await supabase
        .from('profiles')
        .update({ daily_corrections_count: 0, daily_corrections_reset_date: today })
        .eq('id', userId)
      // After reset, they have 0 used — allow
      await supabase
        .from('profiles')
        .update({ daily_corrections_count: 1, daily_corrections_reset_date: today })
        .eq('id', userId)
      return { allowed: true, used: 1, limit: plan.dailyCorrections, resetDate: today }
    }
    return { allowed: false, used: count, limit: plan.dailyCorrections, resetDate: today }
  }

  await supabase
    .from('profiles')
    .update({ daily_corrections_count: count + 1, daily_corrections_reset_date: today })
    .eq('id', userId)

  return { allowed: true, used: count + 1, limit: plan.dailyCorrections, resetDate: today }
}

/**
 * Returns the user's current plan. Falls back to 'free'.
 */
export async function getUserPlan(userId: string): Promise<Plan> {
  if (!isSubscriptionsEnabled()) return 'free'

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('subscription_plan')
    .eq('id', userId)
    .single()

  return (data?.subscription_plan as Plan) ?? 'free'
}

/**
 * Checks if the user can access a given feature.
 * When subscriptions are disabled, all features are available.
 */
export async function canUseFeature(userId: string, feature: keyof PlanFeatures): Promise<boolean> {
  if (!isSubscriptionsEnabled()) return true

  const plan = await getUserPlan(userId)
  return PLANS[plan].features[feature]
}

export interface UsageInfo {
  plan: Plan
  used: number
  limit: number // -1 = unlimited
  resetDate: string | null
  features: PlanFeatures
  subscriptionsEnabled: boolean
}

/**
 * Returns full usage info for the current user (for display in UI).
 */
export async function getUserUsageInfo(userId: string): Promise<UsageInfo> {
  const subscriptionsEnabled = isSubscriptionsEnabled()

  if (!subscriptionsEnabled) {
    return {
      plan: 'free',
      used: 0,
      limit: -1,
      resetDate: null,
      features: { aiAnalysis: true, studentInsights: true, whatsapp: true },
      subscriptionsEnabled: false,
    }
  }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan, daily_corrections_count, daily_corrections_reset_date')
    .eq('id', userId)
    .single()

  const plan = (profile?.subscription_plan as Plan) ?? 'free'
  const planConfig = PLANS[plan]
  const today = new Date().toISOString().slice(0, 10)
  const isNewDay = profile?.daily_corrections_reset_date !== today
  const used = isNewDay ? 0 : (profile?.daily_corrections_count ?? 0)

  return {
    plan,
    used,
    limit: planConfig.dailyCorrections,
    resetDate: profile?.daily_corrections_reset_date ?? null,
    features: planConfig.features,
    subscriptionsEnabled: true,
  }
}
