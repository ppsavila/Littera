# Architecture

**Analysis Date:** 2026-03-28

## Pattern Overview

**Overall:** Next.js 16 full-stack application with client-server separation, leveraging React Server Components for data fetching and Zustand for client-side state management.

**Key Characteristics:**
- Server-side authentication via Supabase with SSR support
- Event-streaming API responses for real-time AI analysis feedback
- Separate client/server Supabase instances (browser vs. server)
- Feature flag-based access control (subscriptions gated at route/feature level)
- Client-side annotation/scoring state with undo history via Zustand

## Layers

**Presentation Layer (UI Components):**
- Purpose: Render pages, handle user interactions, manage client-side state
- Location: `src/components/`, `src/app/`
- Contains: React components (pages, layout wrappers, feature-specific UI)
- Depends on: Zustand stores, types, utilities, API routes
- Used by: Next.js routing system

**API Layer (Route Handlers):**
- Purpose: Handle HTTP requests, enforce authentication/authorization, orchestrate business logic
- Location: `src/app/api/`
- Contains: Next.js route handlers (POST/GET) with request validation
- Depends on: Supabase client, AI service, subscription access module, logger
- Used by: Client-side fetch calls, webhooks

**Data Access Layer:**
- Purpose: Abstract Supabase database operations
- Location: `src/lib/supabase/`
- Contains: `client.ts` (browser), `server.ts` (server), `service.ts` (privileged operations)
- Depends on: Supabase SDK, Next.js cookies
- Used by: API routes, Server Components, auth flows

**AI Service Layer:**
- Purpose: Call Claude API for essay analysis, stream responses
- Location: `src/lib/ai/`
- Contains: `analyze-essay.ts` (non-streaming), `analyze-essay.ts` (streaming), `prompts.ts`
- Depends on: Anthropic SDK, essay types
- Used by: API route `/api/essays/[id]/analyze`

**Business Logic Layer:**
- Purpose: Handle subscriptions, feature gates, rate limiting
- Location: `src/lib/subscriptions/`, `src/lib/`
- Contains: `access.ts` (daily limits, feature checks), `plans.ts` (plan definitions), `flags.ts` (feature flags)
- Depends on: Supabase, types
- Used by: API routes, Server Components

**State Management (Client):**
- Purpose: Manage transient client state (annotations, scores, error markers)
- Location: `src/stores/`
- Contains: Zustand stores with undo history support
- Depends on: types, utilities
- Used by: Client components

**Type Definitions:**
- Purpose: Centralized TypeScript type contracts
- Location: `src/types/`
- Contains: `essay.ts`, `annotation.ts`, `error-marker.ts`
- Depends on: None (leaf dependencies)
- Used by: All layers

## Data Flow

**Essay Upload & Analysis:**

1. User uploads file (PDF/image/text) → `CorrectionWorkspace` component
2. Component extracts text (OCR via tesseract.js for images)
3. POST `/api/essays` → creates essay record, checks daily limits
4. POST `/api/essays/[id]/analyze` → streams Claude analysis via EventSource
5. AI analysis persists to `essays` table, updates UI via streaming chunks
6. User corrects scores/annotations client-side → Zustand stores hold changes
7. POST `/api/essays/[id]` (future) → persist corrections to database

**Annotation Workflow:**

1. User selects annotation tool → updates `useAnnotationStore` (active tool, color, stroke width)
2. Draws on canvas → `AnnotationCanvas` component (Konva.js)
3. Annotation added to store → history snapshot taken, undo buffer updated (max 50 snapshots)
4. User saves → calls API endpoint to persist annotations
5. Can undo (Ctrl+Z) → restores from history snapshots

**Scoring & Error Marking:**

1. User assigns C1-C5 competency scores → `useScoringStore` holds state
2. User marks specific errors → `useErrorMarkerStore` tracks by competency + error type
3. Error markers influence AI re-analysis context (error deductions shown in feedback)
4. All changes tracked in stores until save

**State Management:**

- **Client State (Zustand):** Annotations, error markers, scoring, UI toggles — discarded on page reload unless saved
- **Server State (Supabase):** Essays, user profiles, subscription status, persisted annotations — source of truth
- **Session State (Auth):** User identity via Supabase auth (JWT in cookies), checked at layout level

## Key Abstractions

**Annotation System:**
- Purpose: Enable visual markup of essays with comments
- Examples: `src/stores/annotationStore.ts`, `src/components/annotation/AnnotationCanvas.tsx`
- Pattern: Zustand store with per-page annotation arrays, undo history with immutable snapshots

**Competency Scoring:**
- Purpose: Assign official ENEM scores (C1-C5, 0-200 per competency)
- Examples: `src/stores/scoringStore.ts`, `src/components/scoring/ScoringPanel.tsx`
- Pattern: Single Zustand store holding all 5 competency scores + per-competency feedback

**Feature Gate:**
- Purpose: Restrict features by subscription plan + enforce feature flags
- Examples: `src/lib/subscriptions/access.ts`, `canUseFeature()`, `checkAndIncrementDailyLimit()`
- Pattern: Async utility functions checked at route handler entry points

**AI Analysis:**
- Purpose: Generate structured competency feedback from essay text
- Examples: `src/lib/ai/analyze-essay.ts`
- Pattern: Anthropic SDK with system prompt + user message, JSON response parsing, streaming support

## Entry Points

**HomePage (`src/app/page.tsx`):**
- Location: `src/app/page.tsx`
- Triggers: Initial visit, redirect from authenticated user
- Responsibilities: Marketing landing page, redirect authenticated users to `/essays`

**DashboardLayout (`src/app/(dashboard)/layout.tsx`):**
- Location: `src/app/(dashboard)/layout.tsx`
- Triggers: All `/essays`, `/pricing`, `/profile`, `/students`, `/dashboard` routes
- Responsibilities: Enforce authentication, load usage info, render sidebar/header/bottom-nav

**EssayPage (`src/app/(dashboard)/essays/[id]/page.tsx`):**
- Location: `src/app/(dashboard)/essays/[id]/page.tsx`
- Triggers: User navigates to `/essays/[id]`
- Responsibilities: Fetch essay + annotations + error markers from Supabase, pass to `CorrectionWorkspace`

**APIEssaysCreate (`src/app/api/essays/route.ts`):**
- Location: `src/app/api/essays/route.ts`
- Triggers: POST from upload wizard
- Responsibilities: Validate user + plan, check daily limits, create essay record, return essay ID

**APIEssayAnalyze (`src/app/api/essays/[id]/analyze/route.ts`):**
- Location: `src/app/api/essays/[id]/analyze/route.ts`
- Triggers: POST from `CorrectionWorkspace` → `useAnalyze()` hook
- Responsibilities: Check feature access + rate limits, stream Claude analysis, save results to DB

## Error Handling

**Strategy:** Try-catch at async boundaries; return HTTP errors (401, 403, 429, 400) from routes; client-side error states in hooks.

**Patterns:**
- API routes return `NextResponse.json({ error })` with appropriate status codes
- Client hooks catch fetch errors and display toast notifications
- Supabase errors logged via `src/lib/logger.ts`
- AI streaming errors caught in `analyzeEssayStream()` generator, yielded as `{ type: 'error' }`

## Cross-Cutting Concerns

**Logging:** `src/lib/logger.ts` — structured logging with context (userId, essayId, etc.)

**Validation:**
- Route handlers validate request bodies (e.g., `title` + `source_type` required in `/api/essays`)
- Types enforced at compile time via TypeScript
- Zod (dependency present, location: `package.json`) available for schema validation

**Authentication:**
- Supabase Auth via `createClient()` (browser) / `createClient()` (server)
- User checked at layout level, redirect to `/login` if missing
- JWT in secure cookies managed by Supabase SSR middleware

**Authorization:**
- `canUseFeature(userId, feature)` checks plan + feature flags
- `checkAndIncrementDailyLimit(userId)` enforces per-plan correction limits
- Teacher can only access/modify essays where `teacher_id === user.id`

---

*Architecture analysis: 2026-03-28*
