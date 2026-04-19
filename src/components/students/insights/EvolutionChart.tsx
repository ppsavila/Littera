'use client'

interface EssayPoint {
  id: string
  title: string | null
  theme: string | null
  total_score: number
  created_at: string
}

interface Props {
  essays: EssayPoint[]
}

const MAX_SCORE = 1000

export function EvolutionChart({ essays }: Props) {
  if (essays.length < 2) {
    return (
      <section
        className="rounded-xl px-5 py-4 littera-fade-up delay-100"
        style={{
          background: 'var(--littera-paper)',
          border: '1px solid var(--littera-dust)',
          boxShadow: 'var(--littera-shadow-sm)',
        }}
      >
        <h2
          className="font-display text-base font-semibold mb-1"
          style={{ color: 'var(--littera-ink)' }}
        >
          Evolução de notas
        </h2>
        <p className="text-sm" style={{ color: 'var(--littera-slate)' }}>
          São necessárias pelo menos 2 redações corrigidas para exibir o gráfico.
        </p>
      </section>
    )
  }

  /* ── SVG Sparkline ─────────────────────────────────────────────────── */
  const W = 600
  const H = 120
  const PAD_X = 24
  const PAD_Y = 16

  const scores = essays.map(e => e.total_score)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const range    = maxScore - minScore || 1

  const toX = (i: number) =>
    PAD_X + (i / (essays.length - 1)) * (W - PAD_X * 2)

  const toY = (score: number) =>
    PAD_Y + (1 - (score - minScore) / range) * (H - PAD_Y * 2)

  const points = essays.map((e, i) => ({ x: toX(i), y: toY(e.total_score), essay: e }))

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')

  /* Área sob a linha */
  const areaPath = [
    `M ${points[0].x},${H - PAD_Y}`,
    ...points.map(p => `L ${p.x},${p.y}`),
    `L ${points[points.length - 1].x},${H - PAD_Y}`,
    'Z',
  ].join(' ')

  const lastPoint = points[points.length - 1]
  const prevPoint = points[points.length - 2]
  const trend = lastPoint.essay.total_score >= prevPoint.essay.total_score ? 'up' : 'down'

  return (
    <section
      className="rounded-xl overflow-hidden littera-fade-up delay-100"
      style={{
        background: 'var(--littera-paper)',
        border: '1px solid var(--littera-dust)',
        boxShadow: 'var(--littera-shadow-sm)',
      }}
    >
      <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-2">
        <h2
          className="font-display text-base font-semibold"
          style={{ color: 'var(--littera-ink)' }}
        >
          Evolução de notas
          <span className="text-xs font-normal ml-2" style={{ color: 'var(--littera-slate)' }}>
            (últimas {essays.length} redações)
          </span>
        </h2>

        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            background: trend === 'up' ? 'var(--littera-forest-light)' : '#fef2f2',
            color: trend === 'up' ? 'var(--littera-forest)' : '#dc2626',
          }}
        >
          {trend === 'up' ? '↑ Subindo' : '↓ Caindo'}
        </span>
      </div>

      {/* SVG Chart */}
      <div className="px-2 pb-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 140, overflow: 'visible' }}
          aria-label="Gráfico de evolução de notas"
        >
          <defs>
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--littera-forest)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--littera-forest)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grade horizontal */}
          {[0.25, 0.5, 0.75].map(f => (
            <line
              key={f}
              x1={PAD_X}
              x2={W - PAD_X}
              y1={PAD_Y + f * (H - PAD_Y * 2)}
              y2={PAD_Y + f * (H - PAD_Y * 2)}
              stroke="var(--littera-dust)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          ))}

          {/* Área */}
          <path d={areaPath} fill="url(#area-gradient)" />

          {/* Linha */}
          <polyline
            points={polyline}
            fill="none"
            stroke="var(--littera-forest)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos + labels */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" fill="var(--littera-paper)" stroke="var(--littera-forest)" strokeWidth="2" />
              <title>{`${new Date(p.essay.created_at).toLocaleDateString('pt-BR')}: ${p.essay.total_score} pts`}</title>

              {/* Nota acima do ponto */}
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                fontSize="10"
                fill="var(--littera-ink)"
                fontWeight="600"
              >
                {p.essay.total_score}
              </text>
            </g>
          ))}
        </svg>

        {/* Datas no rodapé */}
        <div className="flex justify-between px-3 mt-1">
          {essays.map((e, i) => (
            <span
              key={i}
              className="text-xs"
              style={{ color: 'var(--littera-slate)', fontSize: '0.65rem' }}
            >
              {new Date(e.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
