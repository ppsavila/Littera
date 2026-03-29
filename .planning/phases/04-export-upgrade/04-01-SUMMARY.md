---
phase: 04-export-upgrade
plan: 01
subsystem: ui
tags: [pdf-export, html-to-image, canvas, react, next.js]

# Dependency graph
requires:
  - phase: 03-annotation-ux
    provides: annotation canvas (Konva), error markers, viewerStore.pageCanvases registry
provides:
  - Working PDF export for text-type essays (html-to-image capture + annotation overlay)
  - Enhanced scoring page header with student name, class, and date
affects: [export-upgrade, future-export-plans]

# Tech tracking
tech-stack:
  added:
    - html-to-image (CSS lab() color support, replaces html2canvas for text capture)
  patterns:
    - "Dynamic import of capture library at export time (code-split, only loaded when needed)"
    - "Register captured canvas into viewerStore so existing export loop processes it uniformly"
    - "Read pageCanvases from useViewerStore.getState() inside loop to avoid stale closure"

key-files:
  created: []
  modified:
    - src/components/essay/TextRenderer.tsx
    - src/components/essay/ExportPDFButton.tsx
    - package.json

key-decisions:
  - "Switched from html2canvas to html-to-image after Task 2 — html2canvas does not support CSS lab() colors used by the app's design system; html-to-image handles them correctly"
  - "Text container captured at export time (not on mount) to ensure layout is stable before capture"
  - "Registered captured canvas into viewerStore.pageCanvases[1] so the existing for-loop processes text-type essays identically to PDF/image essays"
  - "Store read via useViewerStore.getState() (not hook) inside handleExport to avoid stale render-time closure on pageCanvases"

patterns-established:
  - "Export capture pattern: DOM node -> html-to-image canvas -> viewerStore.setPageCanvas -> existing export loop"
  - "Scoring page header: student.name | student.class_name | date (pt-BR) joined with ' | '"

requirements-completed: [EXP-01, EXP-02, EXP-03, EXP-04]

# Metrics
duration: ~15min
completed: 2026-03-28
---

# Phase 04 Plan 01: Export Upgrade Summary

**html-to-image capture of HTML text container registered into viewerStore, enabling annotations and error markers to overlay in PDF export for text-type essays; scoring page gains student name, class, and date header**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-28T22:46:00Z
- **Completed:** 2026-03-28T22:53:00Z
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files modified:** 3

## Accomplishments

- Text-type essays now export a full PDF with visible essay text on the first page (EXP-01)
- Freehand/arrow annotations and error markers overlay correctly on the text content page (EXP-02, EXP-03)
- Scoring page header shows student name, class name, and formatted date in pt-BR (EXP-04)
- Existing PDF-type and image-type essay exports are unaffected (regression-free)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install html-to-image and add text-container data attribute to TextRenderer** - `404366d` (feat)
2. **Task 2: Fix text-type export path in ExportPDFButton and enhance scoring page header** - `a1aee1a` (feat)
3. **Fix: Replace html2canvas with html-to-image for CSS lab() color support** - `d9e7eee` (fix)
4. **Task 3: Human verification** - approved by user (no commit — checkpoint)

## Files Created/Modified

- `src/components/essay/TextRenderer.tsx` - Added `data-essay-text-container="1"` to inner text div for export targeting
- `src/components/essay/ExportPDFButton.tsx` - Text-type capture branch (html-to-image), viewerStore registration, stale-closure fix, scoring page student/date header
- `package.json` - Added html-to-image dependency

## Decisions Made

- **html-to-image over html2canvas:** html2canvas does not render CSS `lab()` colors (outputs black). The app uses lab() in its design system. Switched to html-to-image after Task 2 verification caught the issue during the deviation auto-fix.
- **Capture at export time, not on mount:** Avoids capturing before text layout is stable (dynamic height from scrollHeight).
- **useViewerStore.getState() in for-loop:** The render-time destructured `pageCanvases` is stale after `setPageCanvas(1, captured)`. Reading directly from the store inside the loop ensures the just-registered canvas is visible.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced html2canvas with html-to-image to support CSS lab() colors**
- **Found during:** Task 2 (Fix text-type export path in ExportPDFButton) — surfaced during verification when captured canvas rendered text area as black
- **Issue:** html2canvas does not support CSS `color(display-p3 ...)` / `lab()` colors used by Tailwind's design system; text container background rendered as solid black in the exported PDF
- **Fix:** Installed html-to-image, replaced dynamic `import('html2canvas')` call with `import('html-to-image').toPng()`, updated capture approach to use `toPng` -> Image -> drawImage onto a 2D canvas registered in viewerStore
- **Files modified:** `package.json`, `package-lock.json`, `src/components/essay/ExportPDFButton.tsx`
- **Verification:** User visually confirmed full essay text visible in exported PDF during Task 3 human-verify checkpoint
- **Committed in:** `d9e7eee` (deviation fix commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Auto-fix was required for correctness — html2canvas would have produced black pages for all text-type essays. html-to-image is a drop-in substitute with broader CSS color support.

## Issues Encountered

- html2canvas incompatibility with CSS lab() / display-p3 colors was not identified during research phase. The issue only became visible when running the capture against real DOM content. Switching to html-to-image resolved it cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Text-type PDF export is fully functional with annotations, error markers, and enhanced scoring header
- html-to-image pattern is established for future capture needs
- Phase 04 Plan 01 requirements EXP-01 through EXP-04 all verified by user

---
*Phase: 04-export-upgrade*
*Completed: 2026-03-28*
