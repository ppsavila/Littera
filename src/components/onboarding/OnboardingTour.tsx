'use client'

import { useEffect, useState } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

const STORAGE_KEY = 'littera_tour_v1_done'
const TOOLTIP_W = 288
const TOOLTIP_H_EST = 180
const PAD = 8

interface Step {
  target: string
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    target: 'annotation-tools',
    title: 'Ferramentas de anotação',
    description:
      'Use estas ferramentas para destacar trechos, desenhar, adicionar setas, texto e marcadores na redação. Atalhos: H (destaque), P (caneta), A (seta), T (texto), M (marcador), E (apagar).',
  },
  {
    target: 'error-mode',
    title: 'Modo Erros',
    description:
      'Ative o modo erros e clique em qualquer ponto da redação para registrar um erro com código, competência e dedução de pontos.',
  },
  {
    target: 'annotations-btn',
    title: 'Painel de anotações',
    description:
      'Veja todas as anotações e erros marcados em um só lugar. Clique no ícone de lixo ao lado de qualquer item para removê-lo rapidamente.',
  },
  {
    target: 'scoring-btn',
    title: 'Notas por competência',
    description:
      'Registre a nota de cada competência (0–200), adicione observações específicas e um comentário geral para o aluno.',
  },
  {
    target: 'export-btn',
    title: 'Exportar PDF',
    description:
      'Gere um PDF completo com a redação, todas as marcações, erros e um resumo das notas por competência.',
  },
  {
    target: 'save-btn',
    title: 'Salvar correção',
    description:
      'Salva as notas e marca a redação como corrigida. O botão fica verde e ativo sempre que há alterações pendentes.',
  },
]

interface SpotRect {
  left: number
  top: number
  width: number
  height: number
}

export function OnboardingTour() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [spot, setSpot] = useState<SpotRect | null>(null)
  const [vp, setVp] = useState({ w: 0, h: 0 })

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    requestAnimationFrame(() => {
      setVp({ w: window.innerWidth, h: window.innerHeight })
      const el = document.querySelector<HTMLElement>(`[data-tour="${STEPS[step].target}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        setSpot({ left: r.left - PAD, top: r.top - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 })
      } else {
        setSpot(null)
      }
    })
  }, [step, visible])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  // ── Tooltip position ─────────────────────────────────────────────────────────
  let tooltipStyle: React.CSSProperties
  if (spot && vp.w > 0) {
    const centerX = spot.left + spot.width / 2 - TOOLTIP_W / 2
    const clampedX = Math.max(12, Math.min(vp.w - TOOLTIP_W - 12, centerX))
    const below = spot.top + spot.height + 12
    const above = spot.top - TOOLTIP_H_EST - 12
    const rightX = spot.left + spot.width + 12

    if (below + TOOLTIP_H_EST < vp.h) {
      tooltipStyle = { top: below, left: clampedX }
    } else if (above > 12) {
      tooltipStyle = { top: above, left: clampedX }
    } else if (rightX + TOOLTIP_W < vp.w) {
      const clampedY = Math.max(12, Math.min(vp.h - TOOLTIP_H_EST - 12, spot.top))
      tooltipStyle = { top: clampedY, left: rightX }
    } else {
      const leftX = spot.left - TOOLTIP_W - 12
      const clampedY = Math.max(12, Math.min(vp.h - TOOLTIP_H_EST - 12, spot.top))
      tooltipStyle = { top: clampedY, left: Math.max(12, leftX) }
    }
  } else {
    tooltipStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  const current = STEPS[step]

  return (
    <>
      {/* SVG overlay with spotlight hole */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9000 }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="littera-tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {spot && (
                <rect
                  x={spot.left}
                  y={spot.top}
                  width={spot.width}
                  height={spot.height}
                  rx="6"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.52)" mask="url(#littera-tour-mask)" />
        </svg>
      </div>

      {/* Click-outside catcher */}
      <div className="fixed inset-0" style={{ zIndex: 9001 }} onClick={dismiss} />

      {/* Spotlight border */}
      {spot && (
        <div
          className="fixed rounded-lg pointer-events-none"
          style={{
            zIndex: 9002,
            left: spot.left,
            top: spot.top,
            width: spot.width,
            height: spot.height,
            outline: '2px solid var(--littera-forest)',
            boxShadow: '0 0 0 3px rgba(26,77,58,0.15)',
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className="fixed rounded-xl shadow-2xl p-4 flex flex-col gap-3"
        style={{
          ...tooltipStyle,
          zIndex: 9003,
          width: TOOLTIP_W,
          background: 'var(--littera-paper)',
          border: '1px solid var(--littera-dust)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div
              className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
              style={{ color: 'var(--littera-forest)' }}
            >
              {step + 1} de {STEPS.length}
            </div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--littera-ink)' }}>
              {current.title}
            </h3>
          </div>
          <button
            onClick={dismiss}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--littera-slate)' }}
            title="Pular tour"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--littera-slate)' }}>
          {current.description}
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === step ? 18 : 6,
                height: 6,
                background: i === step ? 'var(--littera-forest)' : 'var(--littera-dust)',
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: 'var(--littera-slate)' }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Anterior
          </button>
          <button
            onClick={() => (step === STEPS.length - 1 ? dismiss() : setStep((s) => s + 1))}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'var(--littera-forest)', color: '#fff' }}
          >
            {step === STEPS.length - 1 ? 'Concluir' : 'Próximo'}
            {step < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </>
  )
}
