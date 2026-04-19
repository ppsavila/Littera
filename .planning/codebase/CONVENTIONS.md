# Coding Conventions

**Analysis Date:** 2026-03-28

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `AnnotationCanvas.tsx`, `LoginForm.tsx`)
- Utilities/services: camelCase (e.g., `logger.ts`, `analyze-essay.ts`)
- Types: camelCase (e.g., `annotation.ts`, `error-marker.ts`)
- Directories: lowercase with hyphens for multi-word (e.g., `error-marker-layer`, `annotation-sidebar`)

**Functions:**
- Regular functions: camelCase (e.g., `createClient()`, `parseAnalysis()`, `handleSubmit()`)
- React components: PascalCase (e.g., `AnnotationCanvas()`, `ClayButton()`)
- Event handlers: camelCase with `handle` prefix (e.g., `handleTextContinue()`, `handleSubmit()`)
- Custom hooks: camelCase with `use` prefix (e.g., `useAnnotationStore`)

**Variables:**
- Local variables: camelCase (e.g., `fileState`, `pageAnnotations`, `submitting`)
- Constants: UPPERCASE_SNAKE_CASE (e.g., `MAX_HISTORY = 50`, `PAGE_SIZE = 20`, `RATE_LIMIT_WINDOW_MS`)
- Boolean flags: camelCase, often with `is` prefix (e.g., `isDragActive`, `isDrawing`, `showAnnotations`)

**Types:**
- Interfaces: PascalCase with descriptive names (e.g., `AnnotationState`, `FileState`, `ErrorType`)
- Type aliases: PascalCase (e.g., `AnnotationType`, `SourceType`, `EssayStatus`)
- Props interfaces: `[ComponentName]Props` or generic `Props` (e.g., `PricingClientProps`, `interface Props`)

## Code Style

**Formatting:**
- Uses ESLint (Next.js 16 core-web-vitals and TypeScript configs)
- Config: `eslint.config.mjs`
- No Prettier configured; relies on ESLint for linting only
- Indentation: 2 spaces (inferred from codebase)
- Line endings: Unix-style (LF)

**Linting:**
- ESLint configuration: `eslint.config.mjs`
- Active configs: `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`
- Global ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`
- No custom rules added; uses Next.js defaults

## Import Organization

**Order:**
1. React/Next.js imports
2. Third-party libraries (Radix UI, Supabase, Zustand, etc.)
3. Icons/assets (lucide-react, etc.)
4. Internal utilities (`@/lib/...`)
5. Internal components (`@/components/...`)
6. Internal types (`@/types/...`)

**Path Aliases:**
- `@/*` → `./src/*` (configured in `tsconfig.json`)
- Used throughout for absolute imports within src

**Example:**
```typescript
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAnnotationStore } from '@/stores/annotationStore'
import type { Annotation } from '@/types/annotation'
```

## Error Handling

**Patterns:**
- `try-catch` blocks for async operations (18 instances found across codebase)
- Errors thrown as `new Error('message')` with English or Portuguese messages
- Error messages sometimes include i18n context for user-facing UI (Portuguese strings)
- Supabase errors checked via `error` property: `if (error || !data) return ...`
- Graceful degradation for optional features (e.g., error markers defaulting to empty array)

**Example:**
```typescript
try {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  // ... operation
} catch (err) {
  setError(err instanceof Error ? err.message : 'Erro desconhecido')
}
```

**NextResponse patterns:**
```typescript
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
if (!(await checkRateLimit(user.id))) {
  return NextResponse.json(
    { error: 'Limite de análises atingido...' },
    { status: 429 }
  )
}
```

## Logging

**Framework:** Custom logger implemented in `@/lib/logger.ts`

**Method:**
- Structured JSON logging to stdout/stderr
- Supports Sentry integration when `SENTRY_DSN` env var is present

**Functions:**
- `logger.info(message, context?)` - General informational logs
- `logger.warn(message, context?)` - Warnings
- `logger.error(message, error?, context?)` - Errors (automatically sent to Sentry if configured)

**Patterns:**
- Event-style message naming: `logger.info('checkout.started', { userId, plan })`
- Pass Error objects and context for structured data
- Console.error/warn/log used directly in limited cases (UI error handlers, not production logging)

**Example:**
```typescript
logger.error('ai.analyze.failed', err, { essayId: id })
// Output: {"ts":"2026-03-28T...","level":"error","msg":"ai.analyze.failed","essayId":"...","error":{...}}
```

## Comments

**When to Comment:**
- Complex algorithm explanations (e.g., coordinate normalization in `AnnotationCanvas.tsx`)
- Non-obvious business logic (e.g., why graceful error handling is applied)
- Rate limiting and feature flag logic
- Temporary workarounds or known limitations

**JSDoc/TSDoc:**
- Limited use; mainly on public functions
- Example from logger:
  ```typescript
  /**
   * Structured logger for server-side use.
   * Outputs JSON to stdout/stderr...
   */
  ```
- API route endpoints include JSDoc describing method, path, and body

**Inline comments:**
- Used sparingly for clarification (e.g., "Server component - can ignore" in Supabase setup)

## Function Design

**Size:**
- Prefer small functions (most <100 lines)
- Larger components breakdown complex UI (e.g., `UploadWizard.tsx` 408 lines, `PricingClient.tsx` 533 lines)
- Services/utilities kept concise (20-100 lines typical)

**Parameters:**
- Use object destructuring in function signatures: `function Component({ prop1, prop2 }: Props) {}`
- Props interfaces defined above function declarations
- Type annotations required for all parameters

**Return Values:**
- React components implicitly return JSX
- Async handlers return promises
- Supabase calls destructure data/error pairs: `const { data, error } = await query`
- Generator functions yield typed objects with `as const` for type narrowing

## Module Design

**Exports:**
- Named exports preferred for utilities and components
- Default exports for page components (Next.js convention)
- Single component per file (observed pattern)

**Example:**
```typescript
// Components - named export
export function AnnotationCanvas({ essayId, pageNumber, ... }: Props) { ... }

// Pages - default export
export default async function EssayPage({ params }: Props) { ... }

// Utilities - named export
export const useAnnotationStore = create<AnnotationState>(...)
```

**Barrel Files:**
- Not used consistently; components imported directly from their files
- Directories sometimes group related functionality (e.g., `/components/annotation/` contains 5 related components)

## TypeScript Specifics

**Type Definitions:**
- Union types for state values: `type EssayStatus = 'pending' | 'analyzing' | 'analyzed' | ...`
- Discriminated unions for event streams: `{ type: 'chunk', text } | { type: 'done', analysis }`
- `as const` assertions for type narrowing in generators

**Generics:**
- Used in store creation: `create<AnnotationState>(...)`
- React.ReactNode for children props
- Record<> for maps/lookups: `Record<number, Annotation[]>`, `Record<string, string>`

**Type Imports:**
- Always use `import type` for type-only imports
- Example: `import type { Essay } from '@/types/essay'`

## Async Patterns

**Server Components:**
- `async function PageComponent()` with no `'use client'`
- Await all async operations directly
- Use `Promise.all()` for parallel queries

**Client Components:**
- `'use client'` directive at top of file
- useState/useCallback for state management
- Zustand for complex shared state: `const { state, action } = useAnnotationStore()`
- React Query patterns observed in dependencies but not heavily used in client code

**API Routes:**
- `export async function POST/GET(request, { params })`
- Always await params: `const { id } = await params`
- Return `NextResponse.json(data, { status: code })`

## Database Patterns

**Supabase Usage:**
- Client library: `@supabase/ssr` for SSR compatibility
- Server: `createServerClient()` from `@/lib/supabase/server`
- Client: `createBrowserClient()` from `@/lib/supabase/client`
- Query pattern: method chaining with filters
  ```typescript
  const { data, error } = await supabase
    .from('essays')
    .select('*')
    .eq('teacher_id', user.id)
    .single()
  ```

## Component Structure

**Functional Components:**
- All components are functional (no classes)
- Props defined as interface above component: `interface Props { ... }`
- Destructure props in signature when possible

**Custom UI Library:**
- Clay* components in `@/components/ui/` (ClayButton, ClayInput, ClayCard, etc.)
- Built with Radix UI for accessibility
- Styled with Tailwind CSS variables: `--littera-ink`, `--littera-parchment`, `--littera-slate`

**State Management:**
- Zustand stores for cross-component state (`annotationStore`, `scoringStore`, etc.)
- Local useState for component-level state
- Store subscriptions via hooks: `const { state, action } = useStore()`

## Next.js App Router

**File Structure:**
- Route segments in brackets: `(auth)`, `(dashboard)` for layout groups
- Dynamic routes: `[id]` for segment parameters
- Nested layouts with shared ui
- `page.tsx` for route endpoints
- `layout.tsx` for shared wrappers

**RSC (React Server Components):**
- Default: all components are server components
- `'use client'` marks interactive components
- Mix freely: server pages can render client components

---

*Convention analysis: 2026-03-28*
