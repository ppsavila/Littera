'use client'

import { Check, Loader2, Star, Zap, Crown } from 'lucide-react'
import { PLANS, type Plan } from '@/lib/subscriptions/plans'

const PLAN_ICONS: Record<Plan, React.ReactNode> = {
  free: <Star className="w-5 h-5" />,
  plus: <Zap className="w-5 h-5" />,
  premium: <Crown className="w-5 h-5" />,
}

export const ALL_FEATURES = [
  { key: 'corrections', label: 'Correções por dia' },
  { key: 'aiAnalysis', label: 'Análise por IA (revisão e nota)' },
  { key: 'studentInsights', label: 'Análise de progresso por aluno' },
  { key: 'whatsapp', label: 'Envio de notas por WhatsApp' },
] as const

export const PLAN_FEATURE_VALUES: Record<Plan, Record<typeof ALL_FEATURES[number]['key'], string | boolean>> = {
  free: {
    corrections: '10 por dia',
    aiAnalysis: false,
    studentInsights: false,
    whatsapp: false,
  },
  plus: {
    corrections: '20 por dia',
    aiAnalysis: true,
    studentInsights: false,
    whatsapp: false,
  },
  premium: {
    corrections: 'Ilimitadas',
    aiAnalysis: true,
    studentInsights: true,
    whatsapp: true,
  },
}

export const PLAN_COLORS: Record<Plan, { icon: string; border: string; bg: string }> = {
  free: {
    icon: 'var(--littera-slate)',
    border: 'var(--littera-dust)',
    bg: 'var(--littera-paper)',
  },
  plus: {
    icon: '#7c3aed',
    border: '#7c3aed',
    bg: '#f5f0ff',
  },
  premium: {
    icon: '#b45309',
    border: '#b45309',
    bg: '#fffbeb',
  },
}

interface Props {
  planId: Plan
  activePlan: Plan
  loading: Plan | null
  onUpgrade: (plan: Plan) => void
}

export function PlanCard({ planId, activePlan, loading, onUpgrade }: Props) {
  const plan = PLANS[planId]
  const colors = PLAN_COLORS[planId]
  const isCurrent = activePlan === planId
  const isRecommended = planId === 'plus'

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4 relative"
      style={{
        background: colors.bg,
        border: `${isCurrent || planId === 'plus' ? '2px' : '1px'} solid ${isCurrent ? colors.border : planId === 'plus' ? '#7c3aed' : 'var(--littera-dust)'}`,
        boxShadow: planId === 'plus' && !isCurrent
          ? 'var(--littera-shadow-md)'
          : isCurrent
          ? 'var(--littera-shadow)'
          : 'var(--littera-shadow-sm)',
      }}
    >
      {isRecommended && !isCurrent && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-0.5 rounded-full"
          style={{ background: colors.border, color: '#fff' }}
        >
          Popular
        </span>
      )}

      {isCurrent && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-0.5 rounded-full"
          style={{ background: 'var(--littera-forest)', color: '#fff' }}
        >
          Plano atual
        </span>
      )}

      {/* Header */}
      <div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
          style={{ background: `${colors.icon}18`, color: colors.icon }}
        >
          {PLAN_ICONS[planId]}
        </div>
        <h2 className="font-display text-xl font-bold" style={{ color: 'var(--littera-ink)' }}>
          {plan.name}
        </h2>
        <div className="flex items-baseline gap-1 mt-1">
          {plan.price === 0 ? (
            <span className="font-display text-3xl font-bold" style={{ color: 'var(--littera-ink)' }}>
              Grátis
            </span>
          ) : (
            <>
              <span className="text-xs font-medium" style={{ color: 'var(--littera-slate)' }}>R$</span>
              <span className="font-display text-3xl font-bold" style={{ color: 'var(--littera-ink)' }}>
                {plan.price.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-xs" style={{ color: 'var(--littera-slate)' }}>/mês</span>
            </>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-2 flex-1">
        {ALL_FEATURES.map(({ key, label }) => {
          const value = PLAN_FEATURE_VALUES[planId][key]
          const enabled = value !== false
          return (
            <li
              key={key}
              className="flex items-start gap-2.5 text-sm sm:text-base"
              style={{ color: enabled ? 'var(--littera-ink)' : 'var(--littera-dust)' }}
            >
              <Check
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: enabled ? 'var(--littera-forest)' : 'var(--littera-dust)' }}
                strokeWidth={enabled ? 2.5 : 1.5}
              />
              <span>
                {typeof value === 'string' ? (
                  <><strong>{value}</strong>{' '}{label.toLowerCase().replace(/^[^—]+/, '').replace('correções por dia', '')}</>
                ) : (
                  label
                )}
              </span>
            </li>
          )
        })}
      </ul>

      {/* CTA */}
      <button
        onClick={() => onUpgrade(planId)}
        disabled={isCurrent || planId === 'free' || loading !== null}
        className="littera-btn w-full py-3 text-sm font-semibold rounded-xl transition-all"
        style={
          isCurrent
            ? { background: 'var(--littera-mist)', color: 'var(--littera-slate)', border: '1px solid var(--littera-dust)', cursor: 'default' }
            : planId === 'free'
            ? { background: 'var(--littera-mist)', color: 'var(--littera-slate)', border: '1px solid var(--littera-dust)', cursor: 'default' }
            : { background: colors.border, color: '#fff', boxShadow: 'var(--littera-shadow-sm)' }
        }
      >
        {loading === planId ? (
          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
        ) : isCurrent ? (
          'Plano atual'
        ) : planId === 'free' ? (
          'Plano padrão'
        ) : (
          `Assinar ${plan.name}`
        )}
      </button>
    </div>
  )
}
