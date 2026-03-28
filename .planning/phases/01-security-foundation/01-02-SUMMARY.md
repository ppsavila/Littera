---
phase: 01-security-foundation
plan: 02
subsystem: api
tags: [rate-limiting, csp, sentry, supabase-rpc, security]

# Dependency graph
requires: []
provides:
  - CSP connect-src updated with Sentry ingest domains (SEC-03)
  - Rate limiting on essays POST endpoint (20/hour)
  - Rate limiting on subscription/checkout POST endpoint (5/hour)
  - Rate limiting on ai/student-analysis POST endpoint (5/10min)
affects: [02-testing, future-api-changes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reusing check_ai_rate_limit Supabase RPC with different p_max/p_window_ms for per-endpoint limits"
    - "Rate limit check placed after auth check, before request body parsing"

key-files:
  created: []
  modified:
    - next.config.ts
    - src/app/api/essays/route.ts
    - src/app/api/subscription/checkout/route.ts
    - src/app/api/ai/student-analysis/route.ts

key-decisions:
  - "Shared check_ai_rate_limit counter for all rate-limited endpoints is acceptable for Phase 1 as a broad API action limiter; independent per-endpoint counters require separate RPC + columns in a future phase"
  - "Rate limits: essays 20/hour, checkout 5/hour, student-analysis 5/10min — matching the existing analyze endpoint pattern"

patterns-established:
  - "Rate limit pattern: define RATE_MAX + RATE_WINDOW_MS constants, async checkXxxRateLimit(userId) helper, guard at top of handler after auth"

requirements-completed: [SEC-03, SEC-04]

# Metrics
duration: 15min
completed: 2026-03-28
---

# Phase 1 Plan 02: CSP Sentry Fix + Rate Limiting for 3 Unprotected Endpoints Summary

**DB-backed per-user rate limiting added to essays, checkout, and student-analysis endpoints via Supabase RPC, plus Sentry ingest domains added to CSP connect-src**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-28
- **Completed:** 2026-03-28
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- CSP connect-src now includes `https://*.sentry.io` and `https://*.ingest.sentry.io` — Sentry client error reporting no longer blocked
- essays POST limited to 20 creations per hour per user (429 on excess)
- subscription/checkout POST limited to 5 attempts per hour per user (429 on excess)
- ai/student-analysis POST limited to 5 requests per 10 minutes per user (429 on excess)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Sentry domains to CSP connect-src** - `8fce04e` (fix)
2. **Task 2: Add rate limiting to essays, checkout, and student-analysis endpoints** - `28d6b77` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `next.config.ts` - Added `https://*.sentry.io https://*.ingest.sentry.io` to connect-src CSP directive
- `src/app/api/essays/route.ts` - Added checkEssayCreateRateLimit (20/hour) with 429 response
- `src/app/api/subscription/checkout/route.ts` - Added checkCheckoutRateLimit (5/hour) with 429 response
- `src/app/api/ai/student-analysis/route.ts` - Added checkStudentAnalysisRateLimit (5/10min) with 429 response

## Decisions Made
- Reused the existing `check_ai_rate_limit` Supabase RPC (already used by the analyze endpoint) for all three new endpoints. This shares a single per-user counter across all rate-limited endpoints — acceptable for Phase 1 since the counter tracks "API actions" broadly. Independent per-endpoint counters would require separate RPC + columns in a future phase.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript error in `src/lib/validation/schemas.ts` line 42 (`TS2554: Expected 2-3 arguments, but got 1`) was discovered during `tsc --noEmit` verification. Confirmed pre-existing via git stash test. Logged to `deferred-items.md` — out of scope for this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SEC-03 and SEC-04 fully addressed
- All 4 critical API endpoints now have rate limiting (analyze, essays, checkout, student-analysis)
- Pre-existing TS error in src/lib/validation/schemas.ts should be resolved in the testing phase

---
*Phase: 01-security-foundation*
*Completed: 2026-03-28*

## Self-Check: PASSED

- next.config.ts: FOUND
- src/app/api/essays/route.ts: FOUND
- src/app/api/subscription/checkout/route.ts: FOUND
- src/app/api/ai/student-analysis/route.ts: FOUND
- .planning/phases/01-security-foundation/01-02-SUMMARY.md: FOUND
- Commit 8fce04e (Task 1): FOUND
- Commit 28d6b77 (Task 2): FOUND
