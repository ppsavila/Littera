'use client'

import { ChevronRight, Loader2 } from 'lucide-react'
import { UpgradeModal } from '@/components/subscription/UpgradeModal'

interface Props {
  title: string
  theme: string
  studentName: string
  className: string
  submitting: boolean
  error: string
  showUpgradeModal: boolean
  onTitleChange: (v: string) => void
  onThemeChange: (v: string) => void
  onStudentNameChange: (v: string) => void
  onClassNameChange: (v: string) => void
  onBack: () => void
  onSubmit: (e: React.FormEvent) => void
  onCloseUpgradeModal: () => void
}

export function MetadataForm({
  title,
  theme,
  studentName,
  className,
  submitting,
  error,
  showUpgradeModal,
  onTitleChange,
  onThemeChange,
  onStudentNameChange,
  onClassNameChange,
  onBack,
  onSubmit,
  onCloseUpgradeModal,
}: Props) {
  return (
    <>
      <UpgradeModal
        open={showUpgradeModal}
        onClose={onCloseUpgradeModal}
        reason="daily_limit"
      />
      <form onSubmit={onSubmit} className="space-y-6">
        <div
          className="rounded-xl p-5"
          style={{
            background: 'var(--littera-paper)',
            border: '1px solid var(--littera-dust)',
            boxShadow: 'var(--littera-shadow-sm)',
          }}
        >
          <h2
            className="font-display text-base font-semibold mb-4"
            style={{ color: 'var(--littera-ink)' }}
          >
            Informações da Redação
          </h2>

          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--littera-ink)' }}
              >
                Título <span style={{ color: 'var(--littera-rose)' }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                required
                placeholder="Ex: Redação - João Silva - Turma 3A"
                className="littera-input"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--littera-ink)' }}
              >
                Tema da Redação
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => onThemeChange(e.target.value)}
                placeholder="Ex: O desafio do combate à desinformação no Brasil"
                className="littera-input"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--littera-slate)' }}>
                Informar o tema melhora a análise da IA
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--littera-ink)' }}
                >
                  Nome do Aluno
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => onStudentNameChange(e.target.value)}
                  placeholder="Nome completo"
                  className="littera-input"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--littera-ink)' }}
                >
                  Turma
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => onClassNameChange(e.target.value)}
                  placeholder="Ex: 3A"
                  className="littera-input"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm"
            style={{
              background: 'var(--littera-rose-light)',
              border: '1px solid rgba(190,18,60,0.20)',
              color: 'var(--littera-rose)',
            }}
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="littera-btn littera-btn-outline px-4 py-2 text-sm"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={submitting || !title}
            className="littera-btn littera-btn-primary px-6 py-2 text-sm"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {submitting ? 'Criando...' : 'Criar e analisar'}
          </button>
        </div>
      </form>
    </>
  )
}
