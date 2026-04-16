'use client'

import Link from 'next/link'
import { ArrowLeft, List, BarChart2, CheckCircle, Loader2, MessageCircle, Share2 } from 'lucide-react'
import { CorrectionResultModal } from './CorrectionResultModal'
import { useScoringStore } from '@/stores/scoringStore'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import { usePostHog } from 'posthog-js/react'
import type { Essay } from '@/types/essay'

interface Props {
  essay: Essay
  onToggleAnnotations: () => void
  showAnnotations: boolean
  onToggleScoring: () => void
  showScoring: boolean
}

export function WorkspaceHeader({ essay, onToggleAnnotations, showAnnotations, onToggleScoring, showScoring }: Props) {
  const { scores, notes, generalComment, markClean, isDirty, totalScore } = useScoringStore()
  const [saving, setSaving] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)
  const [resultModal, setResultModal] = useState<{
    shareUrl: string
    totalScore: number
  } | null>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()
  const posthog = usePostHog()

  // ── Auto-show result modal when opening a completed essay ────────────────────
  useEffect(() => {
    if (essay.status !== 'done') return
    const score = (essay.score_c1 ?? 0) + (essay.score_c2 ?? 0) + (essay.score_c3 ?? 0) +
                  (essay.score_c4 ?? 0) + (essay.score_c5 ?? 0)
    // Always call the share API — it's idempotent and ensures is_shared = true in the DB
    enableShare().then((shareUrl) => {
      if (shareUrl) setResultModal({ shareUrl, totalScore: score })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // only on mount

  // ── Enable sharing and return share URL ─────────────────────────────────────
  async function enableShare(): Promise<string | null> {
    try {
      const res = await fetch(`/api/essays/${essay.id}/share`, { method: 'POST' })
      if (!res.ok) return null
      const data = await res.json()
      return data.shareUrl ?? null
    } catch {
      return null
    }
  }

  // ── WhatsApp share (all tiers) ───────────────────────────────────────────────
  async function handleWhatsApp() {
    const shareUrl = await enableShare()
    const lines = [
      `📝 *Correção: ${essay.title}*`,
      essay.theme ? `Tema: ${essay.theme}` : '',
      '',
      shareUrl
        ? `🔗 Veja a correção completa:\n${shareUrl}`
        : `Nota final: ${totalScore()}/1000`,
    ].filter((l) => l !== '')
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank')
    posthog?.capture('export_triggered', { format: 'whatsapp' })
  }

  // ── Manual share button ──────────────────────────────────────────────────────
  async function handleShare() {
    const shareUrl = await enableShare()
    if (!shareUrl) return
    setResultModal({ shareUrl, totalScore: totalScore() })
    posthog?.capture('share_link_opened', { essay_id: essay.id })
  }

  // ── Autosave 3 s after any change ───────────────────────────────────────────
  useEffect(() => {
    if (!isDirty) return

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
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

      const { error } = await supabase
        .from('essays')
        .update(updatePayload)
        .eq('id', essay.id)

      if (!error) {
        markClean()
        setAutoSaved(true)
        setTimeout(() => setAutoSaved(false), 2500)
      }
    }, 3000)

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, scores, notes, generalComment])

  // ── Concluir (mark as done) ──────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)

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
          {/* Annotations toggle */}
          <button
            data-tour="annotations-btn"
            onClick={onToggleAnnotations}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={
              showAnnotations
                ? { background: 'var(--littera-forest-light)', color: 'var(--littera-forest)', border: '1px solid rgba(75,0,130,0.25)' }
                : { background: 'var(--littera-mist)', color: 'var(--littera-slate)', border: '1px solid var(--littera-dust)' }
            }
          >
            <List className="w-3.5 h-3.5" />
            Anotações
          </button>

          {/* Scoring toggle */}
          <button
            data-tour="scoring-btn"
            onClick={onToggleScoring}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={
              showScoring
                ? { background: 'var(--littera-forest-light)', color: 'var(--littera-forest)', border: '1px solid rgba(75,0,130,0.25)' }
                : { background: 'var(--littera-mist)', color: 'var(--littera-slate)', border: '1px solid var(--littera-dust)' }
            }
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Notas
          </button>

          {/* WhatsApp — free for all tiers */}
          <button
            onClick={handleWhatsApp}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: '#f0fdf4',
              color: '#16a34a',
              border: '1px solid #bbf7d0',
            }}
            title="Compartilhar correção pelo WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
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
