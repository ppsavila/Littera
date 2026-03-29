---
phase: 05-plans-paywall
plan: "03"
subsystem: subscription
tags: [cpf, checkout, paywall, pricing, ux, modal]

requires:
  - phase: 05-01
    provides: [welcome-modal, UpgradeModal-welcome-reason]
  - phase: 05-02
    provides: [paywall-gates, upgrade-modal-triggers]
provides:
  - cpf-collection-in-upgrade-modal
  - checkout-sends-taxId
  - pricing-page-tagline
  - pricing-page-social-proof
  - plus-card-visual-emphasis
affects: [upgrade-modal, pricing-page, checkout-flow]

tech-stack:
  added: []
  patterns: [cpf-validation-in-modal, pendingPlan-step-pattern, modal-state-reset-on-close]

key-files:
  created: []
  modified:
    - src/components/subscription/UpgradeModal.tsx
    - src/app/(dashboard)/pricing/PricingClient.tsx

key-decisions:
  - "CPF collection step uses same formatCpf/isValidCpf utilities as PricingClient — single source of truth duplicated intentionally (small utilities, no shared module needed)"
  - "handleClose replaces onClose throughout modal JSX so CPF state always resets on close — prevents stale CPF showing on reopen"
  - "useEffect resets state when open goes false, but component also returns null when !open — useEffect guards future cases where component stays mounted"
  - "Plus card 2px purple border applied even when not current plan to make it the visually dominant option"

requirements-completed: [PLAN-03, PLAN-04]

duration: 2min
completed: "2026-03-29"
---

# Phase 05 Plan 03: CPF Checkout Fix and Pricing Page Persuasion Summary

**UpgradeModal now collects CPF before checkout (fixes guaranteed 400 error), and pricing page gains tagline, social proof line, and visually dominant Plus card with 2px purple border.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T20:36:12Z
- **Completed:** 2026-03-29T20:38:31Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Fixed the critical checkout breakage: UpgradeModal was calling `/api/subscription/checkout` with only `{ plan }`, but `SubscriptionCheckoutSchema` requires `taxId` — this caused a guaranteed 400 on every upgrade attempt from the modal
- Added in-modal CPF collection step (both welcome and standard layouts) mirroring PricingClient's proven pattern
- Pricing page now shows "Corrija mais. Ensine melhor." tagline and social proof line to increase conversion

## Task Commits

Each task was committed atomically:

1. **Task 1: Add CPF collection step to UpgradeModal** - `8bf473c` (feat)
2. **Task 2: Pricing page tagline, social proof, and Plus card emphasis** - `2857db3` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/components/subscription/UpgradeModal.tsx` - Added formatCpf/isValidCpf utilities, pendingPlan/cpf state, submitCheckout function, CPF overlay for both modal layouts, handleClose for state reset
- `src/app/(dashboard)/pricing/PricingClient.tsx` - Added tagline above plan cards, 2px purple border for Plus card, social proof line below plan cards

## Decisions Made

- CPF utilities duplicated from PricingClient rather than extracted to shared module — utilities are ~20 lines each, extraction would add unnecessary abstraction for this phase
- `handleClose` wraps `onClose` to ensure CPF state resets regardless of how the modal is dismissed (X button, backdrop click, "Gratis" skip link)
- `useEffect` on `open` prop added as belt-and-suspenders reset for cases where the component stays mounted but modal closes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All upgrade CTAs in UpgradeModal now work end-to-end (CPF + checkout)
- Pricing page has enhanced persuasion copy matching UI-SPEC
- Ready for Plan 05-04 (post-checkout activation flow or remaining paywall items)

## Self-Check: PASSED

Files verified:
- `src/components/subscription/UpgradeModal.tsx` — FOUND
- `src/app/(dashboard)/pricing/PricingClient.tsx` — FOUND
- `.planning/phases/05-plans-paywall/05-03-SUMMARY.md` — FOUND

Commits verified:
- `8bf473c` — FOUND
- `2857db3` — FOUND

---
*Phase: 05-plans-paywall*
*Completed: 2026-03-29*
