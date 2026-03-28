# Codebase Structure

**Analysis Date:** 2026-03-28

## Directory Layout

```
Littera/
├── src/
│   ├── app/                    # Next.js App Router pages, layouts, API routes
│   ├── components/             # Reusable React components (organized by feature)
│   ├── lib/                    # Utilities, services, business logic
│   ├── stores/                 # Zustand state management
│   ├── types/                  # TypeScript type definitions
│   ├── instrumentation.ts      # Sentry configuration
│   ├── proxy.ts                # Utility (purpose: TBD in codebase)
│   └── globals.css             # Global Tailwind styles
├── public/                     # Static assets (images, fonts, etc.)
├── supabase/                   # Supabase config (migrations, seed, types)
├── scripts/                    # Utility scripts (build, deploy, etc.)
├── .planning/                  # GSD planning artifacts (this file)
├── .docs/                      # Project documentation
├── .github/                    # GitHub workflows, issue templates
├── package.json                # Node.js dependencies
├── tsconfig.json               # TypeScript configuration
├── next.config.ts              # Next.js configuration
├── eslint.config.mjs           # ESLint rules
└── [Config files]              # .env, .env.local (secrets — not in repo)
```

## Directory Purposes

**src/app:**
- Purpose: Next.js App Router — pages, layouts, route handlers (API)
- Contains: `.tsx` page components, `layout.tsx` files, `route.ts` API handlers, `loading.tsx` skeletons
- Key structure:
  - `app/` → Root layout, landing page
  - `app/(auth)/` → Auth group: login page, callback handler
  - `app/(dashboard)/` → Protected group: essays, pricing, profile, students pages
  - `app/api/` → API route handlers for essays, subscriptions, webhooks, AI analysis

**src/components:**
- Purpose: Reusable React components organized by feature/domain
- Contains: Functional components, client components (`'use client'`), UI primitives
- Subdirectories:
  - `annotation/` → Canvas drawing, toolbars, comment popovers
  - `essay/` → Document rendering (PDF/image/text), workspace, upload wizard
  - `scoring/` → Competency cards, score gauges, panels
  - `layout/` → Header, sidebar, providers, bottom nav
  - `auth/` → Login form
  - `subscription/` → Plan badges, upgrade modals, usage indicators
  - `profile/` → Profile form component
  - `students/` → Student list, insights
  - `onboarding/` → Tour/tutorial components
  - `ui/` → Generic UI primitives (badges, buttons via Tailwind + Radix)

**src/lib:**
- Purpose: Non-React utilities, services, business logic
- Contains: Modules for AI, Supabase, subscriptions, logging
- Key files:
  - `ai/analyze-essay.ts` — Claude API calls (streaming + non-streaming)
  - `ai/prompts.ts` — System/user prompt builders
  - `ai/refs/rubrics.ts` — ENEM rubric reference data
  - `supabase/client.ts` — Browser Supabase instance
  - `supabase/server.ts` — Server Supabase instance with cookies
  - `supabase/service.ts` — Privileged Supabase operations (service role key)
  - `subscriptions/access.ts` — Feature gating, daily limits
  - `subscriptions/plans.ts` — Plan tier definitions (free/plus/premium)
  - `subscriptions/flags.ts` — Feature flags (enable/disable subscriptions)
  - `logger.ts` — Structured logging utility
  - `utils.ts` — General helpers

**src/stores:**
- Purpose: Zustand client-side state management
- Contains: Zustand store definitions with actions
- Files:
  - `annotationStore.ts` — Annotations per page, undo history, tool state
  - `errorMarkerStore.ts` — Error markers per essay competency
  - `scoringStore.ts` — C1-C5 scores, feedback notes, general comment
  - `viewerStore.ts` — Document viewer state (zoom, page number, etc.)

**src/types:**
- Purpose: TypeScript type definitions (single source of truth)
- Contains: Interface exports, constants
- Files:
  - `essay.ts` — Essay, Student, AIAnalysis, COMPETENCIES constant
  - `annotation.ts` — Annotation, AnnotationTool types
  - `error-marker.ts` — ErrorMarker, ERROR_TYPES_BY_COMPETENCY

**public:**
- Purpose: Static assets served directly
- Contains: Images, icons, favicon, etc.

**supabase:**
- Purpose: Database schema, migrations, type generation
- Contains: SQL migrations, seed scripts, PostgREST client types

**scripts:**
- Purpose: Development/build automation
- Contains: Bash/Node scripts for linting, building, etc.

## Key File Locations

**Entry Points:**
- `src/app/page.tsx` — Landing page (public)
- `src/app/layout.tsx` — Root layout (fonts, Providers wrapper)
- `src/app/(auth)/login/page.tsx` — Login page
- `src/app/(dashboard)/layout.tsx` — Protected dashboard layout (auth guard)
- `src/app/(dashboard)/essays/page.tsx` — Essay list
- `src/app/(dashboard)/essays/[id]/page.tsx` — Single essay correction workspace

**Configuration:**
- `tsconfig.json` — Path aliases (`@/*` → `./src/*`), strict mode, Next.js plugin
- `next.config.ts` — Image optimization, webpack config (if any)
- `eslint.config.mjs` — Next.js ESLint config

**Core Logic:**
- `src/lib/ai/analyze-essay.ts` — AI analysis (streaming + non-streaming functions)
- `src/lib/supabase/server.ts` — Server Supabase client factory
- `src/lib/subscriptions/access.ts` — Feature gates, daily limits
- `src/stores/annotationStore.ts` — Annotation state with undo history

**Testing:**
- Test files colocated with source (convention: `.test.ts`, `.spec.ts`) or in `tests/` directory
- Jest or Vitest config: Check `package.json` scripts + root config files

## Naming Conventions

**Files:**
- Pages: `page.tsx`
- Layouts: `layout.tsx`
- API routes: `route.ts`
- Loading skeletons: `loading.tsx`
- Components: PascalCase, e.g., `EssayCard.tsx`, `AnnotationCanvas.tsx`
- Utilities/services: camelCase, e.g., `analyze-essay.ts`, `annotation-store.ts`
- Types/constants: camelCase files, e.g., `essay.ts`, `error-marker.ts`

**Directories:**
- Feature groups: kebab-case (no uppercase), e.g., `src/components/annotation`, `src/app/(dashboard)`
- Auth group in App Router: `(auth)` — route group notation
- Dashboard group in App Router: `(dashboard)` — route group notation

**Exports:**
- Named exports for utility functions: `export function analyzeEssay() {}`
- Default exports for components: `export default function EssayPage() {}`
- Zustand stores exported as: `export const useAnnotationStore = create(...)`

## Where to Add New Code

**New Feature (e.g., "Export to PDF"):**
- Primary code: `src/components/essay/ExportPDFButton.tsx` (component) + `src/lib/pdf-export.ts` (service)
- Tests: `src/components/essay/ExportPDFButton.test.tsx`
- Types (if needed): Add to `src/types/essay.ts` or new file `src/types/pdf.ts`
- API endpoint (if backend needed): `src/app/api/essays/[id]/export/route.ts`

**New Component (e.g., "StudentProgressChart"):**
- Implementation: `src/components/students/StudentProgressChart.tsx`
- Store (if state needed): `src/stores/studentStore.ts`
- Types: Update `src/types/essay.ts` or new `src/types/student.ts`

**New Business Logic (e.g., "Calculate ENEM Score"):**
- Shared utilities: `src/lib/scoring.ts`
- Tests: `src/lib/scoring.test.ts`
- Import in components/API routes as needed

**New API Endpoint (e.g., "POST /api/essays/[id]/share"):**
- Route: `src/app/api/essays/[id]/share/route.ts`
- Business logic: Extract to `src/lib/sharing.ts` if complex
- Auth/feature gates: Use `checkAndIncrementDailyLimit()` or `canUseFeature()` at route entry

**Global Utilities (e.g., "Format Date"):**
- Shared helpers: `src/lib/utils.ts`
- Used across components via import

## Special Directories

**src/app/(auth):**
- Purpose: Authentication routes (public)
- Generated: No (developer-managed)
- Committed: Yes (part of codebase)
- Note: Route group notation `(auth)` prevents these from appearing in URL path

**src/app/(dashboard):**
- Purpose: Protected/authenticated routes requiring layout wrapper
- Generated: No (developer-managed)
- Committed: Yes (part of codebase)
- Note: Enforces redirect to `/login` if not authenticated

**src/app/api:**
- Purpose: API route handlers (Next.js serverless)
- Generated: No (developer-managed)
- Committed: Yes (part of codebase)
- Contains: Request/response handling, Supabase calls, AI service calls

**public:**
- Purpose: Static assets (images, favicon, etc.)
- Generated: No
- Committed: Yes
- Served at `/filename` in production

**.next:**
- Purpose: Build output (Next.js compiler cache, type definitions)
- Generated: Yes (by `next build`)
- Committed: No (git-ignored)

**node_modules:**
- Purpose: Installed dependencies
- Generated: Yes (by `npm install`)
- Committed: No (git-ignored)

**supabase:**
- Purpose: Database migrations and config
- Generated: No (developer-managed, version controlled)
- Committed: Yes
- Used for `supabase db push`, `supabase gen types`

---

*Structure analysis: 2026-03-28*
