'use client'

import { useState } from 'react'
import { Sparkles, X, TrendingUp, TrendingDown, Minus, BarChart2, AlertCircle, Loader2 } from 'lucide-react'
import type { StudentProgressAnalysis } from '@/lib/ai/analyze-student'

interface Props {
  studentId: string
  studentName: string
  essayCount: number
}

const TREND_ICON = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  mixed: BarChart2,
}

const TREND_COLOR = {
  improving: 'var(--littera-sage)',
  stable: 'var(--littera-slate)',
  declining: '#ef4444',
  mixed: 'var(--littera-amber)',
}

const TREND_LABEL = {
  improving: 'Progresso positivo',
  stable: 'Desempenho estável',
  declining: 'Queda no desempenho',
  mixed: 'Desempenho variável',
}

export function StudentInsightsButton({ studentId, studentName, essayCount }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<StudentProgressAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (essayCount < 2) return
    setOpen(true)
    if (analysis) return // already loaded

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/student-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao gerar análise.')
      } else {
        setAnalysis(data.analysis)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const TrendIcon = analysis ? TREND_ICON[analysis.trend] : null

  return (
    <>
      <button
        onClick={handleClick}
        disabled={essayCount < 2}
        title={essayCount < 2 ? 'Necessário pelo menos 2 redações corrigidas' : `Analisar progresso de ${studentName}`}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
        style={{
          background: essayCount >= 2 ? 'var(--littera-forest-light)' : 'var(--littera-mist)',
          color: essayCount >= 2 ? 'var(--littera-forest)' : 'var(--littera-dust)',
          border: `1px solid ${essayCount >= 2 ? 'rgba(26,77,58,0.2)' : 'var(--littera-dust)'}`,
          cursor: essayCount < 2 ? 'not-allowed' : 'pointer',
        }}
      >
        <Sparkles className="w-3 h-3" />
        Insights
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ background: 'var(--littera-paper)', boxShadow: 'var(--littera-shadow-lg, 0 20px 60px rgba(0,0,0,0.2))' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--littera-dust)' }}
            >
              <div>
                <h2 className="font-display text-base font-semibold" style={{ color: 'var(--littera-ink)' }}>
                  Progresso de {studentName}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--littera-slate)' }}>
                  Análise gerada por IA com base em {essayCount} redações
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition-colors hover:bg-[var(--littera-mist)]"
                style={{ color: 'var(--littera-slate)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {loading && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--littera-forest)' }} />
                  <p className="text-sm" style={{ color: 'var(--littera-slate)' }}>
                    Analisando o progresso...
                  </p>
                </div>
              )}

              {error && (
                <div
                  className="flex items-start gap-2.5 p-3 rounded-xl text-sm"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {analysis && (
                <>
                  {/* Trend badge */}
                  {TrendIcon && (
                    <div
                      className="flex items-center gap-2.5 p-3 rounded-xl"
                      style={{ background: 'var(--littera-mist)', border: '1px solid var(--littera-dust)' }}
                    >
                      <TrendIcon className="w-5 h-5 flex-shrink-0" style={{ color: TREND_COLOR[analysis.trend] }} />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: TREND_COLOR[analysis.trend] }}>
                          {TREND_LABEL[analysis.trend]}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--littera-slate)' }}>
                          {analysis.summary}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Competency breakdown */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--littera-slate)' }}>
                      Por Competência
                    </h3>
                    <div className="space-y-2">
                      {(Object.entries(analysis.competencies) as [string, { label: string; trend: string; insight: string }][]).map(
                        ([key, comp]) => (
                          <div
                            key={key}
                            className="p-3 rounded-lg"
                            style={{ background: 'var(--littera-parchment, #FDFAF5)', border: '1px solid var(--littera-dust)' }}
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-xs font-medium" style={{ color: 'var(--littera-ink)' }}>
                                {key.toUpperCase()} — {comp.label}
                              </span>
                              <span
                                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                style={{
                                  background: comp.trend === 'melhorando' ? 'var(--littera-forest-light)' : comp.trend === 'piorando' ? '#fef2f2' : 'var(--littera-mist)',
                                  color: comp.trend === 'melhorando' ? 'var(--littera-forest)' : comp.trend === 'piorando' ? '#dc2626' : 'var(--littera-slate)',
                                }}
                              >
                                {comp.trend}
                              </span>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--littera-slate)' }}>
                              {comp.insight}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Strengths */}
                  {analysis.strengths.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--littera-sage)' }}>
                        Pontos Fortes
                      </h3>
                      <ul className="space-y-1">
                        {analysis.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--littera-ink)' }}>
                            <span style={{ color: 'var(--littera-sage)' }}>✓</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas for improvement */}
                  {analysis.improvements.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--littera-amber)' }}>
                        Áreas de Melhoria
                      </h3>
                      <ul className="space-y-1">
                        {analysis.improvements.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--littera-ink)' }}>
                            <span style={{ color: 'var(--littera-amber)' }}>→</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysis.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--littera-forest)' }}>
                        Recomendações
                      </h3>
                      <ul className="space-y-1">
                        {analysis.recommendations.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--littera-ink)' }}>
                            <span style={{ color: 'var(--littera-forest)' }}>{i + 1}.</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
