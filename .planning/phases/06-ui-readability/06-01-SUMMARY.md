---
phase: 06-ui-readability
plan: 01
subsystem: ui
tags: [css, typography, wcag, accessibility, design-system, tailwind]

# Dependency graph
requires: []
provides:
  - "Global typography scale (10 tokens: 12px–60px) via CSS custom properties"
  - "8px-grid spacing tokens (--littera-space-1 through --littera-space-12)"
  - "--littera-slate-dark (#475569) for WCAG AA contrast on parchment/white backgrounds"
  - "html/body font-size 16px with line-height 1.65"
  - ".littera-btn:focus-visible and a:focus-visible outline rules (D-11)"
  - "ClayButton touch targets increased (md: py-3, lg: py-3.5 text-base)"
  - "ClayCard default padding increased to p-6 (24px)"
  - "Header: px-6 py-4 spacing, minHeight 60, text-lg title, contrast-safe colors"
  - "Sidebar: height 60 logo row, contrast-safe inactive nav and footer text"
affects: [06-02, 06-03, all ui phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS custom property typography scale (--littera-text-*) for token-driven font sizing"
    - "CSS custom property spacing scale (--littera-space-*) on 8px grid"
    - "--littera-slate-dark as AA-compliant replacement for --littera-slate on body text"
    - ":focus-visible on .littera-btn base class propagates to all button variants"

key-files:
  created: []
  modified:
    - src/app/globals.css
    - src/components/ui/ClayButton.tsx
    - src/components/ui/ClayCard.tsx
    - src/components/ui/ClayInput.tsx
    - src/components/layout/Header.tsx
    - src/components/layout/Sidebar.tsx

key-decisions:
  - "Typography tokens defined as CSS custom properties in :root — component-level classes (text-sm, text-base) remain but now reference tokens via .littera-* classes"
  - "Used --littera-slate-dark (#475569, ~5.5:1 on parchment) instead of modifying --littera-slate to preserve existing usages (e.g., placeholder, icon hints)"
  - ":focus-visible placed on .littera-btn base class so all variants (primary, gold, outline, ghost) inherit the outline without per-variant rules"

patterns-established:
  - "Typography scale: use --littera-text-* tokens for all font-size declarations in design system CSS"
  - "Spacing scale: use --littera-space-* tokens for padding/margin in design system CSS"
  - "Contrast: use --littera-slate-dark for body/secondary text on parchment or white backgrounds; --littera-slate only for placeholder/hint text"
  - "Focus states: .littera-btn:focus-visible and a:focus-visible provide universal keyboard navigation affordance"

requirements-completed: [UI-01, UI-02, UI-03]

# Metrics
duration: 2min
completed: 2026-04-09
---

# Phase 06 Plan 01: Typography, Spacing & Contrast Foundation Summary

**Global typography scale (12–60px), 8px spacing grid, WCAG AA contrast tokens, and focus-visible keyboard states applied across the Littera design system**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-09T21:00:05Z
- **Completed:** 2026-04-09T21:02:46Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Defined 10-step typography scale and 8-step spacing grid as CSS custom properties in globals.css
- Body text now defaults to 16px with 1.65 line-height; badge minimum raised to 12px; input font raised to 16px
- All text on parchment and white backgrounds now passes WCAG AA via --littera-slate-dark (#475569)
- All buttons and links have visually distinct :focus-visible outlines using the Forest brand color
- ClayButton touch targets enlarged (md: py-3, lg: py-3.5 text-base); ClayCard padding increased to 24px
- Header and Sidebar height aligned at 60px; spacing and contrast updated throughout

## Task Commits

Each task was committed atomically:

1. **Task 1: Typography scale + spacing tokens + contrast fixes + focus states in globals.css** - `ccef85d` (feat)
2. **Task 2: Update Clay* components and dashboard layout for spacing and contrast** - `c2efa37` (feat)

**Plan metadata:** committed with docs entry below

## Files Created/Modified
- `src/app/globals.css` - Typography/spacing tokens, --littera-slate-dark, :focus-visible rules, 16px body/input, 12px badge
- `src/components/ui/ClayButton.tsx` - Larger touch targets (sm py-2, md px-5 py-3, lg py-3.5 text-base)
- `src/components/ui/ClayCard.tsx` - Default padding increased from p-5 to p-6 (24px)
- `src/components/ui/ClayInput.tsx` - Label gains tracking-wide for readability
- `src/components/layout/Header.tsx` - px-6 py-4, minHeight 60, text-lg title, slate-dark for email and sign-out
- `src/components/layout/Sidebar.tsx` - Logo row height 60, inactive nav uses slate-dark, footer uses slate-dark

## Decisions Made
- Used --littera-slate-dark (#475569) as a new additive token rather than modifying --littera-slate, preserving existing placeholder/hint text contrast intent
- :focus-visible placed on the .littera-btn base class so all button variants inherit the outline without per-variant duplication
- Typography tokens follow a CSS custom property pattern (--littera-text-*) so Tailwind utility classes (text-sm, text-base) continue to work alongside the new tokens

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - build passed on first attempt after all changes were applied.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Typography foundation is in place; Phase 06-02 can apply the scale to headings and page-level components
- --littera-slate-dark is available for any future components that render secondary text on parchment or white
- :focus-visible rules cover all buttons and links globally — no per-component keyboard focus work needed

---
*Phase: 06-ui-readability*
*Completed: 2026-04-09*
