'use client'

import { useEffect, useRef, useState } from 'react'

interface ScoreGaugeProps {
  score: number        // 0–1000
  maxScore?: number    // default 1000
  status?: string      // 'done' dispara animação count-up
  size?: number        // diâmetro em px, default 160
}

type ScoreTier = {
  label: string
  arcColor: string
  pillBg: string
  pillColor: string
}

function getScoreTier(score: number): ScoreTier {
  if (score >= 900) return { label: 'Excelente',           arcColor: '#FBBF24', pillBg: '#FEF3C7', pillColor: '#92400E' }
  if (score >= 700) return { label: 'Bom trabalho',        arcColor: '#0D9488', pillBg: '#F0FDFA', pillColor: '#0D9488' }
  if (score >= 400) return { label: 'Em desenvolvimento',  arcColor: '#C9860A', pillBg: '#FEF3DC', pillColor: '#C9860A' }
  return               { label: 'Atenção',                arcColor: '#E11D48', pillBg: '#FFF1F2', pillColor: '#E11D48' }
}

function useCountUp(target: number, duration = 700, enabled = false) {
  const [value, setValue] = useState(enabled ? 0 : target)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!enabled) { setValue(target); return }
    if (startedRef.current) return
    startedRef.current = true
    setValue(0)
    const startTime = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(eased * target))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration, enabled])

  return value
}

export function ScoreGauge({ score, maxScore = 1000, status, size = 160 }: ScoreGaugeProps) {
  const isDone = status === 'done'
  const tier = getScoreTier(score)
  const displayScore = useCountUp(score, 700, isDone)

  // SVG arc: 240° arc starting at 150° (bottom-left), going clockwise
  const strokeWidth = 10
  const radius = (size - strokeWidth * 2) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius
  const arcFraction = 240 / 360
  const arcLength = circumference * arcFraction
  const progress = Math.max(0, Math.min(score / maxScore, 1))
  const dashOffset = arcLength * (1 - progress)

  return (
    <div className="flex flex-col items-center gap-2.5">
      {/* SVG gauge */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Rotate so arc starts at bottom-left (150°) */}
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(150deg)' }}
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="var(--littera-dust)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={0}
          />
          {/* Progress fill */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={tier.arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 500ms cubic-bezier(0.4,0,0.2,1), stroke 400ms ease',
            }}
          />
        </svg>

        {/* Center text — not rotated */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="font-display font-extrabold tabular-nums leading-none"
            style={{
              fontSize: Math.round(size * 0.25),
              color: tier.arcColor,
              transition: 'color 400ms ease',
            }}
          >
            {displayScore}
          </span>
          <span className="text-xs mt-0.5" style={{ color: 'var(--littera-slate)' }}>
            /{maxScore}
          </span>
        </div>
      </div>

      {/* Label pill */}
      <span
        className="text-xs font-bold px-3 py-1 rounded-full"
        style={{
          background: tier.pillBg,
          color: tier.pillColor,
          transition: 'background-color 400ms ease, color 400ms ease',
        }}
      >
        {tier.label}
      </span>
    </div>
  )
}
