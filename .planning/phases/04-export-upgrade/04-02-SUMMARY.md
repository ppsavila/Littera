---
phase: 04-export-upgrade
plan: 02
subsystem: ui
tags: [supabase-storage, whatsapp, pdf-export, react, typescript]

# Dependency graph
requires:
  - phase: 04-export-upgrade/04-01
    provides: generatePdfBytes function refactored out of ExportPDFButton; text-type PDF export working
provides:
  - uploadExportedPdf helper (src/lib/export/uploadExportedPdf.ts) — uploads PDF to Supabase Storage, returns 7-day signed URL
  - WorkspaceHeader WhatsApp button generates full PDF, uploads to storage, and shares signed URL via wa.me
  - Graceful fallback: text-only wa.me message if upload fails
affects: [future-export-features, premium-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Extract shared PDF generation logic as named export (generatePdfBytes) so multiple callers can reuse the pipeline"
    - "Supabase Storage upload with RLS-compliant path prefix (userId/exports/...) + 7-day signed URL"
    - "Async button with loading state (sendingWA) and catch fallback for graceful degradation"

key-files:
  created:
    - src/lib/export/uploadExportedPdf.ts
  modified:
    - src/components/essay/ExportPDFButton.tsx
    - src/components/essay/WorkspaceHeader.tsx

key-decisions:
  - "Export path prefixed with userId (userId/exports/...) to satisfy Supabase Storage RLS policy that restricts writes to user-owned prefixes"
  - "PDF link formatted as plain ASCII 'PDF da correcao: {url}' (no emoji) to avoid wa.me character limit issues"
  - "Fallback behavior: if uploadExportedPdf returns null or throws, wa.me still opens with text-only summary — no crash"

patterns-established:
  - "generatePdfBytes as shared named export: other components needing PDF bytes import from ExportPDFButton without duplicating the rendering pipeline"
  - "Storage path convention: {userId}/exports/{essayId}-{timestamp}.pdf"

requirements-completed: [EXP-05]

# Metrics
duration: ~45min
completed: 2026-03-28
---

# Phase 4 Plan 02: WhatsApp PDF Sharing via Supabase Storage Summary

**Premium WhatsApp button now generates full corrected PDF, uploads to Supabase Storage, and includes a 7-day signed URL in the wa.me pre-filled message**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-03-28
- **Completed:** 2026-03-28
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files modified:** 3

## Accomplishments

- Created `uploadExportedPdf` helper that uploads PDF bytes to the `essays` Supabase Storage bucket and returns a 7-day signed URL
- Extracted `generatePdfBytes` as a named export from `ExportPDFButton.tsx` so WorkspaceHeader can reuse the full PDF rendering pipeline without duplication
- Upgraded WorkspaceHeader WhatsApp button from a static `<a href>` link to an async handler that generates PDF, uploads to storage, appends the signed URL to the WhatsApp message, and opens wa.me in a new tab
- Human verification confirmed end-to-end flow works: spinner shown during generation/upload, wa.me opens with signed PDF URL embedded in message text
- Direct "Exportar PDF" button still works independently (no regression from refactor)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create uploadExportedPdf helper and extract generatePdfBytes** - `14c6e6f` (feat)
2. **Task 2: Upgrade WorkspaceHeader WhatsApp button to share PDF URL** - `4f5feaf` (feat)
3. **Fix: Prefix export path with userId to satisfy storage RLS policy** - `728175f` (fix)
4. **Fix: Improve PDF link formatting in WhatsApp message** - `cbead1c` (fix)
5. **Task 3: Human verification approved** - checkpoint (no commit needed)

## Files Created/Modified

- `src/lib/export/uploadExportedPdf.ts` - Uploads PDF bytes to `essays` Supabase Storage bucket under `{userId}/exports/{essayId}-{ts}.pdf`, returns 7-day signed URL
- `src/components/essay/ExportPDFButton.tsx` - `generatePdfBytes` extracted as named async export; `handleExport` simplified to call it then trigger browser download
- `src/components/essay/WorkspaceHeader.tsx` - WhatsApp `<a>` replaced with async `<button>`; imports `generatePdfBytes` + `uploadExportedPdf`; `sendingWA` loading state; fallback to text-only on error

## Decisions Made

- **userId prefix in storage path:** Initial implementation used `exports/{essayId}-{ts}.pdf` but Supabase Storage RLS policy requires paths to start with the authenticated user's ID. Fixed by prefixing with `{userId}/exports/...`. (Rule 1 auto-fix during Task 2 verification)
- **Plain ASCII in wa.me link text:** PDF URL line uses `"PDF da correcao: {url}"` without emoji to avoid hitting wa.me's ~2000-character URL parameter limit, since the full message already includes emoji from `buildWhatsAppText`.
- **Graceful degradation pattern:** `handleWhatsApp` catch block sends text-only wa.me link instead of crashing, matching the plan's specified fallback requirement.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] RLS policy violation — storage path missing userId prefix**
- **Found during:** Task 2 (integration testing WhatsApp flow)
- **Issue:** Initial path `exports/{essayId}-{ts}.pdf` caused a storage upload RLS error because the bucket policy requires the path to begin with the authenticated user's UUID
- **Fix:** Changed path to `${userId}/exports/${essayId}-${Date.now()}.pdf` in `uploadExportedPdf.ts`; retrieved `userId` from `supabase.auth.getUser()` before upload
- **Files modified:** `src/lib/export/uploadExportedPdf.ts`
- **Verification:** Upload succeeded after fix; signed URL returned and opened correctly in browser
- **Committed in:** `728175f`

**2. [Rule 1 - Bug] PDF link text formatting issue in wa.me message**
- **Found during:** Task 2 (manual message review)
- **Issue:** PDF URL line used a formatting that could cause display issues or character count problems
- **Fix:** Simplified to plain ASCII `PDF da correcao: {url}` (no special characters or emoji)
- **Files modified:** `src/components/essay/WorkspaceHeader.tsx`
- **Committed in:** `cbead1c`

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correctness — storage upload would have silently failed without the userId prefix fix. No scope creep.

## Issues Encountered

- Supabase Storage RLS requires user-scoped path prefixes — the plan's example path `exports/{essayId}-{ts}.pdf` was not RLS-compliant. Discovered during first end-to-end test and fixed immediately.

## User Setup Required

None - no new external service configuration required. The `essays` Supabase Storage bucket already exists and was configured in a prior phase.

## Next Phase Readiness

- WhatsApp PDF sharing is complete and verified for Premium users
- `uploadExportedPdf` helper is available for any future feature requiring PDF storage (e.g., sharing via other channels, email attachments)
- Phase 04-export-upgrade has 2 plans: 04-01 (complete) and 04-02 (complete) — phase is fully done

---
*Phase: 04-export-upgrade*
*Completed: 2026-03-28*
