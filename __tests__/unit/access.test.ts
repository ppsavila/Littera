import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '../fixtures/supabase'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import {
  checkAndIncrementDailyLimit,
  canUseFeature,
  getUserPlan,
} from '@/lib/subscriptions/access'

const TODAY = new Date().toISOString().slice(0, 10)
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

function mockProfile(overrides: Record<string, unknown>) {
  const client = createMockSupabaseClient({
    profileData: {
      subscription_plan: 'free',
      daily_corrections_count: 0,
      daily_corrections_reset_date: TODAY,
      ...overrides,
    },
  })
  vi.mocked(createClient).mockResolvedValue(client as ReturnType<typeof createMockSupabaseClient>)
  return client
}

describe('checkAndIncrementDailyLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns allowed:true with limit:-1 when subscriptions disabled', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'false')
    const result = await checkAndIncrementDailyLimit('user-1')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(-1)
  })

  it('blocks free user when count=2 (at limit, same day)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'true')
    mockProfile({
      subscription_plan: 'free',
      daily_corrections_count: 2,
      daily_corrections_reset_date: TODAY,
    })
    const result = await checkAndIncrementDailyLimit('user-1')
    expect(result.allowed).toBe(false)
    expect(result.used).toBe(2)
    expect(result.limit).toBe(2)
  })

  it('allows free user at count=1 (under limit)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'true')
    mockProfile({
      subscription_plan: 'free',
      daily_corrections_count: 1,
      daily_corrections_reset_date: TODAY,
    })
    const result = await checkAndIncrementDailyLimit('user-1')
    expect(result.allowed).toBe(true)
    expect(result.used).toBe(2)
    expect(result.limit).toBe(2)
  })

  it('allows plus user at count=9 (under limit of 10)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'true')
    mockProfile({
      subscription_plan: 'plus',
      daily_corrections_count: 9,
      daily_corrections_reset_date: TODAY,
    })
    const result = await checkAndIncrementDailyLimit('user-1')
    expect(result.allowed).toBe(true)
    expect(result.used).toBe(10)
    expect(result.limit).toBe(10)
  })

  it('blocks plus user at count=10 (at limit)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'true')
    mockProfile({
      subscription_plan: 'plus',
      daily_corrections_count: 10,
      daily_corrections_reset_date: TODAY,
    })
    const result = await checkAndIncrementDailyLimit('user-1')
    expect(result.allowed).toBe(false)
    expect(result.used).toBe(10)
    expect(result.limit).toBe(10)
  })

  it('never blocks premium user (limit=-1, unlimited)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'true')
    mockProfile({
      subscription_plan: 'premium',
      daily_corrections_count: 999,
      daily_corrections_reset_date: TODAY,
    })
    const result = await checkAndIncrementDailyLimit('user-1')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(-1)
  })

  it('resets counter on new day and allows even if previously at limit', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'true')
    // User was at limit (count=2) but yesterday — new day should reset and allow
    mockProfile({
      subscription_plan: 'free',
      daily_corrections_count: 2,
      daily_corrections_reset_date: YESTERDAY,
    })
    const result = await checkAndIncrementDailyLimit('user-1')
    expect(result.allowed).toBe(true)
    expect(result.used).toBe(1)
    expect(result.limit).toBe(2)
  })

  it('returns allowed:false when profile not found', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'true')
    const client = createMockSupabaseClient({ profileData: null })
    vi.mocked(createClient).mockResolvedValue(client as ReturnType<typeof createMockSupabaseClient>)
    const result = await checkAndIncrementDailyLimit('user-nonexistent')
    expect(result.allowed).toBe(false)
    expect(result.limit).toBe(0)
  })
})

describe('canUseFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true for all features when subscriptions disabled', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'false')
    expect(await canUseFeature('user-1', 'aiAnalysis')).toBe(true)
    expect(await canUseFeature('user-1', 'studentInsights')).toBe(true)
    expect(await canUseFeature('user-1', 'whatsapp')).toBe(true)
  })

  it('returns false for free user on aiAnalysis', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'true')
    mockProfile({ subscription_plan: 'free' })
    expect(await canUseFeature('user-1', 'aiAnalysis')).toBe(false)
  })

  it('returns true for plus user on aiAnalysis', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'true')
    mockProfile({ subscription_plan: 'plus' })
    expect(await canUseFeature('user-1', 'aiAnalysis')).toBe(true)
  })

  it('returns true for premium user on all features', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'true')
    mockProfile({ subscription_plan: 'premium' })
    expect(await canUseFeature('user-1', 'aiAnalysis')).toBe(true)
    expect(await canUseFeature('user-1', 'studentInsights')).toBe(true)
    expect(await canUseFeature('user-1', 'whatsapp')).toBe(true)
  })
})
