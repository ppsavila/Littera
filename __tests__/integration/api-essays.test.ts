import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))
vi.mock('@/lib/ai/analyze-essay', () => ({ analyzeEssayStream: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { analyzeEssayStream } from '@/lib/ai/analyze-essay'
import { POST } from '@/app/api/essays/route'
import { PATCH, DELETE } from '@/app/api/essays/[id]/route'
import { POST as analyzeHandler } from '@/app/api/essays/[id]/analyze/route'
import { createMockSupabaseClient, mockUser } from '../fixtures/supabase'
import { VALID_ESSAY_CREATE_BODY, createMockEssay } from '../fixtures/essay'

const ESSAY_ID = 'essay-001'
const essayParams = { params: Promise.resolve({ id: ESSAY_ID }) }

function makeJsonRequest(body: unknown, url = 'http://localhost/api/essays') {
  return new Request(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeInvalidJsonRequest(url = 'http://localhost/api/essays') {
  return new Request(url, {
    method: 'POST',
    body: 'not json{{{',
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/essays', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'false')
  })

  it('returns 201 with essay id on valid input', async () => {
    const mockClient = createMockSupabaseClient({ user: mockUser, insertData: { id: 'new-id' } })
    vi.mocked(createClient).mockResolvedValue(mockClient as any)
    vi.mocked(createServiceClient).mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: true }) } as any)

    const res = await POST(makeJsonRequest(VALID_ESSAY_CREATE_BODY))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.id).toBe('new-id')
  })

  it('returns 400 on invalid source_type', async () => {
    const mockClient = createMockSupabaseClient({ user: mockUser })
    vi.mocked(createClient).mockResolvedValue(mockClient as any)
    vi.mocked(createServiceClient).mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: true }) } as any)

    const res = await POST(makeJsonRequest({ title: 'Test', source_type: 'invalid' }))

    expect(res.status).toBe(400)
  })

  it('returns 400 on invalid JSON body', async () => {
    const mockClient = createMockSupabaseClient({ user: mockUser })
    vi.mocked(createClient).mockResolvedValue(mockClient as any)
    vi.mocked(createServiceClient).mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: true }) } as any)

    const res = await POST(makeInvalidJsonRequest())

    expect(res.status).toBe(400)
  })

  it('returns 429 when rate limit is exceeded', async () => {
    const mockClient = createMockSupabaseClient({ user: mockUser })
    vi.mocked(createClient).mockResolvedValue(mockClient as any)
    vi.mocked(createServiceClient).mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: false }) } as any)

    const res = await POST(makeJsonRequest(VALID_ESSAY_CREATE_BODY))

    expect(res.status).toBe(429)
  })
})

describe('PATCH /api/essays/[id]', () => {
  it('returns 200 with updated data on valid partial update', async () => {
    const updatedEssay = createMockEssay({ id: ESSAY_ID, title: 'Updated Title' })
    const mockClient = createMockSupabaseClient({ user: mockUser, selectData: updatedEssay })
    vi.mocked(createClient).mockResolvedValue(mockClient as any)

    const req = new Request(`http://localhost/api/essays/${ESSAY_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, essayParams)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.title).toBe('Updated Title')
  })

  it('returns 400 on empty update body', async () => {
    const mockClient = createMockSupabaseClient({ user: mockUser })
    vi.mocked(createClient).mockResolvedValue(mockClient as any)

    const req = new Request(`http://localhost/api/essays/${ESSAY_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, essayParams)

    expect(res.status).toBe(400)
  })

  it('returns 400 when score_c1 exceeds maximum', async () => {
    const mockClient = createMockSupabaseClient({ user: mockUser })
    vi.mocked(createClient).mockResolvedValue(mockClient as any)

    const req = new Request(`http://localhost/api/essays/${ESSAY_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({ score_c1: 201 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, essayParams)

    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/essays/[id]', () => {
  it('returns 200 with success:true', async () => {
    const essay = createMockEssay({ id: ESSAY_ID, storage_path: null })
    const mockClient = createMockSupabaseClient({ user: mockUser, selectData: essay })
    vi.mocked(createClient).mockResolvedValue(mockClient as any)

    const req = new Request(`http://localhost/api/essays/${ESSAY_ID}`, { method: 'DELETE' })
    const res = await DELETE(req, essayParams)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('calls storage.remove when essay has storage_path', async () => {
    const essay = createMockEssay({ id: ESSAY_ID, storage_path: 'essays/test.pdf' })
    const removeSpy = vi.fn().mockResolvedValue({ error: null })
    const mockClient = createMockSupabaseClient({ user: mockUser, selectData: essay })
    vi.mocked(mockClient.storage.from).mockReturnValue({ remove: removeSpy } as any)
    vi.mocked(createClient).mockResolvedValue(mockClient as any)

    const req = new Request(`http://localhost/api/essays/${ESSAY_ID}`, { method: 'DELETE' })
    await DELETE(req, essayParams)

    expect(removeSpy).toHaveBeenCalledWith(['essays/test.pdf'])
  })

  it('does not call storage.remove when essay has no storage_path', async () => {
    const essay = createMockEssay({ id: ESSAY_ID, storage_path: null })
    const removeSpy = vi.fn().mockResolvedValue({ error: null })
    const mockClient = createMockSupabaseClient({ user: mockUser, selectData: essay })
    vi.mocked(mockClient.storage.from).mockReturnValue({ remove: removeSpy } as any)
    vi.mocked(createClient).mockResolvedValue(mockClient as any)

    const req = new Request(`http://localhost/api/essays/${ESSAY_ID}`, { method: 'DELETE' })
    await DELETE(req, essayParams)

    expect(removeSpy).not.toHaveBeenCalled()
  })
})

describe('POST /api/essays/[id]/analyze', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED', 'false')
  })

  it('returns streaming response (not 401 or 500) for authenticated user', async () => {
    const essay = createMockEssay({ id: ESSAY_ID })
    const mockClient = createMockSupabaseClient({ user: mockUser, selectData: essay })
    vi.mocked(createClient).mockResolvedValue(mockClient as any)
    vi.mocked(createServiceClient).mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: true }) } as any)

    async function* emptyStream() {}
    vi.mocked(analyzeEssayStream).mockReturnValue(emptyStream() as any)

    const req = new Request(`http://localhost/api/essays/${ESSAY_ID}/analyze`, { method: 'POST' })
    const res = await analyzeHandler(req, essayParams)

    expect(res.status).not.toBe(401)
    expect(res.status).not.toBe(500)
  })
})
