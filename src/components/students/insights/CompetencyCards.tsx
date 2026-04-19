'use client'

import type { COMPETENCIES } from '@/types/essay'

type CompetencyKey = 'c1' | 'c2' | 'c3' | 'c4' | 'c5'

interface Props {
  competencies: typeof COMPETENCIES
  averages: Record<CompetencyKey, number | null>
}

const MAX_SCORE = 200

export function CompetencyCards({ competencies, averages }: Props) {
  return (
    <section className="littera-fade-up delay-200">
      <h2
        className="font-display text-base font-semibold mb-3"
        style={{ color: 'var(--littera-ink)' }}
      >
        Média por competência
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {competencies.map((comp) => {
          const avg = averages[comp.key]
          const pct = avg !== null ? Math.min(100, Math.round((avg / MAX_SCORE) * 100)) : 0

          return (
            <div
              key={comp.key}
              className="rounded-xl p-4 space-y-3"
              style={{
                background: 'var(--littera-paper)',
                border: '1px solid var(--littera-dust)',
                boxShadow: 'var(--littera-shadow-sm)',
              }}
            >
              {/* Label */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: comp.color }}
                  >
                    C{comp.number}
                  </span>
                  <p
                    className="text-xs font-medium leading-snug mt-0.5"
                    style={{ color: 'var(--littera-ink)' }}
                  >
                    {comp.title}
                  </p>
                </div>
              </div>

              {/* Nota */}
              {avg !== null ? (
                <p
                  className="font-display text-2xl font-bold"
                  style={{ color: comp.color }}
                >
                  {avg}
                  <span className="text-xs font-normal ml-1" style={{ color: 'var(--littera-slate)' }}>
                    / {MAX_SCORE}
                  </span>
                </p>
              ) : (
                <p className="text-sm" style={{ color: 'var(--littera-dust)' }}>—</p>
              )}

              {/* Barra de progresso */}
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: 6, background: 'var(--littera-mist)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: comp.color,
                    opacity: avg !== null ? 1 : 0,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
