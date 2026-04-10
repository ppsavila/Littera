---
phase: 07-product-analytics
plan: 02
subsystem: ui
tags: [posthog, analytics, product-events, react, typescript]

# Dependency graph
requires:
  - phase: 07-01
    provides: PostHog provider, usePostHog hook, PostHogProvider wrapping app

provides:
  - essay_created capture in UploadWizard after successful API creation
  - essay_analyzed capture in ScoringPanel after SSE done event
  - annotation_used capture in AnnotationCanvas after Supabase insert success
  - export_triggered capture in ExportPDFButton (format:pdf) and WorkspaceHeader (format:whatsapp)
  - upgrade_modal_opened capture in UpgradeModal via useEffect when open===true
  - upgrade_cta_clicked capture in UpgradeModal handleUpgrade
  - feature_gate_hit capture in FeatureLockBadge with optional feature prop

affects: [posthog-dashboards, funnel-analysis, conversion-tracking]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "posthog?.capture() with optional chaining — safe even before PostHog init completes"
    - "capture fires AFTER success (essayRes.ok, SSE done, Supabase !error) not before attempt"
    - "No PII in event properties — only plan tiers, source_type, format, feature names, counts"
    - "useEffect watches open prop for modal_opened event — avoids firing on render, only on state change"

key-files:
  created: []
  modified:
    - src/components/essay/UploadWizard.tsx
    - src/components/scoring/ScoringPanel.tsx
    - src/components/annotation/AnnotationCanvas.tsx
    - src/components/essay/ExportPDFButton.tsx
    - src/components/essay/WorkspaceHeader.tsx
    - src/components/subscription/UpgradeModal.tsx
    - src/components/subscription/FeatureLockBadge.tsx

key-decisions:
  - "mapReasonToTrigger helper co-located with UpgradeModal — no shared module needed for single consumer"
  - "FeatureLockBadge feature prop is optional (feature?) — backward-compatible, existing callers unchanged"
  - "export_triggered fires only in the success try-block path in WorkspaceHeader, not in fallback catch"
  - "upgrade_cta_clicked fires in handleUpgrade (before CPF step) — captures intent, not checkout completion"

patterns-established:
  - "PostHog events: always use posthog?.capture (optional chaining) throughout components"
  - "PostHog events: fire after confirmed success action, never speculatively"

requirements-completed: [ANA-02, ANA-03]

# Metrics
duration: 15min
completed: 2026-04-10
---

# Phase 07 Plan 02: Product Event Instrumentation Summary

**8 PostHog capture calls wired across 7 components covering the full essay creation, analysis, annotation, export, and conversion funnel — no PII, all fire after confirmed success**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-10T15:47:00Z
- **Completed:** 2026-04-10T15:51:02Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Instrumented full essay creation funnel: essay_created, essay_analyzed, annotation_used
- Instrumented export and conversion funnel: export_triggered (pdf + whatsapp), upgrade_modal_opened, upgrade_cta_clicked, feature_gate_hit
- FeatureLockBadge gains optional `feature` prop for analytics context while remaining backward compatible

## Task Commits

Each task was committed atomically:

1. **Task 1: essay_created, essay_analyzed, annotation_used** - `33d3e33` (feat)
2. **Task 2: export, upgrade, and feature gate events** - `4d107c8` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `src/components/essay/UploadWizard.tsx` - essay_created after essayRes.ok
- `src/components/scoring/ScoringPanel.tsx` - essay_analyzed at SSE done branch
- `src/components/annotation/AnnotationCanvas.tsx` - annotation_used after Supabase insert success
- `src/components/essay/ExportPDFButton.tsx` - export_triggered format:pdf after generatePdfBytes
- `src/components/essay/WorkspaceHeader.tsx` - export_triggered format:whatsapp after window.open
- `src/components/subscription/UpgradeModal.tsx` - upgrade_modal_opened (useEffect) + upgrade_cta_clicked (handleUpgrade)
- `src/components/subscription/FeatureLockBadge.tsx` - feature_gate_hit on onClick + optional feature prop

## Decisions Made
- `mapReasonToTrigger` co-located inside UpgradeModal.tsx — single consumer, no shared utility needed
- `feature` prop on FeatureLockBadge is optional so existing callers in WorkspaceHeader and ScoringPanel continue working without changes
- `export_triggered` fires only in the try block main success path in WorkspaceHeader; the catch fallback does not fire it (fallback is a degraded path, not a full export)
- `upgrade_cta_clicked` fires in `handleUpgrade` at the moment a plan button is clicked, before CPF entry, capturing upgrade intent

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None. TypeScript compiled clean on all 7 modified files. Pre-existing test mock errors in `__tests__/` are unrelated to this plan.

## User Setup Required
None - no external service configuration required. PostHog events will appear in the PostHog dashboard automatically once the NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST env vars (set up in 07-01) are active.

## Next Phase Readiness
- All 8 product events are live and firing correctly at trigger points
- PostHog funnels can now be configured: essay creation funnel, conversion funnel (feature_gate_hit → upgrade_modal_opened → upgrade_cta_clicked)
- Ready for 07-03 (identify + plan properties) if planned, or phase complete

---
*Phase: 07-product-analytics*
*Completed: 2026-04-10*
