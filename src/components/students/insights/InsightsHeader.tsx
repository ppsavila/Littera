'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Student } from '@/types/essay'

interface Props {
  student: Student
  essayCount: number
  overallAvg: number | null
}

export function InsightsHeader({ student, essayCount, overallAvg }: Props) {
  const initial = student.name.charAt(0).toUpperCase()

  return (
    <div className="littera-fade-up space-y-4">
      {/* Voltar */}
      <Link
        href="/students"
        className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: 'var(--littera-slate)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Todos os alunos
      </Link>

      {/* Info do aluno */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'var(--littera-forest-light)',
            color: 'var(--littera-forest)',
          }}
        >
          <span className="text-xl font-display font-bold">{initial}</span>
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <h1
            className="font-display text-2xl sm:text-3xl font-semibold truncate"
            style={{ color: 'var(--littera-ink)' }}
          >
            {student.name}
          </h1>
          {student.class_name && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--littera-slate)' }}>
              {student.class_name}
            </p>
          )}
        </div>

        {/* Stats rápidas */}
        <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
          <Stat label="Redações" value={essayCount} />
          {overallAvg !== null && (
            <Stat label="Média geral" value={`${overallAvg} pts`} highlight />
          )}
        </div>
      </div>

      {/* Stats mobile */}
      <div className="flex items-center gap-4 sm:hidden">
        <Stat label="Redações corrigidas" value={essayCount} />
        {overallAvg !== null && (
          <Stat label="Média geral" value={`${overallAvg} pts`} highlight />
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div
      className="px-4 py-2.5 rounded-xl text-center"
      style={{
        background: highlight ? 'var(--littera-forest-light)' : 'var(--littera-paper)',
        border: `1px solid ${highlight ? 'rgba(75,0,130,0.15)' : 'var(--littera-dust)'}`,
        boxShadow: 'var(--littera-shadow-sm)',
      }}
    >
      <p
        className="text-lg font-display font-bold leading-tight"
        style={{ color: highlight ? 'var(--littera-forest)' : 'var(--littera-ink)' }}
      >
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--littera-slate)' }}>
        {label}
      </p>
    </div>
  )
}
