import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'
import type { Essay } from '@/types/essay'
import { EssayStatusBadge } from '@/components/essay/EssayStatusBadge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: essays } = await supabase
    .from('essays')
    .select('*, student:students(name, class_name)')
    .eq('teacher_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const total = essays?.length ?? 0
  const pending = essays?.filter((e) => e.status === 'pending').length ?? 0
  const inProgress = essays?.filter((e) => ['analyzing', 'correcting'].includes(e.status)).length ?? 0
  const done = essays?.filter((e) => e.status === 'done').length ?? 0
  const avgScore = done > 0
    ? Math.round(
        (essays ?? [])
          .filter((e) => e.status === 'done' && e.total_score > 0)
          .reduce((s, e) => s + e.total_score, 0) / done
      )
    : null
  const recent = (essays ?? []).slice(0, 5)

  const stats: { label: string; value: string | number; sub?: string; accent: string; bg: string; border: string }[] = [
    {
      label: 'Total',
      value: total,
      sub: 'redações',
      accent: 'var(--littera-forest)',
      bg: 'var(--littera-forest-light)',
      border: 'rgba(26,77,58,0.18)',
    },
    {
      label: 'Pendentes',
      value: pending,
      sub: 'para corrigir',
      accent: 'var(--littera-amber)',
      bg: 'var(--littera-amber-light)',
      border: 'rgba(180,83,9,0.18)',
    },
    {
      label: 'Em andamento',
      value: inProgress,
      sub: 'em revisão',
      accent: 'var(--littera-sky)',
      bg: 'var(--littera-sky-light)',
      border: 'rgba(3,105,161,0.18)',
    },
    {
      label: 'Nota média',
      value: avgScore !== null ? avgScore : '—',
      sub: avgScore !== null ? 'de 1000' : 'sem concluídas',
      accent: 'var(--littera-gold)',
      bg: 'var(--littera-gold-light)',
      border: 'rgba(201,134,10,0.18)',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Greeting */}
      <div className="littera-fade-up">
        <h1
          className="font-display text-2xl sm:text-3xl font-semibold mb-1"
          style={{ color: 'var(--littera-ink)' }}
        >
          Bem-vindo ao Littera
        </h1>
        <p className="text-sm" style={{ color: 'var(--littera-slate)' }}>
          Resumo das suas redações e atividades recentes.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 littera-fade-up delay-100">
        {stats.map(({ label, value, sub, accent, bg, border }) => (
          <div
            key={label}
            className="rounded-xl p-4 transition-shadow hover:shadow-md"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: accent }}>
              {label}
            </p>
            <p
              className="font-display text-2xl font-bold tabular-nums"
              style={{ color: accent }}
            >
              {value}
            </p>
            {sub && (
              <p className="text-xs mt-1" style={{ color: accent, opacity: 0.65 }}>
                {sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 littera-fade-up delay-150">
        <Link
          href="/essays/new"
          className="littera-btn littera-btn-primary px-4 py-2.5 text-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Redação
        </Link>
        <Link
          href="/essays"
          className="littera-btn littera-btn-outline px-4 py-2.5 text-sm"
        >
          Ver todas as redações
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Recent essays */}
      <div className="littera-fade-up delay-200">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-display text-lg font-semibold"
            style={{ color: 'var(--littera-ink)' }}
          >
            Redações recentes
          </h2>
          <Link
            href="/essays"
            className="text-xs font-medium transition-colors"
            style={{ color: 'var(--littera-forest)' }}
          >
            Ver todas →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div
            className="text-center py-14 rounded-xl"
            style={{
              background: 'var(--littera-paper)',
              border: '1.5px dashed var(--littera-dust)',
            }}
          >
            <p
              className="font-display text-4xl mb-3"
              style={{ color: 'var(--littera-dust)' }}
            >
              ∅
            </p>
            <p className="text-sm font-medium mb-4" style={{ color: 'var(--littera-slate)' }}>
              Nenhuma redação ainda
            </p>
            <Link
              href="/essays/new"
              className="littera-btn littera-btn-primary px-5 py-2.5 text-sm"
            >
              <Plus className="w-4 h-4" />
              Enviar primeira redação
            </Link>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: 'var(--littera-paper)',
              border: '1px solid var(--littera-dust)',
              boxShadow: 'var(--littera-shadow-sm)',
            }}
          >
            {recent.map((
              essay: Essay & { student?: { name: string; class_name: string | null } },
              idx
            ) => (
              <Link
                key={essay.id}
                href={`/essays/${essay.id}`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--littera-forest-faint)]"
                style={{
                  borderBottom: idx < recent.length - 1
                    ? '1px solid var(--littera-dust)'
                    : 'none',
                }}
              >
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-display font-bold flex-shrink-0"
                  style={{
                    background: 'var(--littera-forest-light)',
                    color: 'var(--littera-forest)',
                  }}
                >
                  {essay.title.slice(0, 1).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--littera-ink)' }}
                    >
                      {essay.title}
                    </p>
                    <EssayStatusBadge status={essay.status} />
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--littera-slate)' }}>
                    {essay.student?.name ?? 'Sem aluno'}
                    {' · '}
                    {new Date(essay.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {/* Score */}
                {essay.total_score > 0 && (
                  <div className="text-right flex-shrink-0">
                    <span
                      className="font-display text-lg font-bold tabular-nums"
                      style={{ color: 'var(--littera-forest)' }}
                    >
                      {essay.total_score}
                    </span>
                    <span className="text-xs ml-0.5" style={{ color: 'var(--littera-slate)' }}>
                      /1000
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
