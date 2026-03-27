'use client'

import Link from 'next/link'
import { ArrowLeft, List, BarChart2, CheckCircle, Loader2, MessageCircle } from 'lucide-react'
import { ExportPDFButton } from './ExportPDFButton'
import { useScoringStore } from '@/stores/scoringStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import type { Essay } from '@/types/essay'

interface Props {
  essay: Essay
  onToggleAnnotations: () => void
  showAnnotations: boolean
  onToggleScoring: () => void
  showScoring: boolean
  canWhatsApp: boolean
}

type CompScores = { c1: number | null; c2: number | null; c3: number | null; c4: number | null; c5: number | null }
type CompNotes  = { c1: string; c2: string; c3: string; c4: string; c5: string }

function buildWhatsAppText(essay: Essay, scores: CompScores, notes: CompNotes, generalComment: string): string {
  const COMP_LABELS = ['Domínio da norma culta', 'Compreensão da proposta', 'Sel. e organização', 'Coesão textual', 'Proposta de intervenção']
  const total = (scores.c1 ?? 0) + (scores.c2 ?? 0) + (scores.c3 ?? 0) + (scores.c4 ?? 0) + (scores.c5 ?? 0)
  const compScores = [scores.c1, scores.c2, scores.c3, scores.c4, scores.c5]
  const compNotes = [notes.c1, notes.c2, notes.c3, notes.c4, notes.c5]

  const lines = [
    `📝 *Correção: ${essay.title}*`,
    essay.theme ? `Tema: ${essay.theme}` : '',
    '',
    `*Nota final: ${total}/1000*`,
    '',
    '*Por competência:*',
    ...COMP_LABELS.map((label, i) => {
      const score = compScores[i] ?? '—'
      const note = compNotes[i]?.trim()
      return `C${i + 1} (${label}): *${score}/200*${note ? ` — ${note}` : ''}`
    }),
    '',
    generalComment.trim() ? `*Comentário geral:*\n${generalComment.trim()}` : '',
  ].filter((l) => l !== '')

  return lines.join('\n')
}

export function WorkspaceHeader({ essay, onToggleAnnotations, showAnnotations, onToggleScoring, showScoring, canWhatsApp }: Props) {
  const { scores, notes, generalComment, markClean, isDirty } = useScoringStore()
  const [saving, setSaving] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()
  const router = useRouter()

  // Autosave scoring data 3 seconds after any change
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

  async function handleSave() {
    setSaving(true)
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    const { error } = await supabase
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
      .eq('id', essay.id)

    setSaving(false)
    if (!error) {
      markClean()
      router.refresh()
    }
  }

  return (
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
              ? { background: 'var(--littera-forest-light)', color: 'var(--littera-forest)', border: '1px solid rgba(26,77,58,0.25)' }
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
              ? { background: 'var(--littera-forest-light)', color: 'var(--littera-forest)', border: '1px solid rgba(26,77,58,0.25)' }
              : { background: 'var(--littera-mist)', color: 'var(--littera-slate)', border: '1px solid var(--littera-dust)' }
          }
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Notas
        </button>

        {/* WhatsApp — Premium */}
        {canWhatsApp && (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(buildWhatsAppText(essay, scores, notes, generalComment))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: '#f0fdf4',
              color: '#16a34a',
              border: '1px solid #bbf7d0',
            }}
            title="Enviar correção via WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        )}

        {/* Export PDF */}
        <div data-tour="export-btn">
          <ExportPDFButton essay={essay} />
        </div>

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
  )
}
