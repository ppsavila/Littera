# Testing Patterns

**Analysis Date:** 2026-03-28

## Test Framework

**Current State:**
- **No test framework configured or in use**
- package.json contains no testing dependencies (Jest, Vitest, Playwright, Cypress, etc.)
- No `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files in the `src/` directory
- ESLint is the primary quality tool (linting only)

**Available in package.json:**
- eslint ^9
- TypeScript ^5 (provides type checking)
- No testing libraries

**Recommendation for Implementation:**
If testing is needed, candidates based on stack:
- **Unit/Integration:** Vitest (faster, Vite-native, matches Node 20+)
- **E2E:** Playwright or Cypress (both work with Next.js 16)
- **Component:** Vitest + React Testing Library or @testing-library/react

## Test File Organization

**Current Setup:**
- Tests not implemented
- No test directory structure exists
- No test configuration files (jest.config.js, vitest.config.ts, etc.)

**Proposed Structure (if implementing):**
```
src/
├── components/
│   └── ui/
│       ├── ClayButton.tsx
│       └── ClayButton.test.tsx          // Co-located tests
├── lib/
│   └── logger.ts
│   └── logger.test.ts                   // Co-located tests
└── app/
    └── api/
        └── essays/
            └── route.ts
            └── route.test.ts            // Co-located tests
```

**Pattern:** Co-locate tests with source files (`.test.ts` suffix) rather than separate `__tests__/` directory.

## Test Structure

**No Current Examples**

**Proposed Pattern (based on codebase conventions):**

For **API route testing:**
```typescript
import { POST } from './route'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

describe('/api/essays/[id]/analyze', () => {
  describe('POST', () => {
    it('should require authentication', async () => {
      // Mock createClient to return user: null
      const req = new NextRequest('http://localhost/api/essays/123/analyze')
      const response = await POST(req, { params: Promise.resolve({ id: '123' }) })
      expect(response.status).toBe(401)
    })

    it('should return 403 if feature not available', async () => {
      // Mock createClient + canUseFeature
      // Mock to return false for aiAnalysis feature
      const response = await POST(req, { params: Promise.resolve({ id: '123' }) })
      expect(response.status).toBe(403)
    })

    it('should stream analysis on success', async () => {
      // Mock everything to succeed
      // Check response headers for text/event-stream
      // Verify SSE format output
    })
  })
})
```

For **Utility function testing:**
```typescript
import { parseAnalysis } from './analyze-essay'
import type { AIAnalysis } from '@/types/essay'

describe('parseAnalysis', () => {
  it('should parse valid JSON', () => {
    const json = JSON.stringify({ competencies: {...} })
    const result = parseAnalysis(json)
    expect(result.competencies).toBeDefined()
    expect(result.analyzed_at).toBeDefined()
  })

  it('should extract JSON from markdown code blocks', () => {
    const markdown = '```json\n' + JSON.stringify({...}) + '\n```'
    expect(() => parseAnalysis(markdown)).not.toThrow()
  })

  it('should throw on invalid JSON', () => {
    expect(() => parseAnalysis('not json')).toThrow('Could not parse AI response as JSON')
  })
})
```

For **Component testing:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { UploadWizard } from './UploadWizard'

describe('UploadWizard', () => {
  it('should render upload step initially', () => {
    render(<UploadWizard />)
    expect(screen.getByText(/Upload/i)).toBeInTheDocument()
  })

  it('should move to metadata step after file selection', async () => {
    render(<UploadWizard />)
    // Mock dropzone drop event
    // Check for metadata form
  })

  it('should show error on failed submission', async () => {
    // Mock createClient.auth.getUser() → null
    // Try to submit
    // Check error message appears
  })
})
```

## Mocking

**Recommended Framework:** Vitest's built-in mocking or `vi.mock()`

**Patterns to Implement:**

**Mocking Supabase (client & server):**
```typescript
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-123', email: 'test@example.com' } },
      }),
    },
    from: vi.fn((table) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockEssay, error: null }),
    })),
  })),
}))
```

**Mocking Zustand store:**
```typescript
import { useAnnotationStore } from '@/stores/annotationStore'
vi.mock('@/stores/annotationStore')

useAnnotationStore.mockReturnValue({
  activeTool: 'highlight',
  activeColor: '#FACC15',
  annotations: { 1: [] },
  addAnnotation: vi.fn(),
  // ... other required properties
})
```

**Mocking Next.js router:**
```typescript
import { useRouter } from 'next/navigation'
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}))
```

**Mocking Anthropic API:**
```typescript
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({...}) }],
      }),
      stream: vi.fn().mockReturnValue({
        // Async iterable yielding events
        [Symbol.asyncIterator]: () => ({...}),
      }),
    },
  })),
}))
```

**What to Mock:**
- External APIs (Supabase, Anthropic, Abacate.pay)
- Next.js navigation and routing
- Global state (Zustand stores)
- Environment variables (use `vi.stubEnv()`)
- Timers for rate-limiting tests

**What NOT to Mock:**
- TypeScript types (never mock)
- Core business logic utilities (test real implementation)
- Logger (test that correct calls are made, not the output format)
- Validation schemas (Zod) — test actual validation

## Fixtures and Factories

**Proposed Location:**
- `__fixtures__/` directory at project root or within test directories
- Or inline factory functions in test files

**Example Factory:**
```typescript
// __fixtures__/essay.ts
export function createMockEssay(overrides?: Partial<Essay>): Essay {
  return {
    id: 'essay-123',
    teacher_id: 'teacher-456',
    student_id: 'student-789',
    title: 'Redação de Teste',
    source_type: 'text',
    storage_path: null,
    raw_text: 'Lorem ipsum dolor sit amet...',
    theme: 'Tema de teste',
    status: 'pending',
    score_c1: null,
    score_c2: null,
    score_c3: null,
    score_c4: null,
    score_c5: null,
    total_score: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// In test
const essay = createMockEssay({ status: 'analyzed', score_c1: 160 })
```

**Example Fixture:**
```typescript
// __fixtures__/ai-analysis.json
{
  "competencies": {
    "c1": { "suggested_score": 160, "feedback": "..." },
    "c2": { "suggested_score": 140, "feedback": "..." },
    ...
  },
  "overall_feedback": "...",
  "model": "claude-sonnet-4-6",
  "analyzed_at": "2026-03-28T..."
}

// In test
import aiAnalysisFixture from '__fixtures__/ai-analysis.json'
```

## Coverage

**Requirements:** Not enforced (no coverage configuration exists)

**Recommendation:**
If implementing tests with Vitest:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
})
```

**View Coverage (when implemented):**
```bash
npm run test -- --coverage
# Opens coverage/index.html
```

## Test Types

**Unit Tests (to implement):**
- Scope: Individual functions and utilities
- Examples:
  - `logger.ts` — test log structure and Sentry integration
  - `analyze-essay.ts` — test JSON parsing, error handling
  - `annotationStore.ts` — test state mutations (add, remove, undo)
  - Validation schemas — test Zod parsing
- Approach: Fast, isolated, mocked dependencies

**Integration Tests (to implement):**
- Scope: Feature flows across multiple modules
- Examples:
  - Upload essay → save to Supabase → fetch back
  - Create annotation → save to DB → appear in store
  - Check rate limit → increment counter → fail on limit
  - Trigger AI analysis → stream response → save to DB
- Approach: Use test database or mock Supabase with realistic sequences

**E2E Tests (optional):**
- Scope: Full user workflows
- Tools: Playwright recommended (Next.js-friendly)
- Examples:
  - Login → upload essay → annotate → export PDF
  - Subscribe to Plus → unlock AI analysis → run analysis
- Approach: Run in browser, test DOM interactions

## Async Testing

**Pattern (for unit tests with async functions):**
```typescript
it('should fetch essay and annotations in parallel', async () => {
  const { getByText } = render(<EssayPage params={...} />)

  // Wait for both queries to complete
  await waitFor(() => {
    expect(getByText(/essay title/i)).toBeInTheDocument()
  })
})
```

**Pattern (for API route testing):**
```typescript
it('should return streaming response', async () => {
  const response = await POST(mockRequest, mockParams)
  expect(response.headers.get('Content-Type')).toBe('text/event-stream')

  const reader = response.body?.getReader()
  const { value } = await reader?.read()
  const text = new TextDecoder().decode(value)
  expect(text).toContain('data: {"type":"chunk"')
})
```

**Pattern (for generator functions):**
```typescript
it('should yield chunks then done event', async () => {
  const events = []
  for await (const event of analyzeEssayStream('text')) {
    events.push(event)
  }
  expect(events[events.length - 1].type).toBe('done')
})
```

## Error Testing

**Pattern (throwing errors):**
```typescript
it('should throw on missing rate limit check', () => {
  expect(() => checkRateLimit('no-user')).rejects.toThrow('Unauthorized')
})
```

**Pattern (error responses):**
```typescript
it('should return 401 when user not authenticated', async () => {
  // Mock getUser() → null
  const response = await POST(mockRequest, mockParams)
  const body = await response.json()

  expect(response.status).toBe(401)
  expect(body.error).toBe('Unauthorized')
})
```

**Pattern (caught errors in UI):**
```typescript
it('should display error message on failed submission', async () => {
  vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
    data: { user: null },
  })

  render(<UploadWizard />)
  fireEvent.click(screen.getByRole('button', { name: /submit/i }))

  await waitFor(() => {
    expect(screen.getByText(/não autenticado/i)).toBeInTheDocument()
  })
})
```

## Current Gaps & Recommendations

**Status:**
- Zero test coverage currently
- Only linting via ESLint

**High-Priority to Test:**
1. `@/lib/ai/analyze-essay.ts` — Critical business logic, JSON parsing, streaming
2. `@/lib/subscriptions/access.ts` — Feature flag logic, tier checking
3. `@/app/api/essays/[id]/analyze/route.ts` — Rate limiting, streaming response
4. `@/stores/annotationStore.ts` — Complex state management with undo
5. `@/components/essay/UploadWizard.tsx` — File handling, validation, UX

**Medium-Priority:**
- API routes for CRUD operations
- Supabase query logic
- Error marker competency mapping

**Low-Priority (work as written, less likely to break):**
- UI components (rendering tests)
- Layout components (routing works)

---

*Testing analysis: 2026-03-28*
