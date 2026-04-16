'use client'

import { useState } from 'react'
import { CheckCircle, Copy, MessageCircle, ExternalLink, X, Check } from 'lucide-react'
import { usePostHog } from 'posthog-js/react'
import type { Essay } from '@/types/essay'

interface Props {
  essay: Essay
  totalScore: number
  shareUrl: string
  onClose: () => void
}

function buildWhatsAppText(essay: Essay, shareUrl: string): string {
  const lines = [
    `📝 *Correção: ${essay.title}*`,
    essay.theme ? `Tema: ${essay.theme}` : '',
    '',
    `🔗 Veja sua redação corrigida:`,
    shareUrl,
  ].filter((l) => l !== '')
  return lines.join('\n')
}

export function CorrectionResultModal({ essay, totalScore, shareUrl, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const posthog = usePostHog()

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      posthog?.capture('share_link_copied', { essay_id: essay.id })
    } catch {
      // Fallback for insecure contexts
      const el = document.createElement('input')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  function handleWhatsApp() {
    const text = buildWhatsAppText(essay, shareUrl)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    posthog?.capture('export_triggered', { format: 'whatsapp' })
  }

  const scorePercent = Math.round((totalScore / 1000) * 100)

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[200] p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--littera-paper)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ color: 'var(--littera-slate)', background: 'var(--littera-mist)' }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Score hero */}
        <div
          className="px-8 pt-8 pb-6 flex flex-col items-center text-center"
          style={{ background: 'var(--littera-forest)' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-white font-bold text-xl mb-1">Correção concluída!</h2>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {essay.title}
          </p>

          {/* Score ring */}
          <div className="flex flex-col items-center">
            <span className="text-5xl font-bold text-white">{totalScore}</span>
            <span className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              / 1000 pontos
            </span>
            {/* Progress bar */}
            <div
              className="mt-3 h-2 rounded-full overflow-hidden"
              style={{ width: 200, background: 'rgba(255,255,255,0.2)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${scorePercent}%`,
                  background: scorePercent >= 70
                    ? '#4ade80'
                    : scorePercent >= 40
                    ? '#fbbf24'
                    : '#f87171',
                }}
              />
            </div>
          </div>
        </div>

        {/* Share section */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--littera-ink)' }}>
            Compartilhar correção
          </p>
          <p className="text-xs" style={{ color: 'var(--littera-slate)' }}>
            Qualquer pessoa com o link pode ver a redação corrigida com os erros marcados.
          </p>

          {/* Link box */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{
              background: 'var(--littera-parchment)',
              border: '1px solid var(--littera-dust)',
            }}
          >
            <span
              className="flex-1 text-xs font-mono truncate"
              style={{ color: 'var(--littera-slate)' }}
            >
              {shareUrl}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all"
              style={
                copied
                  ? { background: '#dcfce7', color: '#16a34a' }
                  : { background: 'var(--littera-forest)', color: '#fff' }
              }
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: '#f0fdf4',
              color: '#16a34a',
              border: '1px solid #bbf7d0',
            }}
          >
            <MessageCircle className="w-4 h-4" />
            Enviar pelo WhatsApp
          </button>

          {/* View shared page */}
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'var(--littera-mist)',
              color: 'var(--littera-slate)',
              border: '1px solid var(--littera-dust)',
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver página da correção
          </a>

          {/* Continue editing */}
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-medium transition-colors"
            style={{ color: 'var(--littera-slate)' }}
          >
            Continuar editando
          </button>
        </div>
      </div>
    </div>
  )
}
