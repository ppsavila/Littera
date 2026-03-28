---
phase: 02-test-suite
plan: 01
subsystem: testing
tags: [vitest, playwright, jsdom, testing-library, vite-tsconfig-paths, github-actions, ci]

# Dependency graph
requires:
  - phase: 01-security-foundation
    provides: secured route handlers and Supabase patterns that fixtures must mock
provides:
  - Vitest 4.1.2 configured with jsdom, tsconfigPaths, unstubEnvs, passWithNoTests
  - Playwright 1.58.2 configured with webServer and baseURL for e2e dir
  - Shared Supabase mock factory (createMockSupabaseClient) for all unit tests
  - Shared essay data factory (createMockEssay) for all unit tests
  - CI test job that runs npm test on every push/PR
affects:
  - 02-02 (route handler tests — uses fixtures from this plan)
  - all subsequent test plans in phase 02

# Tech tracking
tech-stack:
  added:
    - vitest@4.1.2
    - "@vitejs/plugin-react@6.0.1"
    - jsdom@29.0.1
    - "@testing-library/react@16.3.2"
    - "@testing-library/dom@10.4.1"
    - vite-tsconfig-paths@6.1.1
    - "@playwright/test@1.58.2"
  patterns:
    - "Test fixtures exported from __tests__/fixtures/ — never hand-roll Supabase mocks in test files"
    - "vi.mock('@/lib/supabase/server') called at top level of each test file; createMockSupabaseClient used inside mock callback"
    - "vitest.config.mts uses passWithNoTests to allow empty test suite with exit 0"

key-files:
  created:
    - vitest.config.mts
    - playwright.config.ts
    - __tests__/setup.ts
    - __tests__/fixtures/supabase.ts
    - __tests__/fixtures/essay.ts
    - .github/workflows/ci.yml
  modified:
    - package.json

key-decisions:
  - "Added passWithNoTests: true to vitest.config.mts so npm test exits 0 with an empty test suite — required for CI to pass before tests are written"
  - "Used git add -f for .github/workflows/ci.yml because .github is listed in .gitignore for this worktree"

patterns-established:
  - "Fixtures pattern: import createMockSupabaseClient from __tests__/fixtures/supabase.ts inside vi.mock callbacks"
  - "Setup pattern: afterEach calls cleanup() + vi.clearAllMocks() globally via vitest.config.mts setupFiles"

requirements-completed: []

# Metrics
duration: 7min
completed: 2026-03-28
---

# Phase 02 Plan 01: Test Infrastructure Setup Summary

**Vitest 4.1.2 + Playwright 1.58.2 installed with shared mock factories for Supabase and essay data, CI test job added**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-03-28T20:18:55Z
- **Completed:** 2026-03-28T20:25:45Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Vitest configured with jsdom, tsconfigPaths, unstubEnvs, and passWithNoTests — runs cleanly with zero tests
- Playwright configured with webServer and baseURL pointing at e2e/ dir — shows 0 tests without errors
- Shared `createMockSupabaseClient` factory covers auth.getUser, from().select/insert/update/delete, rpc, and storage chains
- CI workflow now has three jobs: lint-and-typecheck, build, and test (the new one needs lint-and-typecheck)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install test dependencies and create config files** - `4c7bb5c` (chore)
2. **Task 2: Create shared test fixtures and CI test job** - `95ebf08` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `vitest.config.mts` - Vitest config with jsdom, tsconfigPaths, unstubEnvs, passWithNoTests, setupFiles pointing to __tests__/setup.ts
- `playwright.config.ts` - Playwright config with webServer (npm run dev), baseURL (localhost:3000), chromium project
- `__tests__/setup.ts` - Global afterEach hook: cleanup() + vi.clearAllMocks()
- `__tests__/fixtures/supabase.ts` - Mock factory: exports createMockSupabaseClient, mockUser, mockUserB
- `__tests__/fixtures/essay.ts` - Data factory: exports createMockEssay, VALID_ESSAY_CREATE_BODY, INVALID_ESSAY_CREATE_BODY
- `.github/workflows/ci.yml` - Added test job (needs lint-and-typecheck, runs npm test with placeholder env vars)
- `package.json` - Added test, test:watch, test:e2e scripts; added 7 new devDependencies

## Decisions Made

- Added `passWithNoTests: true` to vitest config — npm test must exit 0 before any tests are written, otherwise CI breaks immediately
- Used `git add -f` for `.github/workflows/ci.yml` — the `.gitignore` lists `.github` as ignored in this worktree (likely worktree-specific exclusion); force-added to track the CI file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added passWithNoTests to vitest config**
- **Found during:** Task 1 (verifying Vitest runs)
- **Issue:** `vitest run` with no test files exits with code 1, which would make `npm test` fail in CI before any tests are written
- **Fix:** Added `passWithNoTests: true` to vitest.config.mts test options
- **Files modified:** vitest.config.mts
- **Verification:** `npm test` exits with code 0 — confirmed in terminal
- **Committed in:** 4c7bb5c (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 correctness fix)
**Impact on plan:** Essential — without this fix CI would fail immediately for the entire phase. No scope creep.

## Issues Encountered

- Playwright Chromium browser download timed out during `npx playwright install chromium` (network timeout). The `@playwright/test` package is installed and the config is valid. The Chromium binary is only needed to actually run E2E tests (not `--list` or config verification). CI will download it via `npx playwright install chromium` in the E2E job when that is added in a later plan.

## Known Stubs

None — this plan installs tooling and creates factories, no UI or data rendering involved.

## Next Phase Readiness

- All subsequent test plans (02-02 onwards) can import from `__tests__/fixtures/supabase.ts` and `__tests__/fixtures/essay.ts`
- `npm test` is wired into CI — new test files added in subsequent plans will automatically run
- No blockers

---
*Phase: 02-test-suite*
*Completed: 2026-03-28*
