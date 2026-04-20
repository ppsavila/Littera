import { vi, describe, it, expect, beforeEach } from 'vitest'

// CRITICAL: mocks before route imports
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))
vi.mock('@/lib/subscriptions/access', () => ({ canUseFeature: vi.fn() }))
vi.mock('@/lib/whatsapp/client', () => ({
  validatePhone: vi.fn(),
  sendWhatsAppMessage: vi.fn(),
}))
vi.mock('@/lib/whatsapp/message', () => ({
  buildEssayResultMessage: vi.fn().mockReturnValue('Mensagem formatada de teste'),
}))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseFeature } from '@/lib/subscriptions/access'
import { validatePhone, sendWhatsAppMessage } from '@/lib/whatsapp/client'
import { POST } from '@/app/api/whatsapp/send-result/route'

// ── Typed helpers ────────────────────────────────────────────────────────────

type MockClient = {
  auth: { getUser: ReturnType<typeof vi.fn> }
  from: ReturnType<typeof vi.fn>
}

type MockServiceClient = {
  from: ReturnType<typeof vi.fn>
}

const ESSAY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const USER_ID = 'user-aaa-111'
const STUDENT_ID = 'student-bbb-222'
const PHONE_NORMALIZED = '5511999998888'

function makeAuthClient(opts: {
  userId?: string | null
  essayData?: unknown
  profileData?: unknown
  whatsappSendsData?: unknown
} = {}): MockClient {
  const {
    userId = USER_ID,
    essayData = makeMockEssay(),
    profileData = { cellphone: PHONE_NORMALIZED },
    whatsappSendsData = null,
  } = opts

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId, email: 'teacher@test.com' } : null },
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'essays') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: essayData, error: essayData ? null : { message: 'not found' } }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: profileData, error: null }),
        }
      }
      if (table === 'whatsapp_sends') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: whatsappSendsData, error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    }),
  }
}

function makeServiceClientMock(opts: { insertId?: string; insertError?: boolean } = {}): MockServiceClient {
  const { insertId = 'send-record-001', insertError = false } = opts
  return {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: insertError ? null : { id: insertId },
            error: insertError ? { message: 'insert failed' } : null,
          }),
        }),
      }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    })),
  }
}

function makeMockEssay(overrides: Record<string, unknown> = {}) {
  return {
    id: ESSAY_ID,
    title: 'Redação de Teste',
    theme: 'Tecnologia',
    score_c1: 160,
    score_c2: 140,
    score_c3: 150,
    score_c4: 130,
    score_c5: 120,
    total_score: 700,
    share_token: 'share-tok-abc',
    general_comment: 'Boa redação.',
    student: { id: STUDENT_ID, name: 'Aluno Teste' },
    ...overrides,
  }
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/whatsapp/send-result', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/whatsapp/send-result', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(validatePhone).mockReturnValue({
      valid: true,
      normalized: PHONE_NORMALIZED,
    })
    vi.mocked(sendWhatsAppMessage).mockResolvedValue({
      success: true,
      provider: 'zapi',
      messageId: 'msg-001',
    })
  })

  // ── Authentication ────────────────────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      const client = makeAuthClient({ userId: null })
      vi.mocked(createClient).mockResolvedValue(client as ReturnType<typeof createClient>)

      const req = makeRequest({ essayId: ESSAY_ID })
      const res = await POST(req)

      expect(res.status).toBe(401)
    })
  })

  // ── Premium gate ──────────────────────────────────────────────────────────

  describe('premium gate', () => {
    it('returns 403 with FEATURE_REQUIRES_PREMIUM when user is not Premium', async () => {
      const client = makeAuthClient()
      vi.mocked(createClient).mockResolvedValue(client as ReturnType<typeof createClient>)
      vi.mocked(canUseFeature).mockResolvedValue(false)

      const req = makeRequest({ essayId: ESSAY_ID })
      const res = await POST(req)

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('FEATURE_REQUIRES_PREMIUM')
    })
  })

  // ── Essay ownership ───────────────────────────────────────────────────────

  describe('essay ownership', () => {
    it('returns 404 when essay does not belong to the teacher', async () => {
      // essay not found (RLS filters it out)
      const client = makeAuthClient({ essayData: null })
      vi.mocked(createClient).mockResolvedValue(client as ReturnType<typeof createClient>)
      vi.mocked(canUseFeature).mockResolvedValue(true)

      const req = makeRequest({ essayId: ESSAY_ID })
      const res = await POST(req)

      expect(res.status).toBe(404)
    })

    it('returns 404 when essay id does not exist', async () => {
      const client = makeAuthClient({ essayData: null })
      vi.mocked(createClient).mockResolvedValue(client as ReturnType<typeof createClient>)
      vi.mocked(canUseFeature).mockResolvedValue(true)

      const req = makeRequest({ essayId: 'ffffffff-ffff-ffff-ffff-ffffffffffff' })
      const res = await POST(req)

      expect(res.status).toBe(404)
    })
  })

  // ── Input validation ──────────────────────────────────────────────────────

  describe('input validation', () => {
    it('returns 400 on invalid JSON body', async () => {
      const client = makeAuthClient()
      vi.mocked(createClient).mockResolvedValue(client as ReturnType<typeof createClient>)
      vi.mocked(canUseFeature).mockResolvedValue(true)

      const req = new Request('http://localhost/api/whatsapp/send-result', {
        method: 'POST',
        body: '{bad json{{',
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await POST(req)

      expect(res.status).toBe(400)
    })

    it('returns 400 when essayId is not a valid UUID', async () => {
      const client = makeAuthClient()
      vi.mocked(createClient).mockResolvedValue(client as ReturnType<typeof createClient>)
      vi.mocked(canUseFeature).mockResolvedValue(true)

      const req = makeRequest({ essayId: 'not-a-uuid' })
      const res = await POST(req)

      expect(res.status).toBe(400)
    })
  })

  // ── Student phone ─────────────────────────────────────────────────────────

  describe('student phone', () => {
    it('returns 422 when student has no phone registered', async () => {
      const client = makeAuthClient({ profileData: null })
      vi.mocked(createClient).mockResolvedValue(client as ReturnType<typeof createClient>)
      vi.mocked(canUseFeature).mockResolvedValue(true)

      const req = makeRequest({ essayId: ESSAY_ID })
      const res = await POST(req)

      expect(res.status).toBe(422)
      const body = await res.json()
      expect(body.code).toBe('STUDENT_PHONE_MISSING')
    })

    it('returns 422 when phone format is invalid', async () => {
      const client = makeAuthClient({ profileData: { cellphone: '1199999' } })
      vi.mocked(createClient).mockResolvedValue(client as ReturnType<typeof createClient>)
      vi.mocked(canUseFeature).mockResolvedValue(true)
      vi.mocked(validatePhone).mockReturnValue({
        valid: false,
        normalized: '1199999',
        error: 'Número inválido: esperado 12–13 dígitos, recebido 7.',
      })

      const req = makeRequest({ essayId: ESSAY_ID })
      const res = await POST(req)

      expect(res.status).toBe(422)
      const body = await res.json()
      expect(body.code).toBe('INVALID_PHONE')
    })
  })

  // ── Idempotency ───────────────────────────────────────────────────────────

  describe('idempotency', () => {
    it('returns 429 when message was already sent within 24h', async () => {
      const recentSend = {
        id: 'send-prev-001',
        sent_at: new Date().toISOString(),
      }
      const client = makeAuthClient({ whatsappSendsData: recentSend })
      vi.mocked(createClient).mockResolvedValue(client as ReturnType<typeof createClient>)
      vi.mocked(canUseFeature).mockResolvedValue(true)

      const req = makeRequest({ essayId: ESSAY_ID })
      const res = await POST(req)

      expect(res.status).toBe(429)
      const body = await res.json()
      expect(body.code).toBe('ALREADY_SENT')
    })
  })

  // ── Happy path ────────────────────────────────────────────────────────────

  describe('happy path', () => {
    it('returns 200 with success:true for Premium user with valid essay', async () => {
      const client = makeAuthClient()
      const serviceClient = makeServiceClientMock()
      vi.mocked(createClient).mockResolvedValue(client as ReturnType<typeof createClient>)
      vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createServiceClient>)
      vi.mocked(canUseFeature).mockResolvedValue(true)

      const req = makeRequest({ essayId: ESSAY_ID })
      const res = await POST(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.provider).toBe('zapi')
      expect(body.messageId).toBe('msg-001')
      expect(body.phone).toBe(PHONE_NORMALIZED)
    })

    it('calls sendWhatsAppMessage with the normalized phone', async () => {
      const client = makeAuthClient()
      const serviceClient = makeServiceClientMock()
      vi.mocked(createClient).mockResolvedValue(client as ReturnType<typeof createClient>)
      vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createServiceClient>)
      vi.mocked(canUseFeature).mockResolvedValue(true)

      const req = makeRequest({ essayId: ESSAY_ID })
      await POST(req)

      expect(sendWhatsAppMessage).toHaveBeenCalledWith(PHONE_NORMALIZED, expect.any(String))
    })
  })

  // ── Provider error ────────────────────────────────────────────────────────

  describe('provider error', () => {
    it('returns 502 when WhatsApp provider fails', async () => {
      const client = makeAuthClient()
      const serviceClient = makeServiceClientMock()
      vi.mocked(createClient).mockResolvedValue(client as ReturnType<typeof createClient>)
      vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createServiceClient>)
      vi.mocked(canUseFeature).mockResolvedValue(true)
      vi.mocked(sendWhatsAppMessage).mockResolvedValue({
        success: false,
        provider: 'zapi',
        error: 'Z-API timeout',
      })

      const req = makeRequest({ essayId: ESSAY_ID })
      const res = await POST(req)

      expect(res.status).toBe(502)
      const body = await res.json()
      expect(body.code).toBe('PROVIDER_ERROR')
    })
  })
})
