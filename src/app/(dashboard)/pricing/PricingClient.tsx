'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, CheckCircle2 } from 'lucide-react'
import { usePostHog } from 'posthog-js/react'
import { PLANS, type Plan } from '@/lib/subscriptions/plans'
import { PlanCard, ALL_FEATURES, PLAN_FEATURE_VALUES, PLAN_COLORS } from './PlanCard'
import { CancelConfirmModal } from './CancelConfirmModal'
import { CpfModal } from './CpfModal'

interface PricingClientProps {
  currentPlan: Plan
  subscriptionsEnabled: boolean
  successPlan?: Plan
  subscriptionStatus: string | null
  subscriptionExpiresAt: string | null
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
  const posthog = usePostHog()
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
    posthog?.capture('pricing_page_viewed')
  }, [posthog])

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

  function handleUpgrade(plan: Plan) {
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

      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--littera-ink)' }}>
          Corrija mais. Ensine melhor.
        </h2>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {plans.map((planId) => (
          <PlanCard
            key={planId}
            planId={planId}
            activePlan={activePlan}
            loading={loading}
            onUpgrade={handleUpgrade}
          />
        ))}
      </div>

      <p className="text-sm text-center font-medium" style={{ color: 'var(--littera-slate-dark)' }}>
        Professores no plano Plus corrigem 5× mais redacoes por semana
      </p>

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
          <h3 className="font-semibold text-base" style={{ color: 'var(--littera-ink)' }}>
            Comparação detalhada
          </h3>
        </div>
        <table className="w-full text-sm sm:text-base" style={{ background: 'var(--littera-paper)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--littera-dust)' }}>
              <th className="text-left px-5 py-3 font-medium" style={{ color: 'var(--littera-slate)' }}>Recurso</th>
              {plans.map((p) => (
                <th key={p} className="text-center px-3 py-3.5 font-bold" style={{ color: activePlan === p ? 'var(--littera-forest)' : 'var(--littera-ink)' }}>
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
                <td className="px-5 py-3.5" style={{ color: 'var(--littera-ink)' }}>{label}</td>
                {plans.map((p) => {
                  const value = PLAN_FEATURE_VALUES[p][key]
                  return (
                    <td key={p} className="text-center px-3 py-3.5" style={{ color: 'var(--littera-slate)' }}>
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

      <p className="text-xs text-center" style={{ color: 'var(--littera-slate-dark)' }}>
        Pagamentos processados com segurança via Abacate.pay · Cancele quando quiser
      </p>

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <CancelConfirmModal
          activePlan={activePlan}
          expiryDate={expiryDate}
          error={error}
          cancelling={cancelling}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={handleCancel}
        />
      )}

      {/* CPF modal */}
      {pendingPlan && (
        <CpfModal
          pendingPlan={pendingPlan}
          cpf={cpf}
          error={error}
          loading={loading}
          onCpfChange={setCpf}
          onClose={() => setPendingPlan(null)}
          onSubmit={submitCheckout}
        />
      )}
    </div>
  )
}
