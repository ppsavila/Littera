'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAnnotationStore } from '@/stores/annotationStore'
import { useScoringStore } from '@/stores/scoringStore'
import { useErrorMarkerStore } from '@/stores/errorMarkerStore'
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
}

type MobileTab = 'document' | 'scoring'

export function CorrectionWorkspace({ essay, initialAnnotations, initialErrorMarkers }: Props) {
  const { setAnnotations, undo } = useAnnotationStore()
  const { initFromEssay } = useScoringStore()
  const { setMarkers } = useErrorMarkerStore()
  const [showAnnotationSidebar, setShowAnnotationSidebar] = useState(false)
  const [showScoringPanel, setShowScoringPanel] = useState(false)
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

  // ── Ctrl+Z / Cmd+Z keyboard shortcut for undo ─────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
    },
    [undo]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <OnboardingTour />
      {/* Top bar */}
      <WorkspaceHeader
        essay={essay}
        onToggleAnnotations={() => setShowAnnotationSidebar((v) => !v)}
        showAnnotations={showAnnotationSidebar}
        onToggleScoring={() => setShowScoringPanel((v) => !v)}
        showScoring={showScoringPanel}
      />

      {/* Horizontal error marker bar — visible on all screen sizes */}
      <ErrorMarkerToolbar />

      {/* ── Desktop layout ── */}
      <div className="hidden sm:flex flex-1 overflow-hidden">
        {/* Left: vertical annotation toolbar */}
        <AnnotationToolbar />

        {/* Center: document */}
        <div
          className="flex-1 overflow-auto relative"
          style={{ background: 'var(--littera-parchment)' }}
        >
          <DocumentRenderer essay={essay} />
        </div>

        {/* Right: annotation sidebar + scoring panel */}
        <div className="flex flex-shrink-0">
          {showAnnotationSidebar && <AnnotationSidebar essayId={essay.id} />}
          {showScoringPanel && <ScoringPanel essay={essay} />}
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
              </button>
            )
          })}
        </div>

        {/* Mobile: document tab */}
        {mobileTab === 'document' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Mini horizontal tool strip */}
            <AnnotationToolbarMobile />
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
              <ScoringPanelMobileWrapper essay={essay} />
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
function ScoringPanelMobileWrapper({ essay }: { essay: Essay }) {
  return (
    <div
      className="h-full overflow-hidden flex flex-col"
      style={{ width: '100%' }}
    >
      <ScoringPanel essay={essay} fullWidth />
    </div>
  )
}
