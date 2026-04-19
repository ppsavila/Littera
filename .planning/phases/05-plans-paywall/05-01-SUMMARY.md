---
phase: 05-plans-paywall
plan: "01"
subsystem: subscription
tags: [onboarding, modal, welcome, paywall, db-migration]
dependency_graph:
  requires: []
  provides: [onboarded-db-column, welcome-modal, profile-api-onboarded]
  affects: [dashboard-layout, upgrade-modal, profile-api]
tech_stack:
  added: []
  patterns: [server-component-query, client-modal-trigger, optimistic-patch]
key_files:
  created:
    - supabase/migrations/010_onboarded.sql
    - src/components/subscription/WelcomeModalTrigger.tsx
  modified:
    - src/lib/validation/schemas.ts
    - src/app/api/profile/route.ts
    - src/components/subscription/UpgradeModal.tsx
    - src/app/(dashboard)/layout.tsx
decisions:
  - "onboarded defaults to false for ALL users so existing users also see the plan comparison once on next login"
  - "WelcomeModalTrigger uses useEffect to open on mount rather than useState initializer — avoids SSR mismatch"
  - "PATCH fires only on handleClose, not on mount — avoids marking onboarded before user actually dismisses"
  - "TS errors in .next/dev/types/ are pre-existing generated artifacts, not related to this plan"
metrics:
  duration_seconds: 140
  completed_date: "2026-03-29"
  tasks_completed: 2
  files_changed: 6
---

# Phase 05 Plan 01: First-Login Welcome Modal Summary

First-login welcome modal with 3-plan comparison using onboarded DB flag, profile API extension, and client-side trigger wired into DashboardLayout.

## What Was Built

- **Migration** (`010_onboarded.sql`): Adds `onboarded boolean not null default false` to `profiles` table. Existing users also get `false` so they see the plan comparison once — intentional per product decision.
- **Profile API extension**: `ProfileUpdateSchema` now accepts `onboarded: z.boolean().optional()`. PATCH handler destructures and persists it.
- **UpgradeModal welcome reason**: Added `'welcome'` to `UpgradeReason` type. When `reason === 'welcome'`, renders a 3-column grid (Free / Plus / Premium) with `WELCOME_FEATURES` rows, plan-tier colors from UI-SPEC, "Popular" badge on Plus, and footer CTAs. Uses `max-w-xl` (wider than default `max-w-lg`) and `littera-scale-in` animation. Header icon switches from `AlertCircle` to `Zap` for the positive welcome context.
- **WelcomeModalTrigger** (`src/components/subscription/WelcomeModalTrigger.tsx`): Client component that `useEffect`-opens the modal when `onboarded === false`. On dismiss, PATCHes `/api/profile` with `{ onboarded: true }` (optimistic, silent fail).
- **DashboardLayout wiring**: Server component now queries `profiles.onboarded` after `getUserUsageInfo`. Renders `<WelcomeModalTrigger onboarded={profile?.onboarded ?? false} currentPlan={usageInfo.plan} />` before closing `</div>`.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `99b8fed` | feat(05-01): add onboarded column migration and extend profile API |
| Task 2 | `bd4e5dd` | feat(05-01): welcome modal with 3-plan comparison and layout wiring |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

**Minor addition:** `PLAN_ICONS.free` was previously `null` in `UpgradeModal`. Updated to `<Star className="w-4 h-4" />` to support the welcome layout which renders all three plan icons. This is consistent with the UI-SPEC (Star for Free) and required for correctness of the 3-column welcome grid.

## Known Stubs

None — all feature rows in the welcome modal render live data from `PLANS` config and `WELCOME_FEATURES` array. No placeholder text wired to UI rendering.

## Self-Check: PASSED

Files verified:
- `supabase/migrations/010_onboarded.sql` — FOUND
- `src/components/subscription/WelcomeModalTrigger.tsx` — FOUND
- `src/lib/validation/schemas.ts` — onboarded field present
- `src/app/api/profile/route.ts` — onboarded in destructuring and update
- `src/components/subscription/UpgradeModal.tsx` — welcome reason, grid-cols-3, Bem-vindo ao Littera
- `src/app/(dashboard)/layout.tsx` — WelcomeModalTrigger import + render + .select('onboarded')

Commits verified:
- `99b8fed` — FOUND
- `bd4e5dd` — FOUND
