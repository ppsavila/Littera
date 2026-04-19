---
phase: 03-annotation-ux
plan: 03-03
subsystem: annotation
tags: [performance, keyboard-shortcuts, optimistic-ui, freehand-drawing]
dependency_graph:
  requires: ["03-01"]
  provides: [optimistic-annotation-save, ref-based-freehand, keyboard-shortcuts]
  affects: [AnnotationCanvas, annotationStore, CorrectionWorkspace, AnnotationToolbar]
tech_stack:
  added: []
  patterns: [optimistic-ui, useRef-for-hot-path, keyboard-shortcut-handler]
key_files:
  created: []
  modified:
    - src/stores/annotationStore.ts
    - src/components/annotation/AnnotationCanvas.tsx
    - src/components/essay/CorrectionWorkspace.tsx
    - src/components/annotation/AnnotationToolbar.tsx
decisions:
  - replaceAnnotation does not push to undo history — swapping a tempId for a real DB id is not a user action worth undoing
  - freehand preview updates every 8 points (mod 8 check) to balance visual feedback vs render frequency
  - Keyboard guard checks tagName (INPUT/TEXTAREA) + isContentEditable to cover both native inputs and the inline text editor from 03-02
metrics:
  duration: "~2 minutes"
  completed: "2026-03-28"
  tasks: 2
  files: 4
---

# Phase 03 Plan 03: Performance Optimizations and Keyboard Shortcuts Summary

**One-liner:** useRef-based freehand accumulation, optimistic Supabase saves with rollback, and E/D/T/A/V/H/M/X keyboard shortcuts for annotation tools.

## What Was Built

### Task 1: replaceAnnotation + optimistic saveAnnotation + ref-based freehand

**annotationStore.ts:**
- Added `replaceAnnotation(tempId, real, page)` action that swaps a temporary annotation (by id) with the server-returned one — no undo history push, since this is an internal id swap not a user action.

**AnnotationCanvas.tsx:**
- `saveAnnotation` now constructs an optimistic `Annotation` with `crypto.randomUUID()` as tempId, calls `addAnnotation` immediately (zero-latency feedback), then fires the Supabase insert in the background. On success calls `replaceAnnotation`; on failure calls `removeAnnotation` (rollback).
- Added `pointsRef = useRef<number[]>([])` for freehand point accumulation. During `handleMouseMove`, points are pushed to the ref (no React setState per pixel). React preview state is updated only every 8 coordinates (4 points). On `handleMouseUp`, `pointsRef.current` is used instead of `drawing.currentPoints`.
- `pointsRef.current = []` reset on `handleMouseDown` and after each freehand commit.

### Task 2: Keyboard shortcuts + toolbar label updates

**CorrectionWorkspace.tsx:**
- `handleKeyDown` extended with INPUT/TEXTAREA/contentEditable guard, then single-key tool shortcuts: `e` toggles error mode (consistent with `handleToggleErrorMode`), `d`→freehand, `t`→textbox, `a`→arrow, `v`→pan, `h`→highlight, `m`→marker, `x`→eraser, `Escape`→deselect annotation.
- When a tool key is pressed while error mode is active, error mode is exited first.
- `useCallback` dependencies updated to include all new store actions.

**AnnotationToolbar.tsx:**
- TOOLS array: freehand shortcut changed `P`→`D` (Desenho), eraser shortcut changed `E`→`X`.
- Error mode button title updated to `"Marcar erros (E)"` in both desktop and mobile toolbar.

## Verification

- TypeScript compiles clean for all plan files (pre-existing test TS errors in `__tests__/` are out of scope)
- `grep replaceAnnotation src/stores/annotationStore.ts` → 2 lines (interface + implementation)
- `grep pointsRef src/components/annotation/AnnotationCanvas.tsx` → 7 lines
- `grep tempId src/components/annotation/AnnotationCanvas.tsx` → 4 lines
- `grep "shortcut: 'X'" src/components/annotation/AnnotationToolbar.tsx` → 1 line (eraser)
- `grep "e.key.toLowerCase" src/components/essay/CorrectionWorkspace.tsx` → 1 line
- `grep setIsErrorMode src/components/essay/CorrectionWorkspace.tsx` → 6+ lines

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `8d27e21` | feat(03-03): optimistic saveAnnotation + ref-based freehand drawing |
| 2 | `a98d382` | feat(03-03): keyboard shortcuts + fix toolbar shortcut labels |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all changes are behavioral/performance improvements with no placeholder data.

## Self-Check: PASSED

- `src/stores/annotationStore.ts` — exists with `replaceAnnotation`
- `src/components/annotation/AnnotationCanvas.tsx` — exists with `pointsRef` and `tempId`
- `src/components/essay/CorrectionWorkspace.tsx` — exists with `e.key.toLowerCase()`
- `src/components/annotation/AnnotationToolbar.tsx` — exists with `shortcut: 'X'`
- Commits `8d27e21` and `a98d382` present in git log
