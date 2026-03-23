'use client'

import { useScoringStore } from '@/stores/scoringStore'
import { useErrorMarkerStore } from '@/stores/errorMarkerStore'
import { calcDeduction, calcSuggestedScore } from '@/types/error-marker'
import { scoreSteps } from '@/lib/utils'

interface Props {
  competency: {
    key: 'c1' | 'c2' | 'c3' | 'c4' | 'c5'
    number: number
    title: string
    description: string
    color: string
  }
  score: number | null
  note: string
  aiSuggestion?: number
  onNoteChange: (v: string) => void
}

const STEPS = scoreSteps()

// Map competency hex colors to littera design tokens
function colorToLittera(hex: string): { light: string; border: string; text: string; solid: string } {
  const map: Record<string, { light: string; border: string; text: string; solid: string }> = {
    '#3B82F6': { light: 'var(--littera-sky-light)',    border: 'rgba(3,105,161,0.20)',   text: 'var(--littera-sky)',    solid: 'var(--littera-sky)'    },
    '#10B981': { light: 'var(--littera-teal-light)',   border: 'rgba(15,118,110,0.20)',  text: 'var(--littera-teal)',   solid: 'var(--littera-teal)'   },
    '#F59E0B': { light: 'var(--littera-gold-light)',   border: 'rgba(201,134,10,0.20)',  text: 'var(--littera-gold)',   solid: 'var(--littera-gold)'   },
    '#8B5CF6': { light: 'var(--littera-forest-light)', border: 'rgba(26,77,58,0.20)',    text: 'var(--littera-forest)', solid: 'var(--littera-forest)' },
    '#EF4444': { light: 'var(--littera-rose-light)',   border: 'rgba(190,18,60,0.20)',   text: 'var(--littera-rose)',   solid: 'var(--littera-rose)'   },
  }
  return map[hex] ?? {
    light: 'var(--littera-forest-light)',
    border: 'rgba(26,77,58,0.20)',
    text: 'var(--littera-forest)',
    solid: 'var(--littera-forest)',
  }
}

export function CompetencyCard({ competency, score, note, aiSuggestion, onNoteChange }: Props) {
  const { setScore } = useScoringStore()
  const { markers } = useErrorMarkerStore()

  const compNum = competency.number as 1 | 2 | 3 | 4 | 5
  const compMarkers = markers.filter((m) => m.competency === compNum)
  const totalDeduction = calcDeduction(compMarkers, compNum)
  const adjustedSuggestion = calcSuggestedScore(aiSuggestion, compMarkers, compNum)
  const hasDeductions = totalDeduction > 0

  const markerCounts: Record<string, number> = {}
  for (const m of compMarkers) {
    markerCounts[m.error_code] = (markerCounts[m.error_code] ?? 0) + 1
  }

  const tokens = colorToLittera(competency.color)

  return (
    <div
      className="rounded-xl p-3 space-y-2.5"
      style={{
        background: tokens.light,
        border: `1px solid ${tokens.border}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: tokens.solid }}
        >
          {competency.number}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold truncate"
            style={{ color: 'var(--littera-ink)' }}
          >
            {competency.title}
          </p>
        </div>
        <div
          className="font-display text-base font-bold tabular-nums flex-shrink-0"
          style={{ color: tokens.text }}
        >
          {score ?? '—'}
        </div>
      </div>

      {/* Error markers */}
      {compMarkers.length > 0 && (
        <div
          className="rounded-lg px-2.5 py-2 space-y-1.5"
          style={{
            background: 'var(--littera-rose-light)',
            border: '1px solid rgba(190,18,60,0.18)',
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: 'var(--littera-rose)' }}>
              {compMarkers.length} erro{compMarkers.length > 1 ? 's' : ''} marcado{compMarkers.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs font-bold tabular-nums" style={{ color: 'var(--littera-rose)' }}>
              −{totalDeduction} pts
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(markerCounts).map(([code, count]) => (
              <span
                key={code}
                className="inline-flex items-center gap-0.5 text-xs rounded-md px-1.5 py-0.5 font-semibold"
                style={{
                  background: 'var(--littera-rose)',
                  color: '#fff',
                }}
              >
                {code}
                {count > 1 && <span className="font-bold ml-0.5">×{count}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Score step buttons */}
      <div className="flex gap-1">
        {STEPS.map((step) => {
          const isAiSuggestion = adjustedSuggestion === step && score !== step
          const active = score === step
          return (
            <button
              key={step}
              onClick={() => setScore(competency.key, step)}
              className="flex-1 h-7 text-xs font-semibold rounded-lg border transition-all relative"
              style={
                active
                  ? {
                      background: tokens.solid,
                      borderColor: 'transparent',
                      color: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.7)',
                      borderColor: 'var(--littera-dust)',
                      color: 'var(--littera-slate)',
                    }
              }
            >
              {step}
              {isAiSuggestion && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white"
                  style={{
                    background: hasDeductions
                      ? 'var(--littera-rose)'
                      : 'var(--littera-forest)',
                  }}
                  title={hasDeductions ? 'Sugestão ajustada pelos erros' : 'Sugestão da IA'}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* AI suggestion */}
      {adjustedSuggestion !== undefined && (
        <p
          className="text-xs font-medium"
          style={{
            color: hasDeductions ? 'var(--littera-rose)' : 'var(--littera-forest)',
          }}
        >
          {hasDeductions ? '↓' : '✦'}{' '}
          Sugestão{hasDeductions ? ' ajustada' : ' da IA'}:{' '}
          <strong>{adjustedSuggestion}</strong>
          {hasDeductions && aiSuggestion !== undefined && aiSuggestion !== adjustedSuggestion && (
            <span className="line-through ml-1 opacity-40">{aiSuggestion}</span>
          )}
        </p>
      )}

      {/* Note textarea */}
      <textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Observação sobre esta competência..."
        rows={2}
        className="littera-input resize-none text-xs"
        style={{ background: 'rgba(255,255,255,0.65)' }}
      />
    </div>
  )
}
