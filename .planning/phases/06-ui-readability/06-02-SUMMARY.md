---
phase: 06-ui-readability
plan: "02"
subsystem: ui
tags: [typography, readability, wcag, contrast, landing-page, pricing]

# Dependency graph
requires:
  - phase: 06-01
    provides: CSS typography tokens (--littera-text-*), contrast-safe --littera-slate-dark color, spacing scale
provides:
  - Landing page hero with 60px display heading and AA-contrast tagline
  - Pricing Plus card with stronger visual emphasis (deeper purple bg + elevated shadow)
  - 16px feature text on landing and pricing pages
  - Prominent CTA buttons with generous touch targets on both pages
affects: [06-03, any plan touching page.tsx or pricing pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Use --littera-slate-dark instead of --littera-slate for body-size informational text on light backgrounds"
    - "Plus card emphasis via bg=#f5f0ff + var(--littera-shadow-md) to visually differentiate recommended plan"

key-files:
  created: []
  modified:
    - src/app/page.tsx
    - src/app/(dashboard)/pricing/page.tsx
    - src/app/(dashboard)/pricing/PricingClient.tsx

key-decisions:
  - "Plus card bg changed from #faf5ff to #f5f0ff for stronger purple tint, combined with shadow-md elevation to differentiate from Free/Premium cards"
  - "Feature icon containers enlarged from w-10 h-10 to w-11 h-11 to match 16px body text scale"

patterns-established:
  - "Pattern: slate-dark for body — Any informational body-size text on parchment background must use var(--littera-slate-dark), never var(--littera-slate)"
  - "Pattern: CTA padding minimums — Primary CTAs use px-8 py-3.5, card CTAs use py-3, nav CTAs use px-5 py-2.5"

requirements-completed: [UI-04]

# Metrics
duration: 30min (includes human verification)
completed: 2026-04-09
---

# Phase 06 Plan 02: Landing Page and Pricing Visual Polish Summary

**Landing page hero upgraded to font-extrabold lg:text-6xl with AA-contrast tagline, and pricing Plus card given stronger visual emphasis via deeper purple background and elevated shadow — all body-size text now uses contrast-safe slate-dark token**

## Performance

- **Duration:** ~30 min (includes human verification gate)
- **Started:** 2026-04-09
- **Completed:** 2026-04-09
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 3

## Accomplishments

- Landing page hero h1 now renders at 60px on large desktop (lg:text-6xl), 48px on tablet (sm:text-5xl), 36px on mobile (text-4xl), using Playfair Display font-extrabold (weight 800)
- Landing feature cards upgraded: titles to text-base (16px), descriptions to text-sm sm:text-base with var(--littera-slate-dark) for WCAG AA compliance, icons enlarged to w-11 h-11
- Pricing Plus card has clear visual hierarchy: deeper purple background (#f5f0ff), elevated shadow (var(--littera-shadow-md)), larger plan name (text-xl font-bold), larger price (text-3xl font-bold)
- All card feature lists use text-sm sm:text-base with w-5 h-5 check icons and py-3 CTA buttons
- Comparison table text upgraded to text-sm sm:text-base with more vertical breathing (py-3.5)
- Social proof, footer payment text, and hero tagline all use var(--littera-slate-dark) for AA contrast on parchment

## Task Commits

Each task was committed atomically:

1. **Task 1: Landing page hero impact and features readability** - `02bd933` (feat)
2. **Task 2: Pricing page typography and Plus card emphasis** - `f75a920` (feat)
3. **Task 3: Visual verification** - Human-approved checkpoint (no code commit)

## Files Created/Modified

- `src/app/page.tsx` - Hero h1 font-extrabold lg:text-6xl, tagline slate-dark text-xl, feature cards text-base, CTA buttons px-8 py-3.5
- `src/app/(dashboard)/pricing/page.tsx` - h1 font-bold, subtitle text-lg slate-dark
- `src/app/(dashboard)/pricing/PricingClient.tsx` - Plus card bg #f5f0ff + shadow-md, card padding p-6, plan name text-xl font-bold, price text-3xl font-bold, features text-sm sm:text-base with w-5 h-5 icons, CTAs py-3

## Decisions Made

- Plus card background changed from #faf5ff to #f5f0ff (slightly deeper purple) for more visible distinction from Free and Premium cards, combined with var(--littera-shadow-md) for elevation — shadow alone is insufficient at small sizes
- Feature icon containers enlarged from w-10 h-10 to w-11 h-11 and icon SVG dimensions from 18px to 20px to keep proportion with 16px body text

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `.next/dev/types/routes.d.ts` was corrupted (duplicate closing braces at end of file), causing TypeScript build failure. This was a pre-existing generated-file corruption unrelated to plan changes. Fixed by clearing the `.next/` cache and rebuilding fresh — build passed cleanly on second run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Landing page and pricing page readability polish complete; ready for Phase 06-03 (authentication / essay-flow pages readability)
- The --littera-slate-dark convention is now established in two high-traffic pages; Phase 06-03 should apply the same token to dashboard and essay pages
- No blockers

---
*Phase: 06-ui-readability*
*Completed: 2026-04-09*
