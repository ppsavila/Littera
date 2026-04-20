'use client'

import Link from 'next/link'
import { ArrowLeft, PanelRight, CheckCircle, Loader2, Share2 } from 'lucide-react'
import { CorrectionResultModal } from './CorrectionResultModal'
import { useScoringStore } from '@/stores/scoringStore'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import { usePostHog } from 'posthog-js/react'
import { useAutoSave } from '@/hooks/useAutoSave'
import type { Essay } from '@/types/essay'

interface Props {
  essay: Essay
  onTogglePanel: () => void
  isPanelOpen: boolean
}

export function WorkspaceHeader({ essay, onTogglePanel, isPanelOpen }: Props) {
  const { scores, notes, generalComment, markClean, isDirty, totalScore } = useScoringStore()
  const [saving, setSaving] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)
  const [resultModal, setResultModal] = useState<{
    shareUrl: string
    totalScore: number
  } | null>(null)
  const cachedShareUrl = useRef<string | null>(null)
  const supabase = createClient()
  const posthog = usePostHog()

  // ── Enable sharing — cached after first call (API is idempotent) ─────────────
  async function enableShare(): Promise<string | null> {
    if (cachedShareUrl.current) return cachedShareUrl.current
    try {
      const res = await fetch(`/api/essays/${essay.id}/share`, { method: 'POST' })
      if (!res.ok) return null
      const data = await res.json()
      cachedShareUrl.current = data.shareUrl ?? null
      return cachedShareUrl.current
    } catch {
      return null
    }
  }

  // ── Auto-show result modal when opening a completed essay ────────────────────
  useEffect(() => {
    if (essay.status !== 'done') return
    const score = (essay.score_c1 ?? 0) + (essay.score_c2 ?? 0) + (essay.score_c3 ?? 0) +
                  (essay.score_c4 ?? 0) + (essay.score_c5 ?? 0)
    enableShare().then((shareUrl) => {
      if (shareUrl) setResultModal({ shareUrl, totalScore: score })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // only on mount

  // ── Manual share button ──────────────────────────────────────────────────────
  async function handleShare() {
    const shareUrl = await enableShare()
    if (!shareUrl) return
    setResultModal({ shareUrl, totalScore: totalScore() })
    posthog?.capture('share_link_opened', { essay_id: essay.id })
  }

  // ── Autosave 3 s after any change ───────────────────────────────────────────
  const { cancelPending } = useAutoSave({
    isDirty,
    deps: [scores, notes, generalComment],
    delayMs: 3000,
    onSave: async () => {
      const updatePayload: Record<string, unknown> = {
        score_c1: scores.c1,
        score_c2: scores.c2,
        score_c3: scores.c3,
        score_c4: scores.c4,
        score_c5: scores.c5,
        notes_c1: notes.c1 || null,
        notes_c2: notes.c2 || null,
        notes_c3: notes.c3 || null,
        notes_c4: notes.c4 || null,
        notes_c5: notes.c5 || null,
        general_comment: generalComment || null,
      }
      if (essay.status === 'pending' || essay.status === 'analyzed') {
        updatePayload.status = 'correcting'
      }
      const { error } = await supabase.from('essays').update(updatePayload).eq('id', essay.id)
      if (!error) {
        markClean()
        setAutoSaved(true)
        setTimeout(() => setAutoSaved(false), 2500)
      }
    },
  })

  // ── Concluir (mark as done) ──────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    cancelPending()

    const [saveResult, shareUrl] = await Promise.all([
      supabase
        .from('essays')
        .update({
          score_c1: scores.c1,
          score_c2: scores.c2,
          score_c3: scores.c3,
          score_c4: scores.c4,
          score_c5: scores.c5,
          notes_c1: notes.c1 || null,
          notes_c2: notes.c2 || null,
          notes_c3: notes.c3 || null,
          notes_c4: notes.c4 || null,
          notes_c5: notes.c5 || null,
          general_comment: generalComment || null,
          status: 'done',
        })
        .eq('id', essay.id),
      enableShare(),
    ])

    setSaving(false)

    if (!saveResult.error) {
      markClean()
      posthog?.capture('essay_completed', { total_score: totalScore() })
      setResultModal({ shareUrl: shareUrl ?? '', totalScore: totalScore() })
    }
  }

  return (
    <>
      <header
        className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0 sticky top-0 z-[60]"
        style={{
          background: 'var(--littera-paper)',
          borderBottom: '1px solid var(--littera-dust)',
          minHeight: 52,
        }}
      >
        {/* Back */}
        <Link
          href="/essays"
          className="flex items-center gap-1 text-sm font-medium transition-colors flex-shrink-0"
          style={{ color: 'var(--littera-slate)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Voltar</span>
        </Link>

        {/* Divider */}
        <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--littera-dust)' }} />

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1
            className="text-sm font-semibold truncate"
            style={{ color: 'var(--littera-ink)', fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            {essay.title}
          </h1>
          {essay.theme && (
            <p className="text-xs truncate" style={{ color: 'var(--littera-slate)' }}>
              {essay.theme}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Panel toggle */}
          <button
            data-tour="panel-btn"
            onClick={onTogglePanel}
            aria-expanded={isPanelOpen}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={
              isPanelOpen
                ? { background: 'var(--littera-forest-light)', color: 'var(--littera-forest)', border: '1px solid rgba(75,0,130,0.25)' }
                : { background: 'var(--littera-mist)', color: 'var(--littera-slate)', border: '1px solid var(--littera-dust)' }
            }
          >
            <PanelRight className="w-3.5 h-3.5" />
            Painel
          </button>

          {/* Share link */}
          <button
            onClick={handleShare}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'var(--littera-mist)',
              color: 'var(--littera-slate)',
              border: '1px solid var(--littera-dust)',
            }}
            title="Compartilhar link da correção"
          >
            <Share2 className="w-3.5 h-3.5" />
            Compartilhar
          </button>

          {/* Autosave indicator */}
          {autoSaved && !isDirty && (
            <span className="hidden sm:flex items-center gap-1 text-xs" style={{ color: 'var(--littera-sage)' }}>
              <CheckCircle className="w-3 h-3" />
              Salvo
            </span>
          )}

          {/* Save (mark as done) */}
          <button
            data-tour="save-btn"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: isDirty ? 'var(--littera-forest)' : 'var(--littera-forest-light)',
              color: isDirty ? '#fff' : 'var(--littera-forest)',
              border: '1px solid transparent',
              opacity: saving || !isDirty ? (saving ? 1 : 0.7) : 1,
              cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            {saving ? 'Salvando...' : isDirty ? 'Concluir' : 'Concluído'}
          </button>
        </div>
      </header>

      {/* Result modal after completing correction */}
      {resultModal && (
        <CorrectionResultModal
          essay={essay}
          totalScore={resultModal.totalScore}
          shareUrl={resultModal.shareUrl}
          onClose={() => setResultModal(null)}
        />
      )}
    </>
  )
}
