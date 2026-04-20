'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { PLANS, type Plan } from '@/lib/subscriptions/plans'

interface Props {
  activePlan: Plan
  expiryDate: string | null
  error: string
  cancelling: boolean
  onClose: () => void
  onConfirm: () => void
}

export function CancelConfirmModal({ activePlan, expiryDate, error, cancelling, onClose, onConfirm }: Props) {
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
            onClick={onClose}
            className="flex-1 py-2.5 text-sm rounded-xl"
            style={{ border: '1px solid var(--littera-dust)', color: 'var(--littera-slate)' }}
          >
            Manter plano
          </button>
          <button
            onClick={onConfirm}
            disabled={cancelling}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl"
            style={{ background: '#dc2626', color: '#fff' }}
          >
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirmar cancelamento'}
          </button>
        </div>
      </div>
    </div>
  )
}
