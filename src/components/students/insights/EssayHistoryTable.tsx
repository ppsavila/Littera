'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

interface Essay {
  id: string
  title: string | null
  theme: string | null
  total_score: number
  created_at: string
  status: string
}

interface Props {
  essays: Essay[]
}

function scoreColor(score: number): string {
  if (score >= 800) return 'var(--littera-forest)'
  if (score >= 600) return 'var(--littera-amber)'
  return '#ef4444'
}

export function EssayHistoryTable({ essays }: Props) {
  return (
    <section className="littera-fade-up delay-300">
      <h2
        className="font-display text-base font-semibold mb-3"
        style={{ color: 'var(--littera-ink)' }}
      >
        Histórico de redações
        <span className="text-xs font-normal ml-2" style={{ color: 'var(--littera-slate)' }}>
          {essays.length} no total
        </span>
      </h2>

      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'var(--littera-paper)',
          border: '1px solid var(--littera-dust)',
          boxShadow: 'var(--littera-shadow-sm)',
        }}
      >
        {/* Cabeçalho da tabela */}
        <div
          className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide"
          style={{
            color: 'var(--littera-slate)',
            borderBottom: '1px solid var(--littera-dust)',
            background: 'var(--littera-mist)',
          }}
        >
          <span>Título / Tema</span>
          <span className="text-right">Data</span>
          <span className="text-right">Nota</span>
          <span className="sr-only">Ação</span>
        </div>

        {essays.map((essay, idx) => {
          const label = essay.title || essay.theme || 'Redação sem título'
          const date  = new Date(essay.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: '2-digit',
          })

          return (
            <div
              key={essay.id}
              className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto_auto] items-center gap-3 sm:gap-4 px-5 py-3.5"
              style={{
                borderBottom: idx < essays.length - 1
                  ? '1px solid var(--littera-dust)'
                  : 'none',
              }}
            >
              {/* Título */}
              <div className="min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--littera-ink)' }}
                >
                  {label}
                </p>
                <p className="text-xs sm:hidden mt-0.5" style={{ color: 'var(--littera-slate)' }}>
                  {date}
                </p>
              </div>

              {/* Data (desktop) */}
              <span
                className="hidden sm:block text-sm text-right whitespace-nowrap"
                style={{ color: 'var(--littera-slate)' }}
              >
                {date}
              </span>

              {/* Nota */}
              <span
                className="text-sm font-bold text-right whitespace-nowrap"
                style={{ color: scoreColor(essay.total_score) }}
              >
                {essay.total_score}
              </span>

              {/* Link */}
              <Link
                href={`/dashboard/essays/${essay.id}`}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                style={{
                  color: 'var(--littera-forest)',
                  background: 'var(--littera-forest-light)',
                  border: '1px solid rgba(75,0,130,0.15)',
                }}
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline">Ver</span>
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}
