---
phase: 07-product-analytics
plan: 01
subsystem: infra
tags: [posthog, analytics, pageview, spa-tracking, user-identification, csp]

# Dependency graph
requires: []
provides:
  - posthog-js and posthog-node installed and initialized
  - SPA-aware pageview tracking via SuspendedPostHogPageView (Suspense-wrapped)
  - User identification in PostHog with plan and created_at properties
  - PostHog provider initialized in Providers.tsx via useEffect
  - PostHog identity cleared on logout
  - CSP connect-src updated to allow PostHog cloud domains
affects: [07-02-event-instrumentation, any future analytics plans]

# Tech tracking
tech-stack:
  added: [posthog-js@1.367.0, posthog-node@5.29.2]
  patterns:
    - posthog.init called in useEffect (NOT module level) to avoid React 19 hydration mismatch
    - SuspendedPostHogPageView wraps useSearchParams in Suspense boundary (Next.js App Router requirement)
    - PostHogIdentify guarded by _isIdentified() to prevent repeated identify calls
    - autocapture:false for full event control, capture_pageview:false for manual SPA tracking

key-files:
  created:
    - src/components/analytics/PostHogPageView.tsx
    - src/components/layout/PostHogIdentify.tsx
  modified:
    - src/components/layout/Providers.tsx
    - src/app/(dashboard)/layout.tsx
    - src/components/layout/Header.tsx
    - next.config.ts
    - package.json

key-decisions:
  - "posthog.init in useEffect not module level — avoids React 19 hydration mismatch"
  - "autocapture:false and capture_pageview:false — full manual control per D-18/D-05"
  - "Only plan and created_at as identify properties — no email/CPF/student names per D-21"
  - "posthog.reset() before supabase.auth.signOut() — clears identity and session on logout per D-07"

patterns-established:
  - "Analytics init pattern: useEffect in Providers, never module-level"
  - "SPA pageview pattern: SuspendedPostHogPageView in Providers, manually fires $pageview on pathname change"
  - "User identify pattern: server component passes userId+plan to PostHogIdentify client component"

requirements-completed: [ANA-01]

# Metrics
duration: 12min
completed: 2026-04-10
---

# Phase 7 Plan 01: PostHog Analytics Foundation Summary

**posthog-js initialized via useEffect with manual SPA pageview tracking, user identification by plan tier, CSP updated for PostHog cloud domains, and logout identity reset**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-10T15:43:54Z
- **Completed:** 2026-04-10T15:55:46Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Installed posthog-js@1.367.0 and posthog-node@5.29.2; PostHog provider initialized in Providers.tsx via useEffect avoiding React 19 hydration issues
- SuspendedPostHogPageView fires $pageview on every SPA navigation (pathname + searchParams change), Suspense-wrapped per Next.js App Router requirement
- PostHogIdentify client component identifies logged-in users with plan and created_at props, guarded by _isIdentified() to prevent duplicate calls
- posthog.reset() added to Header.tsx handleSignOut to clear identity on logout
- CSP connect-src extended with https://app.posthog.com and https://*.posthog.com

## Task Commits

Each task was committed atomically:

1. **Task 1: Install PostHog packages and create analytics components** - `14c13c2` (feat)
2. **Task 2: Wire PostHog provider, user identify, CSP, and logout reset** - `bd89c43` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/components/analytics/PostHogPageView.tsx` - SPA pageview tracker using usePathname/useSearchParams, exported as SuspendedPostHogPageView (Suspense-wrapped)
- `src/components/layout/PostHogIdentify.tsx` - Client component that calls posthog.identify with userId, plan, and created_at on dashboard entry
- `src/components/layout/Providers.tsx` - Extended with PHProvider wrapper and posthog.init in useEffect; renders SuspendedPostHogPageView
- `src/app/(dashboard)/layout.tsx` - Now renders PostHogIdentify with user.id, usageInfo.plan, and user.created_at
- `src/components/layout/Header.tsx` - handleSignOut now calls posthog.reset() before supabase.auth.signOut()
- `next.config.ts` - CSP connect-src now includes PostHog domains
- `package.json` - posthog-js and posthog-node added as dependencies

## Decisions Made

- posthog.init called in useEffect (not at module level) — avoids React 19 hydration mismatch; PHProvider initialized with posthog singleton
- autocapture:false and capture_pageview:false — full manual control over events, no automatic noise
- Only plan and created_at passed as identify properties — privacy-respecting; no email, CPF, or student names per D-21
- posthog.reset() called before supabase.auth.signOut() — ensures PostHog identity cleared at logout boundary
- .env.local already had real PostHog keys; no placeholder needed

## Deviations from Plan

None - plan executed exactly as written. .env.local already had real NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST values from prior setup (plan step 5 was a no-op).

## Issues Encountered

None. Build succeeded cleanly; no "useSearchParams should be wrapped in a suspense boundary" warning. Pre-existing TypeScript errors in __tests__/ files (Supabase mock type mismatches from Phase 02) are unrelated to this plan.

## User Setup Required

PostHog environment variables are already configured in .env.local:
- `NEXT_PUBLIC_POSTHOG_KEY` — real key present
- `NEXT_PUBLIC_POSTHOG_HOST` — set to https://app.posthog.com

For production deployment, add the same two env vars to Vercel dashboard.

## Next Phase Readiness

- PostHog provider foundation is complete and accepting events
- Plan 07-02 can now instrument specific product events (essay analysis, paywall triggers, plan upgrades) using usePostHog() hook in any client component
- No blockers

---
*Phase: 07-product-analytics*
*Completed: 2026-04-10*
