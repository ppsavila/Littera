'use client'

import { Zap, Crown } from 'lucide-react'
import Link from 'next/link'
import type { Plan } from '@/lib/subscriptions/plans'

interface PlanBadgeProps {
  plan: Plan
  subscriptionsEnabled: boolean
  className?: string
}

export function PlanBadge({ plan, subscriptionsEnabled, className }: PlanBadgeProps) {
  if (!subscriptionsEnabled || plan === 'free') return null

  const config = {
    plus: { label: 'Plus', icon: <Zap className="w-3 h-3" />, color: '#7c3aed', bg: '#ede9fe' },
    premium: { label: 'Premium', icon: <Crown className="w-3 h-3" />, color: '#b45309', bg: '#fef3c7' },
  }[plan]

  if (!config) return null

  return (
    <Link
      href="/pricing"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 ${className ?? ''}`}
      style={{ background: config.bg, color: config.color }}
      title={`Plano ${config.label}`}
    >
      {config.icon}
      {config.label}
    </Link>
  )
}
