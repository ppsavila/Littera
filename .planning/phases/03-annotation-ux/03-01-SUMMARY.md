---
phase: 03-annotation-ux
plan: 03-01
subsystem: ui
tags: [react, konva, canvas, annotation, error-markers, pointer-events]

# Dependency graph
requires: []
provides:
  - "AnnotationCanvas always mounted in TextRenderer regardless of error mode"
  - "CSS pointer-events toggle prevents canvas from intercepting input in error mode"
  - "No Konva Stage destruction/recreation on mode switch (zero flicker)"
affects: [annotation-tools, error-markers, export-pdf]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS pointer-events toggle instead of conditional mounting for mode-switched layers"

key-files:
  created: []
  modified:
    - src/components/essay/TextRenderer.tsx

key-decisions:
  - "Use CSS pointerEvents toggle on wrapper div instead of conditional React rendering to preserve Konva Stage across mode switches"
  - "zIndex lowered to 0 in error mode so annotation canvas does not block error marker interactions"

patterns-established:
  - "Always-mounted canvas with CSS pointer-events toggle: keeps drawing state alive across mode switches without unmounting Konva Stage"

requirements-completed: [ANNO-01]

# Metrics
duration: 3min
completed: 2026-03-28
---

# Phase 03 Plan 01: Annotation Canvas Persistence Fix Summary

**AnnotationCanvas kept always-mounted in TextRenderer via CSS pointer-events wrapper div, eliminating canvas disappearance when switching to error-marking mode**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-28T21:08:00Z
- **Completed:** 2026-03-28T21:09:36Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Replaced conditional `{!isErrorMode && <AnnotationCanvas />}` with an always-mounted wrapper div
- Canvas annotations (drawings, arrows, text labels) remain visible when professor activates error-marking mode
- Switching back from error mode to annotation mode has zero flicker (Konva Stage never destroyed)
- Error markers continue to work normally via `document.addEventListener('mouseup')` approach in ErrorMarkerLayer (unaffected by pointer-events change)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix TextRenderer — always mount AnnotationCanvas with CSS toggle** - `a239550` (fix)

**Plan metadata:** (included in final docs commit)

## Files Created/Modified

- `src/components/essay/TextRenderer.tsx` - Replaced conditional AnnotationCanvas mount with always-rendered wrapper div using CSS pointer-events toggle

## Decisions Made

- Used CSS `pointerEvents: isErrorMode ? 'none' : 'auto'` on wrapper div rather than unmounting the component. This preserves the Konva Stage and all canvas data in memory across mode switches.
- `zIndex` on wrapper is `0` in error mode and `1` in annotation mode, keeping layer order consistent with the text/error layers already in place.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Pre-existing TypeScript errors in `__tests__/integration/subscription.test.ts` and `__tests__/unit/access.test.ts` (mock typing issues from Phase 2) are unrelated to this fix and were already present before this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ANNO-01 resolved: canvas annotations persist across mode switches
- Annotation UX improvements (Phase 03) can continue — next plans can build on stable canvas foundation
- No blockers

## Self-Check: PASSED

- `src/components/essay/TextRenderer.tsx` — FOUND
- `.planning/phases/03-annotation-ux/03-01-SUMMARY.md` — FOUND
- Commit `a239550` — FOUND

---
*Phase: 03-annotation-ux*
*Completed: 2026-03-28*
