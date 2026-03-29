---
phase: 04-export-upgrade
verified: 2026-03-28T23:30:00Z
status: human_needed
score: 7/7 must-haves verified
re_verification: false
human_verification:
  - test: "Open a text-type essay, add annotation + error marker, click Exportar PDF"
    expected: "Downloaded PDF first page shows full essay text with annotation overlay and error marker badge; scoring page header shows student name, class, and date in pt-BR format"
    why_human: "html-to-image DOM capture requires a live browser with rendered text layout; canvas overlay composition and PDF rendering cannot be asserted programmatically without running the app"
  - test: "Open any corrected essay as a Premium user (canWhatsApp=true), click WhatsApp button"
    expected: "Button shows Enviando... spinner; wa.me opens in new tab with score summary text AND a Supabase signed URL (https://...) for the PDF; PDF URL is downloadable"
    why_human: "Supabase Storage upload requires live auth session and network; wa.me redirect is a browser-side window.open — neither is testable without running the app"
  - test: "Click Exportar PDF on a PDF-type or image-type essay (regression check)"
    expected: "PDF downloads normally with annotations and error markers; no errors in console"
    why_human: "Regression requires visual inspection of the exported PDF content against a known reference"
---

# Phase 04: Export Upgrade Verification Report

**Phase Goal:** O PDF entregue ao aluno representa fielmente a correção do professor.
**Verified:** 2026-03-28T23:30:00Z
**Status:** human_needed (all automated checks passed; 3 items require live browser testing)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Text-type essay export produces a PDF with the full essay text visible on the first page | ? HUMAN NEEDED | `generatePdfBytes` in ExportPDFButton.tsx (line 349–362) captures `[data-essay-text-container="1"]` via `html-to-image` `toCanvas` and registers it in viewerStore; the for-loop then processes it identically to PDF/image pages. Correct by code — requires live browser to confirm rendering |
| 2 | Error markers appear overlaid on the text content page in the exported PDF | ? HUMAN NEEDED | `drawMarkersOnCanvas` (line 140–167) is called in the for-loop (line 388) for all page types including text-type after capture is registered. Correct by code — requires live PDF inspection |
| 3 | Canvas annotations appear overlaid on the text content page in the exported PDF | ? HUMAN NEEDED | `drawAnnotationsOnCanvas` (line 53–121) is called in the for-loop (line 385) for all page types. Correct by code — requires live PDF inspection |
| 4 | Scoring page includes student name, class, and date in the header section | ✓ VERIFIED | `buildScoringPage` (ExportPDFButton.tsx line 246–253): `essay.student?.name`, `essay.student?.class_name`, `toLocaleDateString('pt-BR', ...)` joined with `|` separator and drawn at `{x: M, y, font, size: 10, color: slate}` |
| 5 | Premium user clicking WhatsApp button triggers PDF generation, upload, and opens wa.me link with PDF URL in the pre-filled text | ? HUMAN NEEDED | `handleWhatsApp` (WorkspaceHeader.tsx line 65–86): calls `generatePdfBytes`, then `uploadExportedPdf`, appends signed URL to message text, calls `window.open(wa.me...)`. Correct by code — requires live browser + Supabase session |
| 6 | The wa.me link contains a Supabase signed URL pointing to the uploaded PDF | ? HUMAN NEEDED | `uploadExportedPdf` (line 26–30) calls `supabase.storage.from('essays').createSignedUrl(path, 604800)` and returns `data?.signedUrl`; WorkspaceHeader appends it to the message. Correct by code — requires live Supabase verification |
| 7 | Non-premium users do not see the WhatsApp button (existing gate preserved) | ✓ VERIFIED | WorkspaceHeader.tsx line 227: `{canWhatsApp && (<button ...>)}` — button is conditionally rendered on the `canWhatsApp` prop, which is the existing premium gate |

**Score:** 7/7 truths verified (5 require human confirmation of runtime behavior)

---

## Required Artifacts

### Plan 04-01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/essay/TextRenderer.tsx` | `data-essay-text-container` attribute on inner text div | ✓ VERIFIED | Line 70: `data-essay-text-container="1"` on the inner div with `ref={handleContainerRef}`. Outer wrapper retains `data-essay-page="1"` unchanged |
| `src/components/essay/ExportPDFButton.tsx` | Text-type export branch using html-to-image + enhanced scoring page header | ✓ VERIFIED | Lines 347–399: `html-to-image` branch present, `toCanvas` import, stale-closure fix via `useViewerStore.getState().pageCanvases[i]` in for-loop. Scoring header at lines 245–253 |

### Plan 04-02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/export/uploadExportedPdf.ts` | Supabase Storage upload helper returning 7-day signed URL | ✓ VERIFIED | File exists. Exports `uploadExportedPdf(essayId, pdfBytes)`. Path: `${user.id}/exports/${essayId}-${Date.now()}.pdf`. Uses `createSignedUrl(path, 60*60*24*7)` |
| `src/components/essay/WorkspaceHeader.tsx` | Async WhatsApp handler that generates PDF, uploads, and opens wa.me with PDF URL | ✓ VERIFIED | `handleWhatsApp` (lines 65–86): calls `generatePdfBytes`, `uploadExportedPdf`, builds message with URL, calls `window.open(wa.me...)`. Includes catch fallback to text-only |

---

## Key Link Verification

### Plan 04-01 Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `ExportPDFButton.tsx` | `html-to-image` | dynamic import in `generatePdfBytes` for text-type essays | ✓ WIRED | Line 352: `const { toCanvas } = await import('html-to-image')` |
| `ExportPDFButton.tsx` | `src/stores/viewerStore.ts` | `pageCanvases` registry | ✓ WIRED | Line 348: `useViewerStore.getState()` reads `pageCanvases`; line 361: `setPageCanvas(1, captured)` writes; line 366: for-loop reads `useViewerStore.getState().pageCanvases[i]` (stale-closure fix) |

### Plan 04-02 Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `WorkspaceHeader.tsx` | `src/lib/export/uploadExportedPdf.ts` | import and call in `handleWhatsApp` | ✓ WIRED | Line 6: `import { uploadExportedPdf } from '@/lib/export/uploadExportedPdf'`; line 72: `uploadExportedPdf(essay.id, bytes)` |
| `src/lib/export/uploadExportedPdf.ts` | `@supabase/supabase-js` | `supabase.storage.from('essays').upload + createSignedUrl` | ✓ WIRED | Lines 17–19: `.upload(path, pdfBytes, ...)`, lines 26–30: `.createSignedUrl(path, 604800)` |
| `WorkspaceHeader.tsx` | `ExportPDFButton.tsx` | shared `generatePdfBytes` named export | ✓ WIRED | Line 5: `import { ExportPDFButton, generatePdfBytes } from './ExportPDFButton'`; line 69: `generatePdfBytes(essay, scores, ...)` |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `ExportPDFButton.tsx` (scoring page) | `essay.student?.name`, `essay.student?.class_name` | Props from parent (`essay` object); populated by Supabase query joining `students` table (from prior phase) | Yes — direct property access on `essay.student` with optional chaining; falls back gracefully to null | ✓ FLOWING |
| `ExportPDFButton.tsx` (text capture) | `textEl` (DOM node) | `document.querySelector('[data-essay-text-container="1"]')` — live DOM in browser | Yes — queries live rendered DOM; guarded by `if (textEl)` | ✓ FLOWING (runtime) |
| `uploadExportedPdf.ts` | `pdfBytes` | Passed by caller (`generatePdfBytes` return value) | Yes — `Uint8Array` from `pdf.save()` | ✓ FLOWING |
| `WorkspaceHeader.tsx` | `pdfUrl` | Return value of `uploadExportedPdf` which calls `createSignedUrl` | Yes — Supabase signed URL; guarded by ternary if null | ✓ FLOWING (runtime) |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED for DOM-dependent behavior (html-to-image, PDF generation, Supabase Storage upload). These require a live browser with rendered DOM and an authenticated Supabase session. Only the scoring page student info can be checked statically, which was verified directly in the source code.

| Behavior | Check Type | Result | Status |
|----------|------------|--------|--------|
| `html-to-image` module installed in node_modules | File existence | `node_modules/html-to-image/dist/html-to-image.js` exists | ✓ PASS |
| TypeScript compilation — source files | `npx tsc --noEmit` | 0 errors in source files (2 errors in `.next/dev/types/` auto-generated files only) | ✓ PASS |
| All 7 commits from summaries exist in git history | `git log` | `404366d`, `a1aee1a`, `d9e7eee`, `14c6e6f`, `4f5feaf`, `728175f`, `cbead1c` all present | ✓ PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| EXP-01 | 04-01 | PDF exportado inclui o texto completo da redação | ✓ SATISFIED | `generatePdfBytes`: html-to-image captures `[data-essay-text-container="1"]` and registers canvas in viewerStore; for-loop embeds it as first PDF page |
| EXP-02 | 04-01 | PDF exportado inclui marcações de erro visíveis no texto | ✓ SATISFIED | `drawMarkersOnCanvas` called per page in for-loop; renders highlight rects + competency badge overlays |
| EXP-03 | 04-01 | PDF exportado inclui anotações do canvas (desenhos, setas, texto) | ✓ SATISFIED | `drawAnnotationsOnCanvas` called per page in for-loop; handles freehand, arrow, highlight, marker, textbox annotation types |
| EXP-04 | 04-01 | Layout do PDF formatado e legível para o aluno | ✓ SATISFIED | `buildScoringPage`: student name, class_name, pt-BR date drawn in header; structured competency rows with score bars, notes, and general comment section |
| EXP-05 | 04-02 | (Premium) Envio do PDF diretamente pelo WhatsApp | ✓ SATISFIED | `handleWhatsApp` generates PDF bytes, uploads to Supabase Storage, appends signed URL to wa.me message text; gated by `canWhatsApp` prop |

**No orphaned requirements.** All 5 EXP requirements declared in plan frontmatter are accounted for and satisfied by code evidence.

---

## Anti-Patterns Found

No blockers or warnings found.

| File | Pattern | Severity | Notes |
|------|---------|----------|-------|
| — | — | — | Scanned all 4 modified files for TODO/FIXME/placeholder/stub patterns; none found |

One deviation noted in SUMMARY: `html2canvas` remains in `package.json` as a residual dependency (still listed at `^1.4.1`). The runtime path uses `html-to-image` exclusively; html2canvas is never imported in source. This is a minor cleanup item but does not affect correctness.

---

## Human Verification Required

### 1. Text-Type PDF Export — Full Content with Overlays

**Test:** Open a text-type essay (`source_type = 'text'`) in the app. Add at least one freehand annotation and one error marker. Click "Exportar PDF".
**Expected:** The downloaded PDF first page shows the full essay text rendered with the serif font and paragraph layout. The annotation stroke and the error marker highlight/badge are overlaid on top of the text. The scoring summary page header shows the student's name, class name, and today's date in DD/MM/YYYY format.
**Why human:** html-to-image DOM capture, canvas compositing, and PDF rendering are browser-only operations. The correctness of the visual output (text visible, overlays positioned correctly) cannot be asserted without running the app.

### 2. WhatsApp PDF Sharing — Premium User End-to-End

**Test:** Log in as a Premium user (`canWhatsApp = true`). Open any corrected essay. Click the "WhatsApp" button in the workspace header.
**Expected:** (a) Button shows "Enviando..." with a spinner while generating/uploading. (b) A wa.me tab opens with a pre-filled message containing the competency score summary AND a line starting with "PDF da correcao: https://..." containing a valid Supabase signed URL. (c) Pasting the URL in a browser downloads a readable PDF matching the one from "Exportar PDF".
**Why human:** Supabase Storage upload requires a live authenticated session and network call. `window.open(wa.me...)` is a browser-side side effect. Neither is testable programmatically without running the full stack.

### 3. Fallback Behavior — WhatsApp with Storage Failure

**Test:** Simulate a Supabase Storage failure (e.g., temporarily break network or use an invalid bucket name). Click the WhatsApp button.
**Expected:** Button still opens wa.me with the text-only score summary. No crash, no error modal.
**Why human:** Requires deliberate network/config manipulation to trigger the catch branch.

### 4. Regression — PDF/Image-Type Essay Export

**Test:** Open a PDF-type or image-type essay (not text-type). Click "Exportar PDF".
**Expected:** PDF downloads correctly with all annotation overlays and error markers. No console errors. No change in behavior from before Phase 04.
**Why human:** Requires visual inspection of exported PDF against existing baseline behavior.

---

## Gaps Summary

No gaps found. All 7 must-have truths are satisfied at the code level (existence, substance, wiring, and data flow). The 4 items flagged for human verification are not gaps — the code is correctly implemented — but the runtime behaviors (DOM capture, PDF rendering, Supabase upload, browser navigation) cannot be fully asserted without running the application in a browser.

The only minor cleanup item is the residual `html2canvas` entry in `package.json` (replaced by `html-to-image` during the deviation fix). It is inert at runtime but represents a stale dependency that could be removed in a future cleanup pass.

---

_Verified: 2026-03-28T23:30:00Z_
_Verifier: Claude (gsd-verifier)_
