'use client'

import { Loader2 } from 'lucide-react'
import { type Plan } from '@/lib/subscriptions/plans'
import { PLAN_COLORS } from './PlanCard'

interface Props {
  pendingPlan: Plan
  cpf: string
  error: string
  loading: Plan | null
  onCpfChange: (formatted: string) => void
  onClose: () => void
  onSubmit: () => void
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function CpfModal({ pendingPlan, cpf, error, loading, onCpfChange, onClose, onSubmit }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
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
          onChange={(e) => onCpfChange(formatCpf(e.target.value))}
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
            onClick={onClose}
            className="flex-1 py-2.5 text-sm rounded-xl"
            style={{ border: '1px solid var(--littera-dust)', color: 'var(--littera-slate)' }}
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={loading !== null}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl"
            style={{ background: PLAN_COLORS[pendingPlan].border, color: '#fff' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  )
}
