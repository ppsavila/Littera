'use client'

import { useState } from 'react'
import { X, Check, Zap, Crown, Star, AlertCircle, Loader2 } from 'lucide-react'
import { PLANS, type Plan } from '@/lib/subscriptions/plans'

type UpgradeReason = 'daily_limit' | 'ai_analysis' | 'student_insights' | 'whatsapp' | 'welcome'

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
  welcome: {
    title: 'Bem-vindo ao Littera',
    description: 'Escolha o plano certo para o seu ritmo de correção.',
    suggestedPlan: 'plus',
  },
}

const PLAN_ICONS: Record<Plan, React.ReactNode> = {
  free: <Star className="w-4 h-4" />,
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

const WELCOME_FEATURES = [
  { label: 'Correções por dia', free: '2 por dia', plus: '10 por dia', premium: 'Ilimitadas' },
  { label: 'Análise por IA', free: false, plus: true, premium: true },
  { label: 'Progresso do aluno', free: false, plus: false, premium: true },
  { label: 'Envio por WhatsApp', free: false, plus: false, premium: true },
]

const WELCOME_PLAN_COLORS: Record<Plan, { icon: string; border: string; bg: string }> = {
  free: {
    icon: 'var(--littera-slate)',
    border: 'var(--littera-dust)',
    bg: 'var(--littera-paper)',
  },
  plus: {
    icon: '#7c3aed',
    border: '#7c3aed',
    bg: '#faf5ff',
  },
  premium: {
    icon: '#b45309',
    border: '#b45309',
    bg: '#fffbeb',
  },
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

  const isWelcome = reason === 'welcome'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`littera-scale-in relative w-full rounded-2xl overflow-hidden ${isWelcome ? 'max-w-xl' : 'max-w-lg'}`}
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
            {isWelcome ? <Zap className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--littera-ink)' }}>
            {copy.title}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--littera-slate)' }}>
            {copy.description}
          </p>
        </div>

        {isWelcome ? (
          /* Welcome 3-column plan comparison */
          <>
            <div className="p-6 grid grid-cols-3 gap-3">
              {(['free', 'plus', 'premium'] as Plan[]).map((planId) => {
                const plan = PLANS[planId]
                const colors = WELCOME_PLAN_COLORS[planId]
                const isPlus = planId === 'plus'
                return (
                  <div
                    key={planId}
                    className="rounded-xl p-4 flex flex-col gap-2 relative"
                    style={{
                      border: `2px solid ${colors.border}`,
                      background: colors.bg,
                    }}
                  >
                    {isPlus && (
                      <span
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-bold px-2.5 py-0.5 rounded-full"
                        style={{ background: '#7c3aed', color: '#fff' }}
                      >
                        Popular
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: colors.icon }}>
                        {PLAN_ICONS[planId]}
                      </span>
                      <span className="font-semibold text-sm" style={{ color: 'var(--littera-ink)' }}>
                        {plan.name}
                      </span>
                    </div>
                    <div>
                      {plan.price === 0 ? (
                        <span className="font-display text-lg font-bold" style={{ color: 'var(--littera-ink)' }}>
                          Grátis
                        </span>
                      ) : (
                        <>
                          <span className="font-display text-lg font-bold" style={{ color: 'var(--littera-ink)' }}>
                            R$ {plan.price.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-xs ml-1" style={{ color: 'var(--littera-slate)' }}>/mês</span>
                        </>
                      )}
                    </div>
                    <ul className="space-y-1.5 flex-1">
                      {WELCOME_FEATURES.map((feature) => {
                        const value = feature[planId as 'free' | 'plus' | 'premium']
                        const isString = typeof value === 'string'
                        const isEnabled = value === true
                        return (
                          <li
                            key={feature.label}
                            className="flex items-start gap-1.5 text-xs"
                            style={{ color: isEnabled || isString ? 'var(--littera-ink)' : 'var(--littera-slate)' }}
                          >
                            {isEnabled ? (
                              <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--littera-forest)' }} />
                            ) : (
                              <span className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 flex items-center justify-center text-xs leading-none">—</span>
                            )}
                            {isString ? value : feature.label}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>

            {error && (
              <p className="px-6 pb-2 text-sm text-center" style={{ color: 'var(--littera-rose)' }}>
                {error}
              </p>
            )}

            <div className="px-6 pb-6 flex flex-col gap-2 items-center">
              <button
                onClick={() => handleUpgrade('plus')}
                disabled={loading}
                className="littera-btn littera-btn-primary w-full py-2.5 text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Assinar Plus — R$ 9,90/mês'}
              </button>
              <button
                onClick={onClose}
                className="text-xs py-1"
                style={{ color: 'var(--littera-slate)' }}
              >
                Começar com o plano Grátis
              </button>
            </div>
          </>
        ) : (
          /* Standard 2-column upgrade layout */
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
