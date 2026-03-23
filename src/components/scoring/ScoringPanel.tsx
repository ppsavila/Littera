'use client'

import { useState } from 'react'
import { useScoringStore } from '@/stores/scoringStore'
import { CompetencyCard } from './CompetencyCard'
import { ScoreGauge } from './ScoreGauge'
import { AIAnalysisCard } from './AIAnalysisCard'
import { COMPETENCIES } from '@/types/essay'
import { Sparkles, BarChart2, Loader2, Save, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Essay } from '@/types/essay'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  essay: Essay
  /** When true, fills available width instead of the fixed 320 px desktop width */
  fullWidth?: boolean
}

export function ScoringPanel({ essay, fullWidth = false }: Props) {
  const {
    scores,
    notes,
    generalComment,
    setNote,
    setGeneralComment,
    totalScore,
    aiAnalysis,
    isAnalyzing,
    setIsAnalyzing,
    setAIAnalysis,
    clearStreamingText,
    appendStreamingText,
    streamingText,
    isDirty,
    markClean,
  } = useScoringStore()

  const [activeTab, setActiveTab] = useState<'scores' | 'ai'>('scores')
  const [analyzeError, setAnalyzeError] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const supabase = createClient()

  async function handleSave() {
    if (saveState === 'saving') return
    setSaveState('saving')
    try {
      const res = await fetch(`/api/essays/${essay.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score_c1: scores.c1,
          score_c2: scores.c2,
          score_c3: scores.c3,
          score_c4: scores.c4,
          score_c5: scores.c5,
          notes_c1: notes.c1,
          notes_c2: notes.c2,
          notes_c3: notes.c3,
          notes_c4: notes.c4,
          notes_c5: notes.c5,
          general_comment: generalComment,
        }),
      })
      if (!res.ok) throw new Error('Falha ao salvar')
      markClean()
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }

  async function handleAnalyze() {
    if (isAnalyzing) return
    setIsAnalyzing(true)
    setAnalyzeError('')
    clearStreamingText()
    setActiveTab('ai')

    try {
      const response = await fetch(`/api/essays/${essay.id}/analyze`, { method: 'POST' })

      if (!response.ok) {
        const body = await response.text()
        let msg = `Erro ${response.status}`
        try { msg = JSON.parse(body).error ?? msg } catch {}
        throw new Error(msg)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = line.slice(6).trim()
          if (!json) continue
          try {
            const event = JSON.parse(json)
            if (event.type === 'chunk') {
              appendStreamingText(event.text)
            } else if (event.type === 'done') {
              setAIAnalysis(event.analysis)
            } else if (event.type === 'error') {
              throw new Error(event.message)
            }
          } catch {
            // ignore incomplete JSON chunks
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setAnalyzeError(msg)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div
      className="flex flex-col overflow-hidden flex-shrink-0"
      style={{
        width: fullWidth ? '100%' : 320,
        background: 'var(--littera-paper)',
        borderLeft: fullWidth ? 'none' : '1px solid var(--littera-dust)',
      }}
    >
      {/* Score summary header */}
      <div
        className="px-4 py-4 space-y-3"
        style={{
          background: 'var(--littera-forest)',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <ScoreGauge total={totalScore()} />

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saveState === 'saving' || (!isDirty && saveState === 'idle')}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={
            saveState === 'saved'
              ? { background: 'rgba(255,255,255,0.20)', color: '#fff' }
              : saveState === 'error'
              ? { background: 'rgba(190,18,60,0.35)', color: '#fff' }
              : isDirty
              ? { background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }
              : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)', cursor: 'default' }
          }
        >
          {saveState === 'saving' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saveState === 'saved' ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          {saveState === 'saving' ? 'Salvando...' : saveState === 'saved' ? 'Salvo!' : saveState === 'error' ? 'Erro ao salvar' : 'Salvar notas'}
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex"
        style={{ borderBottom: '1px solid var(--littera-dust)' }}
      >
        {[
          { key: 'scores', label: 'Notas',       icon: BarChart2 },
          { key: 'ai',     label: 'Análise IA',  icon: Sparkles  },
        ].map(({ key, label, icon: Icon }) => {
          const active = activeTab === key
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'scores' | 'ai')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all"
              style={
                active
                  ? {
                      color: 'var(--littera-forest)',
                      borderBottom: '2px solid var(--littera-forest)',
                      background: 'var(--littera-forest-faint)',
                    }
                  : { color: 'var(--littera-slate)' }
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {key === 'ai' && isAnalyzing && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'scores' ? (
          <div className="p-3 space-y-3">
            {COMPETENCIES.map((comp) => (
              <CompetencyCard
                key={comp.key}
                competency={comp}
                score={scores[comp.key]}
                note={notes[comp.key]}
                aiSuggestion={aiAnalysis?.competencies[comp.key]?.suggested_score}
                onNoteChange={(v) => setNote(comp.key, v)}
              />
            ))}

            <div className="pt-1">
              <label
                className="block text-xs font-semibold mb-1.5 ml-0.5"
                style={{ color: 'var(--littera-slate)' }}
              >
                Comentário geral
              </label>
              <textarea
                value={generalComment}
                onChange={(e) => setGeneralComment(e.target.value)}
                placeholder="Observações gerais sobre a redação..."
                rows={3}
                className="littera-input resize-none text-xs"
              />
            </div>
          </div>
        ) : (
          <>
            {analyzeError && (
              <div
                className="m-3 p-3 rounded-lg text-xs"
                style={{
                  background: 'var(--littera-rose-light)',
                  border: '1px solid rgba(190,18,60,0.20)',
                  color: 'var(--littera-rose)',
                }}
              >
                <p className="font-semibold mb-1">Erro na análise</p>
                <p>{analyzeError}</p>
              </div>
            )}
            <AIAnalysisCard
              analysis={aiAnalysis}
              streamingText={streamingText}
              isAnalyzing={isAnalyzing}
              onAnalyze={handleAnalyze}
            />
          </>
        )}
      </div>
    </div>
  )
}
