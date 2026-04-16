'use client'

import { COMPETENCIES } from '@/types/essay'
import { getErrorType } from '@/types/error-marker'
import type { Essay } from '@/types/essay'
import type { ErrorMarker } from '@/types/error-marker'

interface Props {
  essay: Essay & { student?: { name: string | null; class_name: string | null } }
  errorMarkers: ErrorMarker[]
}

function getColor(competency: number): string {
  return COMPETENCIES.find((c) => c.number === competency)?.color ?? '#ef4444'
}

export function SharedEssayView({ essay, errorMarkers }: Props) {
  const scores = {
    c1: essay.score_c1 ?? 0,
    c2: essay.score_c2 ?? 0,
    c3: essay.score_c3 ?? 0,
    c4: essay.score_c4 ?? 0,
    c5: essay.score_c5 ?? 0,
  }
  const notes = {
    c1: essay.notes_c1 ?? '',
    c2: essay.notes_c2 ?? '',
    c3: essay.notes_c3 ?? '',
    c4: essay.notes_c4 ?? '',
    c5: essay.notes_c5 ?? '',
  }
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)

  const byCompetency: Record<number, ErrorMarker[]> = {}
  for (const m of errorMarkers) {
    if (!byCompetency[m.competency]) byCompetency[m.competency] = []
    byCompetency[m.competency].push(m)
  }

  const dateStr = new Date(essay.updated_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--littera-parchment, #faf9f5)' }}
    >
      {/* Header bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3"
        style={{
          background: 'var(--littera-forest, #1a4d3a)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <span
          className="text-sm font-bold tracking-wider"
          style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '0.08em' }}
        >
          LITTERA
        </span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Correção de Redação
        </span>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Essay info */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <h1
            className="text-xl font-bold mb-1"
            style={{ color: '#111827', fontFamily: 'Georgia, serif' }}
          >
            {essay.title}
          </h1>
          {essay.theme && (
            <p className="text-sm mb-3" style={{ color: '#6b7280' }}>{essay.theme}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: '#9ca3af' }}>
            {essay.student?.name && <span>{essay.student.name}</span>}
            {essay.student?.class_name && <span>{essay.student.class_name}</span>}
            <span>{dateStr}</span>
          </div>
        </div>

        {/* Score summary */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          {/* Total */}
          <div
            className="px-6 py-5 flex items-center justify-between"
            style={{ background: 'var(--littera-forest, #1a4d3a)' }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Nota Final
              </p>
              <p className="text-4xl font-bold text-white mt-0.5">{totalScore}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>/ 1000 pontos</p>
            </div>
            {/* Score ring visual */}
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="26" fill="none"
                  stroke="rgba(255,255,255,0.85)" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26 * (totalScore / 1000)} ${2 * Math.PI * 26}`}
                  transform="rotate(-90 32 32)"
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white"
              >
                {Math.round(totalScore / 10)}%
              </span>
            </div>
          </div>

          {/* Per-competency */}
          <div className="divide-y" style={{ background: '#fff', borderTop: '1px solid #e5e7eb' }}>
            {COMPETENCIES.map((comp) => {
              const score = scores[comp.key]
              const note = notes[comp.key]
              const pct = (score / 200) * 100
              return (
                <div key={comp.key} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ background: comp.color + '18', color: comp.color }}
                      >
                        C{comp.number}
                      </span>
                      <span className="text-xs font-medium" style={{ color: '#374151' }}>
                        {comp.title}
                      </span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: comp.color }}>
                      {score}/200
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: '#f3f4f6' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: comp.color, transition: 'width 0.4s ease' }}
                    />
                  </div>
                  {note && (
                    <p className="mt-1.5 text-xs" style={{ color: '#6b7280', lineHeight: 1.5 }}>
                      {note}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* General comment */}
        {essay.general_comment && (
          <div
            className="rounded-2xl p-5"
            style={{ background: '#fff', border: '1px solid #e5e7eb' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>
              Comentário Geral
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
              {essay.general_comment}
            </p>
          </div>
        )}

        {/* Error markers */}
        {errorMarkers.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid #e5e7eb' }}
          >
            <div
              className="px-5 py-3.5 flex items-center justify-between"
              style={{ background: '#fff', borderBottom: '1px solid #e5e7eb' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                Erros Marcados
              </p>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#fee2e2', color: '#ef4444' }}
              >
                {errorMarkers.length}
              </span>
            </div>

            <div className="divide-y" style={{ background: '#fff' }}>
              {COMPETENCIES.map((comp) => {
                const cMarkers = byCompetency[comp.number]
                if (!cMarkers?.length) return null
                return (
                  <div key={comp.key}>
                    {/* Competency group header */}
                    <div
                      className="px-5 py-2 flex items-center gap-2"
                      style={{ background: comp.color + '0d' }}
                    >
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ background: comp.color + '20', color: comp.color }}
                      >
                        C{comp.number}
                      </span>
                      <span className="text-xs font-medium" style={{ color: '#374151' }}>
                        {comp.title}
                      </span>
                    </div>
                    {cMarkers.map((marker) => {
                      const et = getErrorType(marker.error_code, marker.competency)
                      const color = getColor(marker.competency)
                      return (
                        <div
                          key={marker.id}
                          className="px-5 py-3.5"
                          style={{ borderTop: '1px solid #f9fafb' }}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5"
                              style={{ background: color + '18', color }}
                            >
                              {marker.error_code}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold" style={{ color: '#111827' }}>
                                  {et?.label ?? marker.error_code}
                                </span>
                                {et && (
                                  <span className="text-xs flex-shrink-0" style={{ color: '#ef4444' }}>
                                    -{et.deduction} pts
                                  </span>
                                )}
                              </div>
                              {et?.description && (
                                <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                                  {et.description}
                                </p>
                              )}
                              {marker.selected_text && (
                                <p
                                  className="text-xs mt-1.5 px-2.5 py-1.5 rounded-lg italic"
                                  style={{
                                    background: color + '10',
                                    border: `1px solid ${color}25`,
                                    color: '#374151',
                                    lineHeight: 1.5,
                                  }}
                                >
                                  "{marker.selected_text.length > 120
                                    ? marker.selected_text.slice(0, 120) + '…'
                                    : marker.selected_text}"
                                </p>
                              )}
                              {marker.note && (
                                <p
                                  className="text-xs mt-1.5 px-2.5 py-1.5 rounded-lg"
                                  style={{
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    color: '#15803d',
                                    lineHeight: 1.5,
                                  }}
                                >
                                  💬 {marker.note}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            Correção gerada pelo{' '}
            <span className="font-semibold" style={{ color: 'var(--littera-forest, #1a4d3a)' }}>
              Littera
            </span>
            {' '}— plataforma de correção de redações
          </p>
        </div>
      </div>
    </div>
  )
}
