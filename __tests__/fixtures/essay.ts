export function createMockEssay(overrides: Partial<{
  id: string
  title: string
  source_type: string
  teacher_id: string
  student_id: string | null
  raw_text: string
  theme: string
  status: string
  storage_path: string | null
  score_c1: number | null
  created_at: string
}> = {}) {
  return {
    id: overrides.id ?? 'essay-001',
    title: overrides.title ?? 'Redacao de Teste',
    source_type: overrides.source_type ?? 'text',
    teacher_id: overrides.teacher_id ?? 'user-aaa-111',
    student_id: overrides.student_id ?? null,
    raw_text: overrides.raw_text ?? 'Texto da redacao de teste para analise.',
    theme: overrides.theme ?? 'Tema generico',
    status: overrides.status ?? 'draft',
    storage_path: overrides.storage_path ?? null,
    score_c1: overrides.score_c1 ?? null,
    created_at: overrides.created_at ?? '2026-03-28T00:00:00Z',
  }
}

export const VALID_ESSAY_CREATE_BODY = {
  title: 'Redacao de Teste',
  source_type: 'text' as const,
  raw_text: 'Texto da redacao de teste.',
}

export const INVALID_ESSAY_CREATE_BODY = {
  title: '', // min 1 char
  source_type: 'invalid_type',
}
