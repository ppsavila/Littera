'use client'

import Link from 'next/link'
import type { Plan } from '@/lib/subscriptions/plans'

interface UsageIndicatorProps {
  plan: Plan
  used: number
  limit: number  // -1 = unlimited
  subscriptionsEnabled: boolean
  compact?: boolean
}

export function UsageIndicator({ plan, used, limit, subscriptionsEnabled, compact }: UsageIndicatorProps) {
  if (!subscriptionsEnabled || limit === -1) return null

  const pct = Math.min((used / limit) * 100, 100)
  const isNearLimit = pct >= 80
  const isAtLimit = used >= limit

  const barColor = isAtLimit
    ? 'var(--littera-rose)'
    : isNearLimit
    ? '#f59e0b'
    : 'var(--littera-forest)'

  if (compact) {
    return (
      <Link
        href="/pricing"
        className="flex items-center gap-1.5 text-xs font-medium"
        style={{ color: isAtLimit ? 'var(--littera-rose)' : 'var(--littera-slate)' }}
        title={`${used}/${limit} correções hoje`}
      >
        <span
          className="inline-block w-16 h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--littera-dust)' }}
        >
          <span
            className="block h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </span>
        <span>
          {used}/{limit}
        </span>
      </Link>
    )
  }

  return (
    <div
      className="rounded-xl p-3 text-sm"
      style={{
        background: isAtLimit ? 'var(--littera-rose-light)' : 'var(--littera-mist)',
        border: `1px solid ${isAtLimit ? 'rgba(190,18,60,0.20)' : 'var(--littera-dust)'}`,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium text-xs" style={{ color: 'var(--littera-ink)' }}>
          Correções hoje
        </span>
        <span className="text-xs font-semibold" style={{ color: isAtLimit ? 'var(--littera-rose)' : 'var(--littera-slate)' }}>
          {used}/{limit}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--littera-dust)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      {isAtLimit && (
        <p className="mt-2 text-xs" style={{ color: 'var(--littera-rose)' }}>
          Limite atingido.{' '}
          <Link href="/pricing" className="underline font-medium">
            Fazer upgrade
          </Link>
        </p>
      )}
      {isNearLimit && !isAtLimit && (
        <p className="mt-2 text-xs" style={{ color: '#92400e' }}>
          Quase no limite.{' '}
          <Link href="/pricing" className="underline font-medium">
            Ver planos
          </Link>
        </p>
      )}
    </div>
  )
}
