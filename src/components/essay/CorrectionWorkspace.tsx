'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAnnotationStore } from '@/stores/annotationStore'
import { useScoringStore } from '@/stores/scoringStore'
import { useErrorMarkerStore } from '@/stores/errorMarkerStore'
import { createClient } from '@/lib/supabase/client'
import { DocumentRenderer } from './DocumentRenderer'
import { AnnotationToolbar, AnnotationToolbarMobile } from '@/components/annotation/AnnotationToolbar'
import { ErrorMarkerToolbar } from '@/components/annotation/ErrorMarkerToolbar'
import { ScoringPanel } from '@/components/scoring/ScoringPanel'
import { AnnotationSidebar } from '@/components/annotation/AnnotationSidebar'
import { WorkspaceHeader } from './WorkspaceHeader'
import { OnboardingTour } from '@/components/onboarding/OnboardingTour'
import { FileText, BarChart2 } from 'lucide-react'
import type { Essay } from '@/types/essay'
import type { Annotation } from '@/types/annotation'
import type { ErrorMarker } from '@/types/error-marker'

interface Props {
  essay: Essay
  initialAnnotations: Annotation[]
  initialErrorMarkers: ErrorMarker[]
  canAiAnalysis: boolean
}

type MobileTab = 'document' | 'scoring'

export function CorrectionWorkspace({ essay, initialAnnotations, initialErrorMarkers, canAiAnalysis }: Props) {
  const { setAnnotations, undoAndGetRemovedIds, selectAnnotation, setTool } = useAnnotationStore()
  const { initFromEssay, isDirty, scores } = useScoringStore()
  const { setMarkers, isErrorMode, setIsErrorMode, setSelectedErrorCode } = useErrorMarkerStore()
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [activeDrawerTab, setActiveDrawerTab] = useState<'annotations' | 'notes'>(() => {
    if (typeof window === 'undefined') return 'notes'
    return (localStorage.getItem('littera_drawer_tab') as 'annotations' | 'notes') ?? 'notes'
  })
  const [mobileTab, setMobileTab] = useState<MobileTab>('document')

  // ── Initialise stores from server-loaded data ──────────────────────────────
  useEffect(() => {
    const byPage: Record<number, Annotation[]> = {}
    for (const ann of initialAnnotations) {
      const p = ann.page_number
      if (!byPage[p]) byPage[p] = []
      byPage[p].push(ann)
    }
    for (const [page, anns] of Object.entries(byPage)) {
      setAnnotations(Number(page), anns)
    }
  }, [initialAnnotations, setAnnotations])

  useEffect(() => {
    setMarkers(initialErrorMarkers)
  }, [initialErrorMarkers, setMarkers])

  useEffect(() => {
    initFromEssay({
      scores: {
        c1: essay.score_c1,
        c2: essay.score_c2,
        c3: essay.score_c3,
        c4: essay.score_c4,
        c5: essay.score_c5,
      },
      notes: {
        c1: essay.notes_c1 ?? '',
        c2: essay.notes_c2 ?? '',
        c3: essay.notes_c3 ?? '',
        c4: essay.notes_c4 ?? '',
        c5: essay.notes_c5 ?? '',
      },
      generalComment: essay.general_comment ?? '',
      aiAnalysis: essay.ai_analysis,
    })
  }, [essay, initFromEssay])

  // ── Warn before leaving with unsaved score changes ─────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if user is typing in an input or editable area
      const tag = (e.target as HTMLElement).tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement).isContentEditable
      ) return

      // Ctrl+Z / Cmd+Z — undo (also deletes undone annotations from DB)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        const removedIds = undoAndGetRemovedIds()
        if (removedIds.length > 0) {
          const supabase = createClient()
          supabase
            .from('annotations')
            .delete()
            .in('id', removedIds)
            .then(({ error }) => {
              if (error) console.error('[undo] failed to delete annotations from DB:', error.message)
            })
        }
        return
      }

      // Single-key tool shortcuts (no modifier)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'e':
            // Toggle error mode
            if (!isErrorMode) {
              setIsErrorMode(true)
              setTool('pan')
            } else {
              setIsErrorMode(false)
              setSelectedErrorCode(null)
            }
            break
          case 'd': setTool('freehand'); if (isErrorMode) { setIsErrorMode(false); setSelectedErrorCode(null) }; break
          case 't': setTool('textbox'); if (isErrorMode) { setIsErrorMode(false); setSelectedErrorCode(null) }; break
          case 'a': setTool('arrow');   if (isErrorMode) { setIsErrorMode(false); setSelectedErrorCode(null) }; break
          case 'v': setTool('pan');     if (isErrorMode) { setIsErrorMode(false); setSelectedErrorCode(null) }; break
          case 'h': setTool('highlight'); if (isErrorMode) { setIsErrorMode(false); setSelectedErrorCode(null) }; break
          case 'm': setTool('marker');  if (isErrorMode) { setIsErrorMode(false); setSelectedErrorCode(null) }; break
          case 'x': setTool('eraser');  if (isErrorMode) { setIsErrorMode(false); setSelectedErrorCode(null) }; break
          case 'escape': selectAnnotation(null); break
        }
      }
    },
    [undoAndGetRemovedIds, isErrorMode, setIsErrorMode, setSelectedErrorCode, setTool, selectAnnotation]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ── Drawer tab handler ─────────────────────────────────────────────────────
  function handleDrawerTabChange(tab: 'annotations' | 'notes') {
    setActiveDrawerTab(tab)
    if (typeof window !== 'undefined') {
      localStorage.setItem('littera_drawer_tab', tab)
    }
  }

  // ── Badge: competências sem nota ───────────────────────────────────────────
  const pendingScoreCount = [scores.c1, scores.c2, scores.c3, scores.c4, scores.c5]
    .filter(s => (s ?? 0) === 0).length

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <OnboardingTour />
      {/* Top bar */}
      <WorkspaceHeader
        essay={essay}
        onTogglePanel={() => setIsPanelOpen((v) => !v)}
        isPanelOpen={isPanelOpen}
      />

      {/* Horizontal error marker bar — hidden while essay hasn't been opened yet */}
      {essay.status !== 'pending' && <ErrorMarkerToolbar />}

      {/* ── Desktop layout ── */}
      <div className="hidden sm:flex flex-1 overflow-hidden">
        {/* Left: vertical annotation toolbar */}
        <AnnotationToolbar canEditText={essay.source_type === 'image' && !!essay.raw_text} />

        {/* Center: document */}
        <div
          className="flex-1 overflow-auto relative"
          style={{ background: 'var(--littera-parchment)' }}
        >
          <DocumentRenderer essay={essay} />
        </div>

        {/* Right: tabbed drawer */}
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{
            width: isPanelOpen ? 320 : 0,
            transition: 'width 200ms cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div
            className="flex flex-col h-full"
            style={{
              width: 320,
              borderLeft: isPanelOpen ? '1px solid var(--littera-dust)' : 'none',
              background: 'var(--littera-paper)',
              transform: isPanelOpen ? 'translateX(0)' : 'translateX(100%)',
              opacity: isPanelOpen ? 1 : 0,
              transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1), opacity 150ms ease',
            }}
          >
            {/* Drawer tab bar */}
            <div
              className="flex items-center flex-shrink-0 px-3 gap-1"
              style={{ height: 48, borderBottom: '1px solid var(--littera-dust)' }}
              role="tablist"
              aria-label="Painéis de trabalho"
            >
              {(['annotations', 'notes'] as const).map((tab) => {
                const isActive = activeDrawerTab === tab
                const label = tab === 'annotations' ? 'Anotações' : 'Notas'
                return (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleDrawerTabChange(tab)}
                    className="relative px-3 py-1.5 text-sm font-semibold rounded-md transition-colors"
                    style={{
                      color: isActive ? 'var(--littera-forest)' : 'var(--littera-slate)',
                    }}
                  >
                    {label}
                    {/* Underline indicator */}
                    <span
                      className="absolute bottom-0 left-3 right-3 rounded-full"
                      style={{
                        height: 2,
                        background: 'var(--littera-forest)',
                        transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                        transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1)',
                      }}
                    />
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              <div
                key={activeDrawerTab}
                className="h-full littera-fade-in"
              >
                {activeDrawerTab === 'annotations'
                  ? <AnnotationSidebar essayId={essay.id} />
                  : <ScoringPanel essay={essay} canAiAnalysis={canAiAnalysis} />
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="flex sm:hidden flex-col flex-1 overflow-hidden">
        {/* Mobile tab bar */}
        <div
          className="flex flex-shrink-0"
          style={{ borderBottom: '1px solid var(--littera-dust)' }}
        >
          {(
            [
              { key: 'document', label: 'Redação', icon: FileText },
              { key: 'scoring',  label: 'Notas',   icon: BarChart2 },
            ] as { key: MobileTab; label: string; icon: React.ElementType }[]
          ).map(({ key, label, icon: Icon }) => {
            const active = mobileTab === key
            return (
              <button
                key={key}
                onClick={() => setMobileTab(key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-all"
                style={
                  active
                    ? {
                        color: 'var(--littera-forest)',
                        borderBottom: '2px solid var(--littera-forest)',
                        background: 'var(--littera-forest-faint)',
                      }
                    : { color: 'var(--littera-slate)', background: 'var(--littera-paper)' }
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {key === 'scoring' && pendingScoreCount > 0 && (
                  <span
                    className="inline-flex items-center justify-center text-white font-bold rounded-full"
                    style={{
                      minWidth: 18,
                      height: 18,
                      fontSize: 11,
                      padding: '0 5px',
                      background: 'var(--littera-slate)',
                      lineHeight: 1,
                      marginLeft: 4,
                      transition: 'opacity 250ms ease, transform 250ms ease',
                    }}
                    aria-label={`${pendingScoreCount} competência${pendingScoreCount > 1 ? 's' : ''} sem nota`}
                  >
                    {pendingScoreCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Mobile: document tab */}
        {mobileTab === 'document' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Mini horizontal tool strip */}
            <AnnotationToolbarMobile canEditText={essay.source_type === 'image' && !!essay.raw_text} />
            {/* Document */}
            <div
              className="flex-1 overflow-auto relative"
              style={{ background: 'var(--littera-parchment)' }}
            >
              <DocumentRenderer essay={essay} />
            </div>
          </div>
        )}

        {/* Mobile: scoring tab */}
        {mobileTab === 'scoring' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Scoring panel full-width on mobile */}
            <div
              className="flex-1 overflow-hidden"
              style={{
                // Override the fixed desktop width so it fills the screen
                ['--scoring-panel-width' as string]: '100%',
              }}
            >
              <ScoringPanelMobileWrapper essay={essay} canAiAnalysis={canAiAnalysis} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Thin wrapper that renders ScoringPanel full-width on mobile.
 * The panel itself uses `w-80` which we need to override.
 */
function ScoringPanelMobileWrapper({ essay, canAiAnalysis }: { essay: Essay; canAiAnalysis: boolean }) {
  return (
    <div
      className="h-full overflow-hidden flex flex-col"
      style={{ width: '100%' }}
    >
      <ScoringPanel essay={essay} fullWidth canAiAnalysis={canAiAnalysis} />
    </div>
  )
}
