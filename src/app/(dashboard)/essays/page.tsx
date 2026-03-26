import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { EssayStatusBadge } from '@/components/essay/EssayStatusBadge'
import type { Essay } from '@/types/essay'

export default async function EssaysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: essays } = await supabase
    .from('essays')
    .select('*, student:students(name, class_name)')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const total = essays?.length ?? 0
  const pending = essays?.filter((e) => e.status === 'pending').length ?? 0
  const done = essays?.filter((e) => e.status === 'done').length ?? 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 littera-fade-up">
        <div>
          <h1
            className="font-display text-2xl sm:text-3xl font-semibold mb-1"
            style={{ color: 'var(--littera-ink)' }}
          >
            Redações
          </h1>
          <p className="text-sm" style={{ color: 'var(--littera-slate)' }}>
            {total} {total === 1 ? 'redação registrada' : 'redações registradas'}
          </p>
        </div>

        <Link
          href="/essays/new"
          className="littera-btn littera-btn-primary px-4 py-2.5 text-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Redação</span>
          <span className="sm:hidden">Nova</span>
        </Link>
      </div>

      {/* Stats strip */}
      {total > 0 && (
        <div className="flex gap-3 flex-wrap littera-fade-up delay-100">
          {[
            { label: 'Total',      value: total,   accent: 'var(--littera-forest)', bg: 'var(--littera-forest-light)', border: 'rgba(26,77,58,0.18)' },
            { label: 'Pendentes',  value: pending,  accent: 'var(--littera-amber)',  bg: 'var(--littera-amber-light)',  border: 'rgba(180,83,9,0.18)' },
            { label: 'Concluídas', value: done,     accent: 'var(--littera-sage)',   bg: 'var(--littera-sage-light)',   border: 'rgba(63,98,18,0.18)'  },
          ].map(({ label, value, accent, bg, border }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <span
                className="font-display text-xl font-bold tabular-nums"
                style={{ color: accent }}
              >
                {value}
              </span>
              <span className="text-xs font-medium" style={{ color: accent, opacity: 0.75 }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!essays || essays.length === 0 ? (
        <div
          className="text-center py-20 rounded-xl littera-fade-up delay-150"
          style={{
            background: 'var(--littera-paper)',
            border: '1.5px dashed var(--littera-dust)',
          }}
        >
          <p
            className="font-display text-5xl mb-4"
            style={{ color: 'var(--littera-dust)' }}
          >
            ∅
          </p>
          <h3
            className="font-display text-lg font-semibold mb-1"
            style={{ color: 'var(--littera-ink)' }}
          >
            Nenhuma redação ainda
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--littera-slate)' }}>
            Faça o upload da primeira redação para começar a usar o Litterando
          </p>
          <Link
            href="/essays/new"
            className="littera-btn littera-btn-primary px-5 py-2.5 text-sm"
          >
            <Plus className="w-4 h-4" />
            Upload de Redação
          </Link>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden littera-fade-up delay-150"
          style={{
            background: 'var(--littera-paper)',
            border: '1px solid var(--littera-dust)',
            boxShadow: 'var(--littera-shadow-sm)',
          }}
        >
          {essays.map((
            essay: Essay & { student?: { name: string; class_name: string | null } },
            idx
          ) => (
            <Link
              key={essay.id}
              href={`/essays/${essay.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--littera-forest-faint)] group"
              style={{
                borderBottom: idx < essays.length - 1
                  ? '1px solid var(--littera-dust)'
                  : 'none',
              }}
            >
              {/* Letter avatar */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-display font-bold flex-shrink-0 transition-colors"
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
                  {essay.student
                    ? `${essay.student.name}${essay.student.class_name ? ` · ${essay.student.class_name}` : ''}`
                    : 'Sem aluno vinculado'}
                  {' · '}
                  {new Date(essay.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0">
                {essay.total_score > 0 ? (
                  <div>
                    <span
                      className="font-display text-xl font-bold tabular-nums"
                      style={{ color: 'var(--littera-forest)' }}
                    >
                      {essay.total_score}
                    </span>
                    <span className="text-xs ml-0.5" style={{ color: 'var(--littera-slate)' }}>
                      /1000
                    </span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--littera-dust)' }}>—</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
