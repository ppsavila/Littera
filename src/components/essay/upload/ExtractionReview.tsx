'use client'

import { Loader2, Sparkles, ChevronRight, SkipForward, AlertTriangle } from 'lucide-react'

type ExtractionState = 'idle' | 'extracting' | 'done' | 'error'

interface Props {
  preview: string | null
  extractionState: ExtractionState
  extractedText: string
  onExtractedTextChange: (text: string) => void
  onContinue: () => void
  onSkip: () => void
}

export function ExtractionReview({
  preview,
  extractionState,
  extractedText,
  onExtractedTextChange,
  onContinue,
  onSkip,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Image thumbnail */}
      {preview && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--littera-dust)', maxHeight: '220px' }}
        >
          <img
            src={preview}
            alt="Redação"
            className="w-full object-contain"
            style={{ maxHeight: '220px', background: 'var(--littera-mist)' }}
          />
        </div>
      )}

      {extractionState === 'extracting' && (
        <div
          className="rounded-xl p-6 flex flex-col items-center gap-3"
          style={{
            background: 'var(--littera-paper)',
            border: '1px solid var(--littera-dust)',
          }}
        >
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--littera-forest)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--littera-ink)' }}>
            Extraindo texto com IA...
          </p>
          <p className="text-xs text-center" style={{ color: 'var(--littera-slate)' }}>
            Lendo a redação e transcrevendo o conteúdo
          </p>
        </div>
      )}

      {extractionState === 'done' && (
        <div className="space-y-3">
          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--littera-paper)',
              border: '1px solid var(--littera-dust)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--littera-forest)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--littera-ink)' }}>
                Texto extraído pela IA
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--littera-slate)' }}>
              Verifique se o texto foi extraído corretamente. Corrija apenas erros de leitura — erros de ortografia do aluno devem ser mantidos.
            </p>
            <div className="flex justify-center">
              <textarea
                value={extractedText}
                onChange={(e) => onExtractedTextChange(e.target.value)}
                rows={14}
                className="resize-none w-full font-serif leading-relaxed text-gray-900 focus:outline-none"
                style={{
                  maxWidth: 540,
                  padding: '2rem',
                  fontSize: '0.9375rem',
                  lineHeight: 1.8,
                  background: '#fff',
                  border: '1px solid var(--littera-dust)',
                  borderRadius: 8,
                  boxShadow: 'var(--littera-shadow-sm)',
                }}
              />
            </div>
            <p className="text-xs mt-1 text-center" style={{ color: 'var(--littera-slate)' }}>
              {extractedText.length} caracteres
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onContinue}
              disabled={!extractedText.trim()}
              className="littera-btn littera-btn-primary px-5 py-2 text-sm"
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onSkip}
              className="text-sm"
              style={{ color: 'var(--littera-slate)' }}
            >
              <SkipForward className="w-3 h-3 inline mr-1" />
              Usar sem texto
            </button>
          </div>
        </div>
      )}

      {extractionState === 'error' && (
        <div className="space-y-3">
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{
              background: 'var(--littera-rose-light)',
              border: '1px solid rgba(190,18,60,0.20)',
            }}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--littera-rose)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--littera-rose)' }}>
                Não foi possível extrair o texto automaticamente
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--littera-rose)' }}>
                A redação será salva normalmente, mas a análise de IA não estará disponível.
              </p>
            </div>
          </div>
          <button
            onClick={onContinue}
            className="littera-btn littera-btn-outline px-5 py-2 text-sm"
          >
            Continuar assim mesmo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
