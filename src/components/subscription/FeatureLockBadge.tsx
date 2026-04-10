'use client'

import { Lock } from 'lucide-react'
import { usePostHog } from 'posthog-js/react'

type Tier = 'plus' | 'premium'

interface Props {
  tier: Tier
  onClick?: () => void
  feature?: string
}

const TIER_STYLES: Record<Tier, { color: string; bg: string; label: string }> = {
  plus: { color: '#7c3aed', bg: '#ede9fe', label: 'Plus' },
  premium: { color: '#b45309', bg: '#fef3c7', label: 'Premium' },
}

export function FeatureLockBadge({ tier, onClick, feature }: Props) {
  const style = TIER_STYLES[tier]
  const posthog = usePostHog()
  return (
    <span
      onClick={onClick ? () => {
        posthog?.capture('feature_gate_hit', {
          feature: feature ?? 'unknown',
          current_plan: tier === 'plus' ? 'free' : 'plus_or_free',
        })
        onClick()
      } : undefined}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold"
      style={{ background: style.bg, color: style.color }}
      aria-label="Recurso bloqueado"
      title={`Disponivel no plano ${style.label}`}
    >
      <Lock className="w-3 h-3" />
      {style.label}
    </span>
  )
}
