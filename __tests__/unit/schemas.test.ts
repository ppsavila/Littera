import { describe, it, expect } from 'vitest'
import {
  EssayCreateSchema,
  EssayUpdateSchema,
  ProfileUpdateSchema,
  parseJsonBody,
} from '@/lib/validation/schemas'

describe('EssayCreateSchema', () => {
  it('accepts a minimal valid object', () => {
    const result = EssayCreateSchema.safeParse({ title: 'Test', source_type: 'text' })
    expect(result.success).toBe(true)
  })

  it('accepts a full object with all optional fields', () => {
    const result = EssayCreateSchema.safeParse({
      title: 'Test Essay',
      source_type: 'pdf',
      student_id: '123e4567-e89b-12d3-a456-426614174000',
      storage_path: 'essays/123/file.pdf',
      raw_text: 'Lorem ipsum...',
      theme: 'Tecnologia e Educacao',
      status: 'draft',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty title', () => {
    const result = EssayCreateSchema.safeParse({ title: '', source_type: 'text' })
    expect(result.success).toBe(false)
  })

  it('rejects a title over 500 characters', () => {
    const result = EssayCreateSchema.safeParse({ title: 'a'.repeat(501), source_type: 'text' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid source_type', () => {
    const result = EssayCreateSchema.safeParse({ title: 'Test', source_type: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('rejects student_id that is not a UUID', () => {
    const result = EssayCreateSchema.safeParse({
      title: 'Test',
      source_type: 'text',
      student_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })
})

describe('EssayUpdateSchema', () => {
  it('accepts a partial update with title only', () => {
    const result = EssayUpdateSchema.safeParse({ title: 'New Title' })
    expect(result.success).toBe(true)
  })

  it('accepts a score update within limits', () => {
    const result = EssayUpdateSchema.safeParse({ score_c1: 180 })
    expect(result.success).toBe(true)
  })

  it('rejects an empty object (refine: at least one field required)', () => {
    const result = EssayUpdateSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects score_c1 over 200', () => {
    const result = EssayUpdateSchema.safeParse({ score_c1: 201 })
    expect(result.success).toBe(false)
  })

  it('rejects score_c1 below 0', () => {
    const result = EssayUpdateSchema.safeParse({ score_c1: -1 })
    expect(result.success).toBe(false)
  })
})

describe('ProfileUpdateSchema', () => {
  it('accepts a valid partial update', () => {
    const result = ProfileUpdateSchema.safeParse({ full_name: 'Test Teacher' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty object', () => {
    const result = ProfileUpdateSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('parseJsonBody', () => {
  it('returns { data } for valid JSON', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const result = await parseJsonBody(req)
    expect('data' in result).toBe(true)
    if ('data' in result) {
      expect(result.data).toEqual({ title: 'Test' })
    }
  })

  it('returns { error } for invalid JSON', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: 'not json{{{',
      headers: { 'Content-Type': 'application/json' },
    })
    const result = await parseJsonBody(req)
    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error).toBe('Invalid JSON body')
    }
  })
})
