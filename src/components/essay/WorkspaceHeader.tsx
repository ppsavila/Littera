'use client'

import Link from 'next/link'
import { ArrowLeft, List, CheckCircle, Loader2 } from 'lucide-react'
import { useScoringStore } from '@/stores/scoringStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Essay } from '@/types/essay'

interface Props {
  essay: Essay
  onToggleAnnotations: () => void
  showAnnotations: boolean
}

export function WorkspaceHeader({ essay, onToggleAnnotations, showAnnotations }: Props) {
  const { scores, notes, generalComment, totalScore, markClean, isDirty } = useScoringStore()
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
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
          onClick={onToggleAnnotations}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={
            showAnnotations
              ? {
                  background: 'var(--littera-forest-light)',
                  color: 'var(--littera-forest)',
                  border: '1px solid rgba(26,77,58,0.25)',
                }
              : {
                  background: 'var(--littera-mist)',
                  color: 'var(--littera-slate)',
                  border: '1px solid var(--littera-dust)',
                }
          }
        >
          <List className="w-3.5 h-3.5" />
          Anotações
        </button>

        {/* Save */}
        <button
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
          {saving ? 'Salvando...' : isDirty ? 'Salvar' : 'Salvo'}
        </button>
      </div>
    </header>
  )
}
