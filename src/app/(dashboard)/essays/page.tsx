import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { EssayStatusBadge } from '@/components/essay/EssayStatusBadge'
import type { Essay } from '@/types/essay'

const PAGE_SIZE = 20

interface Props {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>
}

export default async function EssaysPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { page: pageParam, status: statusFilter, q: rawQ } = await searchParams
  const q = rawQ?.trim() || ''
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  // Total count for stats strip (always unfiltered)
  const [{ count: totalCount }, { count: pendingCount }, { count: doneCount }] = await Promise.all([
    supabase.from('essays').select('id', { count: 'exact', head: true }).eq('teacher_id', user.id),
    supabase.from('essays').select('id', { count: 'exact', head: true }).eq('teacher_id', user.id).eq('status', 'pending'),
    supabase.from('essays').select('id', { count: 'exact', head: true }).eq('teacher_id', user.id).eq('status', 'done'),
  ])

  // When searching, find matching student IDs first
  let matchingStudentIds: string[] = []
  if (q) {
    const { data: matchingStudents } = await supabase
      .from('students')
      .select('id')
      .eq('teacher_id', user.id)
      .ilike('name', `%${q}%`)
    matchingStudentIds = matchingStudents?.map((s) => s.id) ?? []
  }

  // Paginated list (with optional status filter + search)
  let query = supabase
    .from('essays')
    .select('*, student:students(name, class_name)')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (statusFilter) query = query.eq('status', statusFilter)

  if (q) {
    if (matchingStudentIds.length > 0) {
      query = query.or(`title.ilike.%${q}%,student_id.in.(${matchingStudentIds.join(',')})`)
    } else {
      query = query.ilike('title', `%${q}%`)
    }
  }

  const { data: essays } = await query

  const total       = totalCount ?? 0
  const pending     = pendingCount ?? 0
  const done        = doneCount ?? 0
  const totalPages  = Math.ceil((essays?.length === PAGE_SIZE ? total : (offset + (essays?.length ?? 0))) / PAGE_SIZE)
  const hasPrev     = page > 1
  const hasNext     = essays?.length === PAGE_SIZE

  const buildHref = (p: number) => {
    const params = new URLSearchParams()
    params.set('page', String(p))
    if (statusFilter) params.set('status', statusFilter)
    if (q) params.set('q', q)
    return `/essays?${params.toString()}`
  }

  const buildFilterHref = (status?: string) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (q) params.set('q', q)
    return `/essays?${params.toString()}`
  }

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

      {/* Search */}
      {total > 0 && (
        <form method="GET" action="/essays" className="littera-fade-up delay-50">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--littera-slate)' }}
            />
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Buscar por título ou nome do aluno…"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--littera-paper)',
                border: '1px solid var(--littera-dust)',
                color: 'var(--littera-ink)',
              }}
            />
            {q && (
              <Link
                href={statusFilter ? `/essays?status=${statusFilter}` : '/essays'}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" style={{ color: 'var(--littera-slate)' }} />
              </Link>
            )}
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          </div>
        </form>
      )}

      {/* Stats strip */}
      {total > 0 && (
        <div className="flex gap-3 flex-wrap littera-fade-up delay-100">
          {[
            { label: 'Total',      value: total,   status: undefined,  accent: 'var(--littera-forest)', bg: 'var(--littera-forest-light)', border: 'rgba(26,77,58,0.18)' },
            { label: 'Pendentes',  value: pending, status: 'pending',  accent: 'var(--littera-amber)',  bg: 'var(--littera-amber-light)',  border: 'rgba(180,83,9,0.18)' },
            { label: 'Concluídas', value: done,    status: 'done',     accent: 'var(--littera-sage)',   bg: 'var(--littera-sage-light)',   border: 'rgba(63,98,18,0.18)'  },
          ].map(({ label, value, status, accent, bg, border }) => (
            <Link
              key={label}
              href={buildFilterHref(status)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <span className="font-display text-xl font-bold tabular-nums" style={{ color: accent }}>
                {value}
              </span>
              <span className="text-xs font-medium" style={{ color: accent, opacity: 0.75 }}>
                {label}
              </span>
            </Link>
          ))}
          {statusFilter && (
            <Link
              href={q ? `/essays?q=${encodeURIComponent(q)}` : '/essays'}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: 'var(--littera-mist)',
                border: '1px solid var(--littera-dust)',
                color: 'var(--littera-slate)',
              }}
            >
              × Limpar filtro
            </Link>
          )}
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
          <p className="font-display text-5xl mb-4" style={{ color: 'var(--littera-dust)' }}>∅</p>
          <h3 className="font-display text-lg font-semibold mb-1" style={{ color: 'var(--littera-ink)' }}>
            {q ? 'Nenhum resultado encontrado' : statusFilter ? 'Nenhuma redação com esse filtro' : 'Nenhuma redação ainda'}
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--littera-slate)' }}>
            {q
              ? `Nenhuma redação corresponde a "${q}". Tente outros termos.`
              : statusFilter
              ? 'Tente remover o filtro ou enviar novas redações.'
              : 'Faça o upload da primeira redação para começar a usar o Litterando'}
          </p>
          {!statusFilter && !q && (
            <Link href="/essays/new" className="littera-btn littera-btn-primary px-5 py-2.5 text-sm">
              <Plus className="w-4 h-4" />
              Upload de Redação
            </Link>
          )}
        </div>
      ) : (
        <>
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
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-display font-bold flex-shrink-0"
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
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--littera-ink)' }}>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 littera-fade-up">
              <span className="text-xs" style={{ color: 'var(--littera-slate)' }}>
                Página {page} de {totalPages} · {total} redações
              </span>
              <div className="flex gap-1">
                {hasPrev ? (
                  <Link
                    href={buildHref(page - 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: 'var(--littera-paper)',
                      border: '1px solid var(--littera-dust)',
                      color: 'var(--littera-ink)',
                    }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Anterior
                  </Link>
                ) : (
                  <span
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium opacity-30 cursor-not-allowed"
                    style={{ background: 'var(--littera-mist)', color: 'var(--littera-slate)' }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Anterior
                  </span>
                )}
                {hasNext ? (
                  <Link
                    href={buildHref(page + 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: 'var(--littera-paper)',
                      border: '1px solid var(--littera-dust)',
                      color: 'var(--littera-ink)',
                    }}
                  >
                    Próxima
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium opacity-30 cursor-not-allowed"
                    style={{ background: 'var(--littera-mist)', color: 'var(--littera-slate)' }}
                  >
                    Próxima
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
