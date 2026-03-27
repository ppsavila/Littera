'use client'

import { useState } from 'react'
import { X, Check, Zap, Crown, AlertCircle, Loader2 } from 'lucide-react'
import { PLANS, type Plan } from '@/lib/subscriptions/plans'

type UpgradeReason = 'daily_limit' | 'ai_analysis' | 'student_insights' | 'whatsapp'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  reason?: UpgradeReason
  currentPlan?: Plan
}

const REASON_COPY: Record<UpgradeReason, { title: string; description: string; suggestedPlan: Plan }> = {
  daily_limit: {
    title: 'Limite diário atingido',
    description: 'Você atingiu o limite de correções de hoje. Faça upgrade para corrigir mais redações.',
    suggestedPlan: 'plus',
  },
  ai_analysis: {
    title: 'Análise por IA',
    description: 'A revisão e comparação da nota por IA está disponível nos planos Plus e Premium.',
    suggestedPlan: 'plus',
  },
  student_insights: {
    title: 'Análise de progresso do aluno',
    description: 'Ver o progresso de um aluno ao longo de várias redações é exclusivo do plano Premium.',
    suggestedPlan: 'premium',
  },
  whatsapp: {
    title: 'Envio via WhatsApp',
    description: 'O envio de resultados por WhatsApp é exclusivo do plano Premium.',
    suggestedPlan: 'premium',
  },
}

const PLAN_ICONS: Record<Plan, React.ReactNode> = {
  free: null,
  plus: <Zap className="w-4 h-4" />,
  premium: <Crown className="w-4 h-4" />,
}

const PLAN_HIGHLIGHTS: Record<'plus' | 'premium', string[]> = {
  plus: [
    '10 correções por dia',
    'Análise por IA em todas as redações',
    'Suporte prioritário',
  ],
  premium: [
    'Correções ilimitadas por dia',
    'Análise por IA em todas as redações',
    'Análise de progresso por aluno',
    'Envio de notas por WhatsApp',
    'Suporte prioritário',
  ],
}

export function UpgradeModal({ open, onClose, reason = 'daily_limit', currentPlan = 'free' }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const copy = REASON_COPY[reason]

  if (!open) return null

  async function handleUpgrade(plan: 'plus' | 'premium') {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setError(data.error ?? 'Erro ao iniciar pagamento.')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const plansToShow: Array<'plus' | 'premium'> =
    copy.suggestedPlan === 'premium' ? ['plus', 'premium'] : ['plus', 'premium']

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'var(--littera-paper)',
          boxShadow: 'var(--littera-shadow-lg)',
          border: '1px solid var(--littera-dust)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--littera-slate)', background: 'var(--littera-mist)' }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div
          className="px-6 pt-6 pb-4"
          style={{ borderBottom: '1px solid var(--littera-dust)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'var(--littera-forest-light)', color: 'var(--littera-forest)' }}
          >
            <AlertCircle className="w-5 h-5" />
          </div>
          <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--littera-ink)' }}>
            {copy.title}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--littera-slate)' }}>
            {copy.description}
          </p>
        </div>

        {/* Plans */}
        <div className="p-6 grid grid-cols-2 gap-3">
          {plansToShow.map((planId) => {
            const plan = PLANS[planId]
            const highlights = PLAN_HIGHLIGHTS[planId]
            const isRecommended = planId === copy.suggestedPlan
            return (
              <div
                key={planId}
                className="rounded-xl p-4 flex flex-col gap-3 relative"
                style={{
                  border: isRecommended
                    ? '2px solid var(--littera-forest)'
                    : '1px solid var(--littera-dust)',
                  background: isRecommended ? 'var(--littera-forest-faint)' : 'var(--littera-parchment)',
                }}
              >
                {isRecommended && (
                  <span
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: 'var(--littera-forest)', color: '#fff' }}
                  >
                    Recomendado
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span style={{ color: plan.badge!.color }}>
                    {PLAN_ICONS[planId]}
                  </span>
                  <span className="font-semibold text-sm" style={{ color: 'var(--littera-ink)' }}>
                    {plan.name}
                  </span>
                </div>
                <div>
                  <span className="font-display text-xl font-bold" style={{ color: 'var(--littera-ink)' }}>
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-xs ml-1" style={{ color: 'var(--littera-slate)' }}>/mês</span>
                </div>
                <ul className="space-y-1.5 flex-1">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--littera-ink)' }}>
                      <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--littera-forest)' }} />
                      {h}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(planId)}
                  disabled={loading || currentPlan === planId}
                  className="littera-btn littera-btn-primary w-full py-2 text-sm mt-1"
                  style={
                    !isRecommended
                      ? {
                          background: 'var(--littera-mist)',
                          color: 'var(--littera-ink)',
                          border: '1px solid var(--littera-dust)',
                        }
                      : undefined
                  }
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Assinar ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>

        {error && (
          <p className="px-6 pb-4 text-sm text-center" style={{ color: 'var(--littera-rose)' }}>
            {error}
          </p>
        )}

        <div className="px-6 pb-5 text-center">
          <button onClick={onClose} className="text-xs" style={{ color: 'var(--littera-slate)' }}>
            Continuar com o plano Grátis
          </button>
        </div>
      </div>
    </div>
  )
}
