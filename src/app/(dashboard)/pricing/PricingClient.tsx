'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap, Crown, Loader2, Star, CheckCircle2, AlertTriangle } from 'lucide-react'
import { PLANS, type Plan } from '@/lib/subscriptions/plans'

interface PricingClientProps {
  currentPlan: Plan
  subscriptionsEnabled: boolean
  successPlan?: Plan
  subscriptionStatus: string | null
  subscriptionExpiresAt: string | null
}

const PLAN_ICONS: Record<Plan, React.ReactNode> = {
  free: <Star className="w-5 h-5" />,
  plus: <Zap className="w-5 h-5" />,
  premium: <Crown className="w-5 h-5" />,
}

const ALL_FEATURES = [
  { key: 'corrections', label: 'Correções por dia' },
  { key: 'aiAnalysis', label: 'Análise por IA (revisão e nota)' },
  { key: 'studentInsights', label: 'Análise de progresso por aluno' },
  { key: 'whatsapp', label: 'Envio de notas por WhatsApp' },
] as const

const PLAN_FEATURE_VALUES: Record<Plan, Record<typeof ALL_FEATURES[number]['key'], string | boolean>> = {
  free: {
    corrections: '2 por dia',
    aiAnalysis: false,
    studentInsights: false,
    whatsapp: false,
  },
  plus: {
    corrections: '10 por dia',
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

const PLAN_COLORS: Record<Plan, { icon: string; border: string; bg: string }> = {
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

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function isValidCpf(digits: string): boolean {
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(digits[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(digits[10])
}

export function PricingClient({ currentPlan, subscriptionsEnabled, successPlan, subscriptionStatus, subscriptionExpiresAt }: PricingClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<Plan | null>(null)
  const [error, setError] = useState('')
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null)
  const [cpf, setCpf] = useState('')
  const [activePlan, setActivePlan] = useState<Plan>(currentPlan)
  const [justActivated, setJustActivated] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelledUntil, setCancelledUntil] = useState<string | null>(null)
  const [activeStatus, setActiveStatus] = useState(subscriptionStatus)

  useEffect(() => {
    if (!successPlan) return
    fetch('/api/subscription/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: successPlan }),
    }).then((res) => {
      if (res.ok) {
        setActivePlan(successPlan)
        setJustActivated(true)
        window.history.replaceState({}, '', '/pricing')
        router.refresh()
      }
    })
  }, [successPlan, router])

  async function handleUpgrade(plan: Plan) {
    if (plan === 'free' || plan === currentPlan) return
    setPendingPlan(plan)
    setCpf('')
    setError('')
  }

  async function submitCheckout() {
    if (!pendingPlan) return
    const digits = cpf.replace(/\D/g, '')
    if (!isValidCpf(digits)) {
      setError('CPF inválido. Verifique os números e tente novamente.')
      return
    }
    setLoading(pendingPlan)
    setError('')
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: pendingPlan, taxId: digits }),
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
      setLoading(null)
      setPendingPlan(null)
    }
  }

  async function handleCancel() {
    setCancelling(true)
    setError('')
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao cancelar assinatura.')
      } else {
        setActiveStatus('cancelled')
        setCancelledUntil(data.accessUntil)
        setShowCancelConfirm(false)
        router.refresh()
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setCancelling(false)
    }
  }

  const plans: Plan[] = ['free', 'plus', 'premium']
  const canCancel = activePlan !== 'free' && activeStatus === 'active'
  const isCancelled = activeStatus === 'cancelled'
  const expiryDate = (cancelledUntil ?? subscriptionExpiresAt)
    ? new Date(cancelledUntil ?? subscriptionExpiresAt!).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="space-y-6 littera-fade-up">
      {justActivated && (
        <div
          className="rounded-xl p-4 text-sm text-center flex items-center justify-center gap-2"
          style={{
            background: 'var(--littera-forest-faint)',
            border: '1px solid var(--littera-forest-light)',
            color: 'var(--littera-forest)',
          }}
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>
            <strong>Assinatura confirmada!</strong> Seu plano <strong>{PLANS[activePlan].name}</strong> já está ativo.
          </span>
        </div>
      )}

      {!subscriptionsEnabled && (
        <div
          className="rounded-xl p-4 text-sm text-center"
          style={{
            background: 'var(--littera-forest-faint)',
            border: '1px solid var(--littera-forest-light)',
            color: 'var(--littera-forest)',
          }}
        >
          <strong>Período de testes:</strong> todos os recursos estão liberados gratuitamente enquanto o sistema está em testes. Os planos entrarão em vigor em breve.
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((planId) => {
          const plan = PLANS[planId]
          const colors = PLAN_COLORS[planId]
          const isCurrent = activePlan === planId
          const isRecommended = planId === 'plus'

          return (
            <div
              key={planId}
              className="rounded-2xl p-5 flex flex-col gap-4 relative"
              style={{
                background: colors.bg,
                border: `${isCurrent ? '2px' : '1px'} solid ${isCurrent ? colors.border : 'var(--littera-dust)'}`,
                boxShadow: isCurrent ? 'var(--littera-shadow)' : 'var(--littera-shadow-sm)',
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
                <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--littera-ink)' }}>
                  {plan.name}
                </h2>
                <div className="flex items-baseline gap-1 mt-1">
                  {plan.price === 0 ? (
                    <span className="font-display text-2xl font-bold" style={{ color: 'var(--littera-ink)' }}>
                      Grátis
                    </span>
                  ) : (
                    <>
                      <span className="text-xs font-medium" style={{ color: 'var(--littera-slate)' }}>R$</span>
                      <span className="font-display text-2xl font-bold" style={{ color: 'var(--littera-ink)' }}>
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
                      className="flex items-start gap-2 text-sm"
                      style={{ color: enabled ? 'var(--littera-ink)' : 'var(--littera-dust)' }}
                    >
                      <Check
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
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
                onClick={() => handleUpgrade(planId)}
                disabled={isCurrent || planId === 'free' || loading !== null}
                className="littera-btn w-full py-2.5 text-sm font-semibold rounded-xl transition-all"
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
        })}
      </div>

      {error && (
        <p className="text-sm text-center" style={{ color: 'var(--littera-rose)' }}>
          {error}
        </p>
      )}

      {/* Feature comparison table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--littera-dust)' }}
      >
        <div
          className="px-5 py-3"
          style={{ background: 'var(--littera-mist)', borderBottom: '1px solid var(--littera-dust)' }}
        >
          <h3 className="font-semibold text-sm" style={{ color: 'var(--littera-ink)' }}>
            Comparação detalhada
          </h3>
        </div>
        <table className="w-full text-sm" style={{ background: 'var(--littera-paper)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--littera-dust)' }}>
              <th className="text-left px-5 py-3 font-medium" style={{ color: 'var(--littera-slate)' }}>Recurso</th>
              {plans.map((p) => (
                <th key={p} className="text-center px-3 py-3 font-semibold" style={{ color: activePlan === p ? 'var(--littera-forest)' : 'var(--littera-ink)' }}>
                  {PLANS[p].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_FEATURES.map(({ key, label }, i) => (
              <tr
                key={key}
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'var(--littera-parchment)',
                  borderBottom: i < ALL_FEATURES.length - 1 ? '1px solid var(--littera-dust)' : undefined,
                }}
              >
                <td className="px-5 py-3" style={{ color: 'var(--littera-ink)' }}>{label}</td>
                {plans.map((p) => {
                  const value = PLAN_FEATURE_VALUES[p][key]
                  return (
                    <td key={p} className="text-center px-3 py-3" style={{ color: 'var(--littera-slate)' }}>
                      {typeof value === 'string' ? (
                        <span className="font-medium" style={{ color: 'var(--littera-ink)' }}>{value}</span>
                      ) : value ? (
                        <Check className="w-4 h-4 mx-auto" style={{ color: 'var(--littera-forest)' }} />
                      ) : (
                        <span style={{ color: 'var(--littera-dust)' }}>—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Subscription management */}
      {subscriptionsEnabled && (canCancel || isCancelled) && (
        <div
          className="rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{ background: 'var(--littera-mist)', border: '1px solid var(--littera-dust)' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--littera-ink)' }}>
              {isCancelled ? 'Assinatura cancelada' : `Plano ${PLANS[activePlan].name} ativo`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--littera-slate)' }}>
              {isCancelled && expiryDate
                ? `Acesso garantido até ${expiryDate}. Após essa data, o plano volta para Grátis.`
                : expiryDate
                ? `Próxima renovação: ${expiryDate}`
                : 'Cobrança mensal via PIX'}
            </p>
          </div>
          {canCancel && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-xs font-medium flex-shrink-0 px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#dc2626', border: '1px solid #fecaca', background: '#fff1f1' }}
            >
              Cancelar assinatura
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-center" style={{ color: 'var(--littera-slate)' }}>
        Pagamentos processados com segurança via Abacate.pay · Cancele quando quiser
      </p>

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowCancelConfirm(false)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm space-y-4"
            style={{ background: 'var(--littera-paper)', boxShadow: 'var(--littera-shadow)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fff1f1' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#dc2626' }} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-base" style={{ color: 'var(--littera-ink)' }}>
                  Cancelar assinatura?
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--littera-slate)' }}>
                  As cobranças param imediatamente.
                  {expiryDate ? ` Você mantém acesso ao plano ${PLANS[activePlan].name} até ${expiryDate}.` : ' Seu acesso permanece até o fim do período pago.'}
                </p>
              </div>
            </div>
            {error && (
              <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 text-sm rounded-xl"
                style={{ border: '1px solid var(--littera-dust)', color: 'var(--littera-slate)' }}
              >
                Manter plano
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl"
                style={{ background: '#dc2626', color: '#fff' }}
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CPF modal */}
      {pendingPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setPendingPlan(null)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm space-y-4"
            style={{ background: 'var(--littera-paper)', boxShadow: 'var(--littera-shadow)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--littera-ink)' }}>
              Confirmar assinatura
            </h3>
            <p className="text-sm" style={{ color: 'var(--littera-slate)' }}>
              Digite seu CPF para continuar para o pagamento.
            </p>
            <input
              type="text"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                border: '1px solid var(--littera-dust)',
                background: 'var(--littera-mist)',
                color: 'var(--littera-ink)',
              }}
            />
            {error && (
              <p className="text-xs" style={{ color: 'var(--littera-rose)' }}>{error}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setPendingPlan(null)}
                className="flex-1 py-2.5 text-sm rounded-xl"
                style={{ border: '1px solid var(--littera-dust)', color: 'var(--littera-slate)' }}
              >
                Cancelar
              </button>
              <button
                onClick={submitCheckout}
                disabled={loading !== null}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl"
                style={{ background: PLAN_COLORS[pendingPlan].border, color: '#fff' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
