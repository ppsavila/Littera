import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createMockSupabaseClient } from '../fixtures/supabase'

// CRITICAL: Mocks must be declared before route imports
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { POST } from '@/app/api/essays/route'

const TODAY = new Date().toISOString().slice(0, 10)
const BASE_URL = 'http://localhost:3000'

const VALID_ESSAY_BODY = JSON.stringify({
  title: 'Redação de teste',
  source_type: 'text',
  theme: 'Tecnologia',
  raw_text: 'Texto da redação de teste com conteúdo suficiente para validação.',
})

describe('POST /api/essays — subscription enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'true')
  })

  it('returns 429 with DAILY_LIMIT_REACHED when free user is at limit', async () => {
    // Free user at limit: count=2, same day
    const userClient = createMockSupabaseClient({
      user: { id: 'user-free-at-limit', email: 'free@test.com' },
      profileData: {
        subscription_plan: 'free',
        daily_corrections_count: 2,
        daily_corrections_reset_date: TODAY,
      },
    })
    const serviceClient = createMockSupabaseClient({ rpcResult: true })

    vi.mocked(createClient).mockResolvedValue(userClient as ReturnType<typeof createMockSupabaseClient>)
    vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createMockSupabaseClient>)

    const req = new NextRequest(`${BASE_URL}/api/essays`, {
      method: 'POST',
      body: VALID_ESSAY_BODY,
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(429)

    const body = await res.json()
    expect(body.code).toBe('DAILY_LIMIT_REACHED')
  })

  it('returns 201 when free user is under the daily limit', async () => {
    // Free user with 0 corrections — under limit.
    // The route calls createClient twice: once in checkAndIncrementDailyLimit (profiles read+update)
    // and once in the route handler itself (essays insert).
    // We build a single client that handles both cases via a custom `from` implementation.
    const { vi: _vi } = await import('vitest')

    const profileData = {
      subscription_plan: 'free',
      daily_corrections_count: 0,
      daily_corrections_reset_date: TODAY,
    }
    const essayInsertResult = { id: 'new-essay-id' }

    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-free-under-limit', email: 'free2@test.com' } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: profileData, error: null }),
          }
        }
        // essays table — support insert().select().single()
        return {
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: essayInsertResult, error: null }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: essayInsertResult, error: null }),
            }),
          }),
        }
      }),
      rpc: vi.fn().mockResolvedValue({ data: true }),
      storage: {
        from: vi.fn().mockReturnValue({
          remove: vi.fn().mockResolvedValue({ error: null }),
        }),
      },
    }

    const serviceClient = createMockSupabaseClient({ rpcResult: true })

    vi.mocked(createClient).mockResolvedValue(mockClient as ReturnType<typeof createMockSupabaseClient>)
    vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createMockSupabaseClient>)

    const req = new NextRequest(`${BASE_URL}/api/essays`, {
      method: 'POST',
      body: VALID_ESSAY_BODY,
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body.id).toBe('new-essay-id')
  })
})
