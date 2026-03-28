import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createMockSupabaseClient } from '../fixtures/supabase'

// CRITICAL: These mocks must be at the top level — before any route imports
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))
vi.mock('@anthropic-ai/sdk', () => ({ default: class MockAnthropic {} }))

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

import { POST as essaysPost } from '@/app/api/essays/route'
import { PATCH as essaysPatch, DELETE as essaysDelete } from '@/app/api/essays/[id]/route'
import { POST as analyzePost } from '@/app/api/essays/[id]/analyze/route'
import { PATCH as profilePatch } from '@/app/api/profile/route'
import { GET as subscriptionGet } from '@/app/api/subscription/route'
import { POST as checkoutPost } from '@/app/api/subscription/checkout/route'
import { POST as cancelPost } from '@/app/api/subscription/cancel/route'
import { POST as activatePost } from '@/app/api/subscription/activate/route'
import { POST as studentAnalysisPost } from '@/app/api/ai/student-analysis/route'
import { POST as whatsappPost } from '@/app/api/whatsapp/send/route'

const BASE_URL = 'http://localhost:3000'

function makeRequest(path: string, method: string = 'GET'): NextRequest {
  return new NextRequest(`${BASE_URL}${path}`, { method })
}

describe('API routes return 401 without authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const nullAuthClient = createMockSupabaseClient({ user: null })
    const serviceClient = createMockSupabaseClient({ rpcResult: true })
    vi.mocked(createClient).mockResolvedValue(nullAuthClient as ReturnType<typeof createMockSupabaseClient>)
    vi.mocked(createServiceClient).mockReturnValue(serviceClient as ReturnType<typeof createMockSupabaseClient>)
  })

  it('POST /api/essays returns 401 when unauthenticated', async () => {
    const req = makeRequest('/api/essays', 'POST')
    const res = await essaysPost(req)
    expect(res.status).toBe(401)
  })

  it('PATCH /api/essays/[id] returns 401 when unauthenticated', async () => {
    const req = makeRequest('/api/essays/test-id', 'PATCH')
    const res = await essaysPatch(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(401)
  })

  it('DELETE /api/essays/[id] returns 401 when unauthenticated', async () => {
    const req = makeRequest('/api/essays/test-id', 'DELETE')
    const res = await essaysDelete(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(401)
  })

  it('POST /api/essays/[id]/analyze returns 401 when unauthenticated', async () => {
    const req = makeRequest('/api/essays/test-id/analyze', 'POST')
    const res = await analyzePost(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(401)
  })

  it('PATCH /api/profile returns 401 when unauthenticated', async () => {
    const req = makeRequest('/api/profile', 'PATCH')
    const res = await profilePatch(req)
    expect(res.status).toBe(401)
  })

  it('GET /api/subscription returns 401 when unauthenticated', async () => {
    const req = makeRequest('/api/subscription', 'GET')
    const res = await subscriptionGet()
    expect(res.status).toBe(401)
  })

  it('POST /api/subscription/checkout returns 401 when unauthenticated', async () => {
    const req = makeRequest('/api/subscription/checkout', 'POST')
    const res = await checkoutPost(req)
    expect(res.status).toBe(401)
  })

  it('POST /api/subscription/cancel returns 401 when unauthenticated', async () => {
    const res = await cancelPost()
    expect(res.status).toBe(401)
  })

  it('POST /api/subscription/activate returns 401 when unauthenticated', async () => {
    const req = makeRequest('/api/subscription/activate', 'POST')
    const res = await activatePost(req)
    expect(res.status).toBe(401)
  })

  it('POST /api/ai/student-analysis returns 401 when unauthenticated', async () => {
    const req = makeRequest('/api/ai/student-analysis', 'POST')
    const res = await studentAnalysisPost(req)
    expect(res.status).toBe(401)
  })

  it('POST /api/whatsapp/send returns 401 when unauthenticated', async () => {
    const req = makeRequest('/api/whatsapp/send', 'POST')
    const res = await whatsappPost(req)
    expect(res.status).toBe(401)
  })
})
