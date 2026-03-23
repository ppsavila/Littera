import { UploadWizard } from '@/components/essay/UploadWizard'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewEssayPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Back link */}
      <Link
        href="/essays"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors"
        style={{ color: 'var(--littera-slate)' }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar para redações
      </Link>

      {/* Page heading */}
      <div className="mb-8 littera-fade-up">
        <h1
          className="font-display text-2xl sm:text-3xl font-semibold mb-1.5"
          style={{ color: 'var(--littera-ink)' }}
        >
          Nova Redação
        </h1>
        <p className="text-sm" style={{ color: 'var(--littera-slate)' }}>
          Faça o upload ou cole o texto da redação para iniciar a análise com IA
        </p>
        <div className="littera-rule mt-5" />
      </div>

      {/* Upload wizard — preserves all existing logic */}
      <div className="littera-fade-up delay-100">
        <UploadWizard />
      </div>
    </div>
  )
}
