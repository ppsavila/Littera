import { createClient } from '@/lib/supabase/server'
import { Users, LineChart, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { StudentInsightsButton } from '@/components/students/StudentInsightsButton'
import { canUseFeature } from '@/lib/subscriptions/access'

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function StudentsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { page: pageParam } = await searchParams
  const page    = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const from    = (page - 1) * PAGE_SIZE
  const to      = from + PAGE_SIZE - 1

  const [studentsResult, countResult, canStudentInsights] = await Promise.all([
    /* Paginação server-side via .range() */
    supabase
      .from('students')
      .select('*, essays(count)')
      .eq('teacher_id', user.id)
      .order('name')
      .range(from, to),

    /* Contagem total (sem paginar) */
    supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', user.id),

    canUseFeature(user!.id, 'studentInsights'),
  ])

  const students  = studentsResult.data ?? []
  const totalCount = countResult.count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="littera-fade-up">
        <h1
          className="font-display text-2xl sm:text-3xl font-semibold mb-1"
          style={{ color: 'var(--littera-ink)' }}
        >
          Alunos
        </h1>
        <p className="text-sm" style={{ color: 'var(--littera-slate)' }}>
          {totalCount} aluno{totalCount !== 1 ? 's' : ''} cadastrado{totalCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Empty state */}
      {totalCount === 0 ? (
        <div
          className="text-center py-20 rounded-xl littera-fade-up delay-100"
          style={{
            background: 'var(--littera-paper)',
            border: '1.5px dashed var(--littera-dust)',
          }}
        >
          <Users
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--littera-dust)' }}
          />
          <h3
            className="font-display text-lg font-semibold mb-1"
            style={{ color: 'var(--littera-ink)' }}
          >
            Nenhum aluno ainda
          </h3>
          <p className="text-sm" style={{ color: 'var(--littera-slate)' }}>
            Os alunos são cadastrados automaticamente ao fazer upload de redações
          </p>
        </div>
      ) : (
        <>
          <div
            className="rounded-xl overflow-hidden littera-fade-up delay-100"
            style={{
              background: 'var(--littera-paper)',
              border: '1px solid var(--littera-dust)',
              boxShadow: 'var(--littera-shadow-sm)',
            }}
          >
            {students.map((student, idx) => {
              const essayCount = (student.essays as unknown as { count: number }[])?.[0]?.count ?? 0
              const initial = student.name.charAt(0).toUpperCase()

              return (
                <div
                  key={student.id}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{
                    borderBottom: idx < students.length - 1
                      ? '1px solid var(--littera-dust)'
                      : 'none',
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'var(--littera-forest-light)',
                      color: 'var(--littera-forest)',
                    }}
                  >
                    <span className="text-sm font-display font-semibold">{initial}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--littera-ink)' }}>
                      {student.name}
                    </p>
                    {student.class_name && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--littera-slate)' }}>
                        {student.class_name}
                      </p>
                    )}
                  </div>

                  {/* Essay count + Insights */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-xs font-medium tabular-nums"
                      style={{ color: 'var(--littera-slate)' }}
                    >
                      {essayCount} redaç{essayCount !== 1 ? 'ões' : 'ão'}
                    </span>
                    <StudentInsightsButton
                      studentId={student.id}
                      studentName={student.name}
                      essayCount={essayCount}
                      canStudentInsights={canStudentInsights}
                    />
                    {essayCount > 0 && (
                      <Link
                        href={`/dashboard/students/${student.id}/insights`}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: 'var(--littera-mist)',
                          color: 'var(--littera-slate)',
                          border: '1px solid var(--littera-dust)',
                        }}
                        title={`Ver painel de insights de ${student.name}`}
                      >
                        <LineChart className="w-3 h-3" />
                        Painel
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Paginação ────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <nav
              className="flex items-center justify-between littera-fade-up delay-200"
              aria-label="Paginação de alunos"
            >
              {/* Anterior */}
              {page > 1 ? (
                <Link
                  href={`/dashboard/students?page=${page - 1}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: 'var(--littera-paper)',
                    border: '1px solid var(--littera-dust)',
                    color: 'var(--littera-ink)',
                    boxShadow: 'var(--littera-shadow-sm)',
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Link>
              ) : (
                <span className="px-4 py-2 text-sm" style={{ color: 'var(--littera-dust)' }}>
                  Anterior
                </span>
              )}

              {/* Indicador */}
              <span className="text-sm font-medium" style={{ color: 'var(--littera-slate)' }}>
                Página {page} de {totalPages}
              </span>

              {/* Próximo */}
              {page < totalPages ? (
                <Link
                  href={`/dashboard/students?page=${page + 1}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: 'var(--littera-paper)',
                    border: '1px solid var(--littera-dust)',
                    color: 'var(--littera-ink)',
                    boxShadow: 'var(--littera-shadow-sm)',
                  }}
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="px-4 py-2 text-sm" style={{ color: 'var(--littera-dust)' }}>
                  Próximo
                </span>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  )
}
