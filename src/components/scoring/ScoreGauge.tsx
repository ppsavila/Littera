'use client'

interface Props {
  total: number
  /** Render with white text — use when placed on a dark background */
  dark?: boolean
}

export function ScoreGauge({ total, dark = true }: Props) {
  const percentage = (total / 1000) * 100
  const circumference = 2 * Math.PI * 36

  // Arc colors always shown against the dark forest header
  const arcColor =
    total >= 800 ? '#6EE7B7'   // bright mint-green
    : total >= 600 ? '#FCD34D' // warm amber
    : total >= 400 ? '#FCA5A5' // soft rose
    : 'rgba(255,255,255,0.30)' // empty = ghost

  const trackColor = 'rgba(255,255,255,0.15)'
  const textPrimary = dark ? '#FFFFFF' : 'var(--littera-ink)'
  const textSecondary = dark ? 'rgba(255,255,255,0.60)' : 'var(--littera-slate)'

  const label =
    total === 0     ? 'Nenhuma nota atribuída'
    : total >= 900  ? 'Excelente'
    : total >= 700  ? 'Bom desempenho'
    : total >= 500  ? 'Regular'
    : total >= 300  ? 'Abaixo da média'
    : 'Precisa melhorar'

  return (
    <div className="flex items-center gap-4">
      {/* Circular gauge */}
      <div className="relative w-[72px] h-[72px] flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          {/* Track */}
          <circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke={trackColor}
            strokeWidth="6"
          />
          {/* Progress */}
          <circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke={arcColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * percentage) / 100}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-lg font-bold leading-none tabular-nums"
            style={{ color: textPrimary, fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            {total}
          </span>
          <span className="text-[10px] font-medium mt-0.5" style={{ color: textSecondary }}>
            /1000
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight" style={{ color: textPrimary }}>
          Pontuação Total
        </p>
        <p className="text-xs mt-1 leading-tight" style={{ color: textSecondary }}>
          {label}
        </p>

        {/* Progress bar */}
        <div
          className="h-1 rounded-full mt-2 overflow-hidden"
          style={{ background: trackColor, width: '100%' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percentage}%`, backgroundColor: arcColor }}
          />
        </div>
      </div>
    </div>
  )
}
