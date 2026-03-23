import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number | null): string {
  if (score === null || score === undefined) return '—'
  return score.toString()
}

export function getScoreColor(score: number, max = 200): string {
  const ratio = score / max
  if (ratio >= 0.8) return 'text-green-600'
  if (ratio >= 0.6) return 'text-yellow-600'
  if (ratio >= 0.4) return 'text-orange-500'
  return 'text-red-500'
}

export function getTotalScoreColor(total: number): string {
  if (total >= 800) return 'text-green-600'
  if (total >= 600) return 'text-yellow-600'
  if (total >= 400) return 'text-orange-500'
  return 'text-red-500'
}

export function scoreSteps(): number[] {
  return [0, 40, 80, 120, 160, 200]
}

export function snapToStep(value: number): number {
  const steps = scoreSteps()
  return steps.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  )
}
