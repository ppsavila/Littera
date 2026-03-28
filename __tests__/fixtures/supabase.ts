import { vi } from 'vitest'

export const mockUser = { id: 'user-aaa-111', email: 'teacher@test.com' }
export const mockUserB = { id: 'user-bbb-222', email: 'teacherB@test.com' }

export function createMockSupabaseClient(overrides: {
  user?: { id: string; email: string } | null
  profileData?: Record<string, unknown> | null
  essayData?: Record<string, unknown> | null
  rpcResult?: boolean
  selectData?: unknown
  insertData?: unknown
  error?: { message: string } | null
} = {}) {
  const {
    user = null,
    profileData = null,
    essayData = null,
    rpcResult = true,
    selectData,
    insertData,
    error = null,
  } = overrides

  const chainMethods = (resolvedData: unknown = null) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: resolvedData,
      error,
    }),
  })

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn((table: string) => {
      if (selectData !== undefined) return chainMethods(selectData)
      if (insertData !== undefined) {
        const methods = chainMethods(insertData)
        // For insert().select().single() chain
        methods.insert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: insertData, error }),
          }),
        })
        return methods
      }
      return chainMethods(table === 'profiles' ? profileData : essayData)
    }),
    rpc: vi.fn().mockResolvedValue({ data: rpcResult }),
    storage: {
      from: vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  }
}
