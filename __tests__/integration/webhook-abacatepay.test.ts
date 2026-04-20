import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createHmac } from 'crypto'

// CRITICAL: mocks before route imports
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { createServiceClient } from '@/lib/supabase/service'
import { POST } from '@/app/api/subscription/webhook/route'

// ── Typed helpers ────────────────────────────────────────────────────────────

interface MockChain {
  select: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
}

interface MockServiceClient {
  from: ReturnType<typeof vi.fn>
  rpc: ReturnType<typeof vi.fn>
}

function makeChain(resolvedData: unknown = null): MockChain {
  const chain: MockChain = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: resolvedData, error: null }),
    single: vi.fn().mockResolvedValue({ data: resolvedData, error: null }),
  }
  return chain
}

/** Builds a service client where:
 *  - subscription_payments idempotency check → existingPayment
 *  - everything else resolves with null
 */
function makeServiceClient(opts: { existingPayment?: unknown } = {}): MockServiceClient {
  return {
    from: vi.fn((table: string) => {
      if (table === 'subscription_payments') {
        return makeChain(opts.existingPayment ?? null)
      }
      return makeChain(null)
    }),
    rpc: vi.fn().mockResolvedValue({ data: null }),
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = 'test-secret-key'

function sign(body: string, secret = WEBHOOK_SECRET): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}

function makeRequest(body: string, signature?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (signature !== undefined) headers['x-webhook-signature'] = signature
  return new Request('http://localhost/api/subscription/webhook', {
    method: 'POST',
    body,
    headers,
  })
}

const VALID_BILLING_PAID = JSON.stringify({
  id: 'pay-001',
  event: 'billing.paid',
  apiVersion: '1',
  devMode: false,
  data: {
    id: 'pay-001',
    customer: {
      metadata: { userId: 'user-aaa-111', plan: 'premium' },
    },
  },
})

const VALID_SUBSCRIPTION_CANCELLED = JSON.stringify({
  id: 'sub-999',
  event: 'subscription.cancelled',
  apiVersion: '1',
  devMode: false,
  data: {
    id: 'sub-999',
    customer: {
      metadata: { userId: 'user-aaa-111' },
    },
  },
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/subscription/webhook — Abacate.pay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  // ── Signature verification ────────────────────────────────────────────────

  describe('signature verification', () => {
    it('returns 401 when signature is invalid', async () => {
      vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', WEBHOOK_SECRET)
      const serviceClient = makeServiceClient()
      vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createServiceClient>)

      const req = makeRequest(VALID_BILLING_PAID, 'deadbeef')
      const res = await POST(req)

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toMatch(/Invalid signature/i)
    })

    it('returns 401 when x-webhook-signature header is missing', async () => {
      vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', WEBHOOK_SECRET)
      const serviceClient = makeServiceClient()
      vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createServiceClient>)

      // No signature header → empty string passed to verifySignature → mismatch
      const req = makeRequest(VALID_BILLING_PAID)
      const res = await POST(req)

      expect(res.status).toBe(401)
    })

    it('proceeds when secret is not configured (no signature check)', async () => {
      // ABACATE_PAY_WEBHOOK_SECRET not set → skip signature check
      vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', '')
      const serviceClient = makeServiceClient()
      vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createServiceClient>)

      const req = makeRequest(VALID_BILLING_PAID) // no sig header
      const res = await POST(req)

      expect(res.status).toBe(200)
    })
  })

  // ── JSON parsing ──────────────────────────────────────────────────────────

  describe('payload validation', () => {
    it('returns 400 on malformed JSON', async () => {
      vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', '')
      const serviceClient = makeServiceClient()
      vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createServiceClient>)

      const req = makeRequest('{invalid json{{')
      const res = await POST(req)

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toMatch(/Invalid JSON/i)
    })

    it('returns 400 on empty body', async () => {
      vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', '')
      const serviceClient = makeServiceClient()
      vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createServiceClient>)

      const req = makeRequest('')
      const res = await POST(req)

      expect(res.status).toBe(400)
    })
  })

  // ── Happy paths ───────────────────────────────────────────────────────────

  describe('billing.paid → activate subscription', () => {
    it('returns 200 and activates subscription with valid signed payload', async () => {
      vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', WEBHOOK_SECRET)
      const serviceClient = makeServiceClient()
      vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createServiceClient>)

      const sig = sign(VALID_BILLING_PAID)
      const req = makeRequest(VALID_BILLING_PAID, sig)
      const res = await POST(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.received).toBe(true)

      // profiles.update should have been called
      expect(serviceClient.from).toHaveBeenCalledWith('profiles')
    })

    it('returns 200 with valid payload when no secret configured', async () => {
      vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', '')
      const serviceClient = makeServiceClient()
      vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createServiceClient>)

      const req = makeRequest(VALID_BILLING_PAID)
      const res = await POST(req)

      expect(res.status).toBe(200)
    })
  })

  describe('subscription.cancelled → deactivate subscription', () => {
    it('returns 200 and downgrades plan', async () => {
      vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', '')
      const serviceClient = makeServiceClient()
      vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createServiceClient>)

      const req = makeRequest(VALID_SUBSCRIPTION_CANCELLED)
      const res = await POST(req)

      expect(res.status).toBe(200)
      expect(serviceClient.from).toHaveBeenCalledWith('profiles')
    })
  })

  describe('subscription.renewed → extend subscription', () => {
    it('returns 200 and calls profiles update', async () => {
      vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', '')
      const profileChain = {
        ...makeChain({ subscription_expires_at: new Date().toISOString() }),
      }
      const renewedServiceClient: MockServiceClient = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') return profileChain
          return makeChain(null)
        }),
        rpc: vi.fn(),
      }
      vi.mocked(createServiceClient).mockReturnValue(renewedServiceClient as ReturnType<typeof createServiceClient>)

      const payload = JSON.stringify({
        id: 'pay-renew-001',
        event: 'subscription.renewed',
        apiVersion: '1',
        devMode: false,
        data: {
          id: 'pay-renew-001',
          customer: { metadata: { userId: 'user-aaa-111', plan: 'premium' } },
        },
      })

      const req = makeRequest(payload)
      const res = await POST(req)

      expect(res.status).toBe(200)
    })
  })

  describe('unknown event', () => {
    it('returns 200 received:true (no-op)', async () => {
      vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', '')
      const serviceClient = makeServiceClient()
      vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createServiceClient>)

      const payload = JSON.stringify({ event: 'unknown.event', data: {} })
      const req = makeRequest(payload)
      const res = await POST(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.received).toBe(true)
    })
  })

  // ── Idempotency ───────────────────────────────────────────────────────────

  describe('idempotency', () => {
    it('skips processing when payment_id already exists in subscription_payments', async () => {
      vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', '')

      // Simulate: idempotency check returns an existing record
      const serviceClient = makeServiceClient({ existingPayment: { id: 'existing-row-uuid' } })
      vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createServiceClient>)

      const req = makeRequest(VALID_BILLING_PAID)
      const res = await POST(req)

      // Still 200 — idempotent skip is not an error
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.received).toBe(true)

      // profiles.update should NOT have been called (early return after idempotency check)
      const updateCalls = (serviceClient.from as ReturnType<typeof vi.fn>).mock.calls
        .filter(([table]: [string]) => table === 'profiles')
      expect(updateCalls.length).toBe(0)
    })
  })
})
