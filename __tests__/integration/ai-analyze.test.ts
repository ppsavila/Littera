import { vi, describe, it, expect, beforeEach } from 'vitest'

// CRITICAL: mocks before route imports
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))
vi.mock('@/lib/subscriptions/access', () => ({ canUseFeature: vi.fn() }))
vi.mock('@/lib/ai/analyze-essay', () => ({ analyzeEssayStream: vi.fn() }))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseFeature } from '@/lib/subscriptions/access'
import { analyzeEssayStream } from '@/lib/ai/analyze-essay'
import { POST as analyzeHandler } from '@/app/api/essays/[id]/analyze/route'
import { createMockSupabaseClient, mockUser } from '../fixtures/supabase'
import { createMockEssay } from '../fixtures/essay'

// ── Type helpers (same pattern as api-essays.test.ts) ────────────────────────

type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>
type RealServerClient = Awaited<ReturnType<typeof createClient>>
type RealServiceClient = ReturnType<typeof createServiceClient>

interface MockServiceClient {
  rpc: ReturnType<typeof vi.fn>
}

function asServerClient(mock: MockSupabaseClient): RealServerClient {
  return mock as unknown as RealServerClient
}

function asServiceClient(mock: MockServiceClient): RealServiceClient {
  return mock as unknown as RealServiceClient
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const ESSAY_ID = 'essay-ai-001'
const essayParams = { params: Promise.resolve({ id: ESSAY_ID }) }

const mockEssay = createMockEssay({ id: ESSAY_ID, status: 'draft' })
const mockEssayAlreadyAnalyzed = createMockEssay({ id: ESSAY_ID, status: 'analyzed' })

/** Minimal async generator that yields one chunk then done. */
async function* makeStream(
  analysis = {
    competencies: {
      c1: { suggested_score: 160, feedback: '' },
      c2: { suggested_score: 140, feedback: '' },
      c3: { suggested_score: 150, feedback: '' },
      c4: { suggested_score: 130, feedback: '' },
      c5: { suggested_score: 120, feedback: '' },
    },
    overall_feedback: 'Boa redação.',
    model: 'claude-sonnet-4-6',
    analyzed_at: '2026-04-19T00:00:00Z',
  }
): ReturnType<typeof analyzeEssayStream> {
  yield { type: 'chunk', text: 'chunk-text' }
  yield { type: 'done', analysis }
}

/** Stream that yields an error event. */
async function* makeErrorStream(): ReturnType<typeof analyzeEssayStream> {
  yield { type: 'error', message: 'Anthropic API unavailable' }
}

/** Stream that throws an exception (simulates SDK crash). */
async function* makeThrowingStream(): ReturnType<typeof analyzeEssayStream> {
  throw new Error('Anthropic API 500 Internal Server Error')
  yield { type: 'chunk', text: '' } // unreachable — keeps TS happy
}

function makeRequest(essayId = ESSAY_ID) {
  return new Request(`http://localhost/api/essays/${essayId}/analyze`, {
    method: 'POST',
  })
}

// ── Helper to drain SSE stream into events ────────────────────────────────────

async function drainStream(res: Response): Promise<Array<{ type: string; [key: string]: unknown }>> {
  const text = await res.text()
  return text
    .split('\n\n')
    .filter((chunk) => chunk.startsWith('data: '))
    .map((chunk) => JSON.parse(chunk.replace(/^data: /, '')))
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/essays/[id]/analyze — AI analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'true')
  })

  // ── Authentication ────────────────────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      const mockClient = createMockSupabaseClient({ user: null })
      vi.mocked(createClient).mockResolvedValue(asServerClient(mockClient))

      const res = await analyzeHandler(makeRequest(), essayParams)

      expect(res.status).toBe(401)
    })
  })

  // ── Feature gate ──────────────────────────────────────────────────────────

  describe('feature gate', () => {
    it('returns 403 with FEATURE_REQUIRES_PLUS for free-plan user', async () => {
      const mockClient = createMockSupabaseClient({ user: mockUser })
      vi.mocked(createClient).mockResolvedValue(asServerClient(mockClient))
      vi.mocked(canUseFeature).mockResolvedValue(false)

      const res = await analyzeHandler(makeRequest(), essayParams)

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('FEATURE_REQUIRES_PLUS')
    })
  })

  // ── Rate limit ────────────────────────────────────────────────────────────

  describe('rate limit', () => {
    it('returns 429 when rate limit is exceeded', async () => {
      const mockClient = createMockSupabaseClient({ user: mockUser })
      // checkRateLimit calls createServiceClient().rpc('check_ai_rate_limit')
      const serviceClientBlocked = asServiceClient({ rpc: vi.fn().mockResolvedValue({ data: false }) })

      vi.mocked(createClient).mockResolvedValue(asServerClient(mockClient))
      vi.mocked(createServiceClient).mockReturnValue(serviceClientBlocked)
      vi.mocked(canUseFeature).mockResolvedValue(true)

      const res = await analyzeHandler(makeRequest(), essayParams)

      expect(res.status).toBe(429)
      const body = await res.json()
      expect(body.error).toMatch(/Limite de análises/i)
    })

    it('proceeds when rate limit RPC returns true (allowed)', async () => {
      const mockClient = createMockSupabaseClient({ user: mockUser, selectData: mockEssay })
      const serviceClientAllowed = asServiceClient({ rpc: vi.fn().mockResolvedValue({ data: true }) })

      vi.mocked(createClient).mockResolvedValue(asServerClient(mockClient))
      vi.mocked(createServiceClient).mockReturnValue(serviceClientAllowed)
      vi.mocked(canUseFeature).mockResolvedValue(true)
      vi.mocked(analyzeEssayStream).mockReturnValue(makeStream())

      const res = await analyzeHandler(makeRequest(), essayParams)

      // Should proceed past rate limit to streaming response
      expect(res.status).not.toBe(429)
      expect(res.status).not.toBe(401)
    })
  })

  // ── Essay not found ───────────────────────────────────────────────────────

  describe('essay not found', () => {
    it('returns 404 when essay does not exist or does not belong to teacher', async () => {
      const mockClient = createMockSupabaseClient({ user: mockUser, selectData: null, error: { message: 'Not found' } })
      const serviceClientAllowed = asServiceClient({ rpc: vi.fn().mockResolvedValue({ data: true }) })

      vi.mocked(createClient).mockResolvedValue(asServerClient(mockClient))
      vi.mocked(createServiceClient).mockReturnValue(serviceClientAllowed)
      vi.mocked(canUseFeature).mockResolvedValue(true)

      const res = await analyzeHandler(makeRequest(), essayParams)

      expect(res.status).toBe(404)
    })
  })

  // ── Happy path ────────────────────────────────────────────────────────────

  describe('happy path', () => {
    it('returns a streaming SSE response (200) with chunk and done events', async () => {
      const mockClient = createMockSupabaseClient({ user: mockUser, selectData: mockEssay })
      const serviceClientAllowed = asServiceClient({ rpc: vi.fn().mockResolvedValue({ data: true }) })

      vi.mocked(createClient).mockResolvedValue(asServerClient(mockClient))
      vi.mocked(createServiceClient).mockReturnValue(serviceClientAllowed)
      vi.mocked(canUseFeature).mockResolvedValue(true)
      vi.mocked(analyzeEssayStream).mockReturnValue(makeStream())

      const res = await analyzeHandler(makeRequest(), essayParams)

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('text/event-stream')

      const events = await drainStream(res)
      expect(events.some((e) => e.type === 'chunk')).toBe(true)
      expect(events.some((e) => e.type === 'done')).toBe(true)
    })

    it('calls analyzeEssayStream with the essay raw_text', async () => {
      const essay = createMockEssay({ id: ESSAY_ID, raw_text: 'Texto da redação de teste.' })
      const mockClient = createMockSupabaseClient({ user: mockUser, selectData: essay })
      const serviceClientAllowed = asServiceClient({ rpc: vi.fn().mockResolvedValue({ data: true }) })

      vi.mocked(createClient).mockResolvedValue(asServerClient(mockClient))
      vi.mocked(createServiceClient).mockReturnValue(serviceClientAllowed)
      vi.mocked(canUseFeature).mockResolvedValue(true)
      vi.mocked(analyzeEssayStream).mockReturnValue(makeStream())

      await analyzeHandler(makeRequest(), essayParams)

      expect(analyzeEssayStream).toHaveBeenCalledWith(
        'Texto da redação de teste.',
        expect.anything(), // theme (string or undefined)
        undefined,         // errorContext — no error markers in mock
      )
    })
  })

  // ── Already analyzed (idempotency) ───────────────────────────────────────

  describe('already analyzed essay', () => {
    it('still streams response when essay status is already "analyzed" (idempotent re-run)', async () => {
      // The route does not block re-analysis — it just re-runs. This is intentional:
      // the teacher may want to re-analyze after editing error markers.
      const mockClient = createMockSupabaseClient({ user: mockUser, selectData: mockEssayAlreadyAnalyzed })
      const serviceClientAllowed = asServiceClient({ rpc: vi.fn().mockResolvedValue({ data: true }) })

      vi.mocked(createClient).mockResolvedValue(asServerClient(mockClient))
      vi.mocked(createServiceClient).mockReturnValue(serviceClientAllowed)
      vi.mocked(canUseFeature).mockResolvedValue(true)
      vi.mocked(analyzeEssayStream).mockReturnValue(makeStream())

      const res = await analyzeHandler(makeRequest(), essayParams)

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('text/event-stream')
    })
  })

  // ── Anthropic API errors ──────────────────────────────────────────────────

  describe('Anthropic API errors', () => {
    it('streams an error event when analyzeEssayStream yields { type: "error" }', async () => {
      const mockClient = createMockSupabaseClient({ user: mockUser, selectData: mockEssay })
      const serviceClientAllowed = asServiceClient({ rpc: vi.fn().mockResolvedValue({ data: true }) })

      vi.mocked(createClient).mockResolvedValue(asServerClient(mockClient))
      vi.mocked(createServiceClient).mockReturnValue(serviceClientAllowed)
      vi.mocked(canUseFeature).mockResolvedValue(true)
      vi.mocked(analyzeEssayStream).mockReturnValue(makeErrorStream())

      const res = await analyzeHandler(makeRequest(), essayParams)

      expect(res.status).toBe(200) // Stream itself opens successfully
      const events = await drainStream(res)
      const errorEvent = events.find((e) => e.type === 'error')
      expect(errorEvent).toBeDefined()
      expect(errorEvent?.message).toContain('Anthropic API unavailable')
    })

    it('streams a generic error event when analyzeEssayStream throws', async () => {
      const mockClient = createMockSupabaseClient({ user: mockUser, selectData: mockEssay })
      const serviceClientAllowed = asServiceClient({ rpc: vi.fn().mockResolvedValue({ data: true }) })

      vi.mocked(createClient).mockResolvedValue(asServerClient(mockClient))
      vi.mocked(createServiceClient).mockReturnValue(serviceClientAllowed)
      vi.mocked(canUseFeature).mockResolvedValue(true)
      vi.mocked(analyzeEssayStream).mockReturnValue(makeThrowingStream())

      const res = await analyzeHandler(makeRequest(), essayParams)

      expect(res.status).toBe(200)
      const events = await drainStream(res)
      const errorEvent = events.find((e) => e.type === 'error')
      expect(errorEvent).toBeDefined()
      expect(typeof errorEvent?.message).toBe('string')
    })
  })
})

// ── check_and_increment_daily_limit RPC mock behaviour ───────────────────────

describe('check_and_increment_daily_limit RPC — mock contract', () => {
  /**
   * These tests verify that our mock correctly simulates the RPC contract:
   *   { allowed: true }  → user may proceed
   *   { allowed: false } → user is at limit
   *
   * The actual SQL function is tested in Supabase migrations (LIT-006).
   * Here we confirm the route reacts correctly to each mock return value.
   */

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'true')
  })

  it('allows analysis when RPC returns { data: true }', async () => {
    const mockClient = createMockSupabaseClient({ user: mockUser, selectData: mockEssay })
    const allowedService = asServiceClient({ rpc: vi.fn().mockResolvedValue({ data: true }) })

    vi.mocked(createClient).mockResolvedValue(asServerClient(mockClient))
    vi.mocked(createServiceClient).mockReturnValue(allowedService)
    vi.mocked(canUseFeature).mockResolvedValue(true)
    vi.mocked(analyzeEssayStream).mockReturnValue(makeStream())

    const res = await analyzeHandler(makeRequest(), essayParams)

    expect(res.status).not.toBe(429)
    expect(allowedService.rpc).toHaveBeenCalledWith('check_ai_rate_limit', expect.objectContaining({
      p_user_id: mockUser.id,
    }))
  })

  it('blocks analysis when RPC returns { data: false }', async () => {
    const mockClient = createMockSupabaseClient({ user: mockUser })
    const blockedService = asServiceClient({ rpc: vi.fn().mockResolvedValue({ data: false }) })

    vi.mocked(createClient).mockResolvedValue(asServerClient(mockClient))
    vi.mocked(createServiceClient).mockReturnValue(blockedService)
    vi.mocked(canUseFeature).mockResolvedValue(true)

    const res = await analyzeHandler(makeRequest(), essayParams)

    expect(res.status).toBe(429)
    expect(blockedService.rpc).toHaveBeenCalledWith('check_ai_rate_limit', expect.objectContaining({
      p_user_id: mockUser.id,
      p_max: expect.any(Number),
      p_window_ms: expect.any(Number),
    }))
  })
})
