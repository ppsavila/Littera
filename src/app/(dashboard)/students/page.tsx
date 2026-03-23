import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'

export default async function StudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: students } = await supabase
    .from('students')
    .select('*, essays(count)')
    .eq('teacher_id', user.id)
    .order('name')

  const count = students?.length ?? 0

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
          {count} aluno{count !== 1 ? 's' : ''} cadastrado{count !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Empty state */}
      {count === 0 ? (
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
        <div
          className="rounded-xl overflow-hidden littera-fade-up delay-100"
          style={{
            background: 'var(--littera-paper)',
            border: '1px solid var(--littera-dust)',
            boxShadow: 'var(--littera-shadow-sm)',
          }}
        >
          {students!.map((student, idx) => {
            const essayCount = (student.essays as unknown as { count: number }[])?.[0]?.count ?? 0
            const initial = student.name.charAt(0).toUpperCase()

            return (
              <div
                key={student.id}
                className="flex items-center gap-4 px-5 py-4"
                style={{
                  borderBottom: idx < students!.length - 1
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

                {/* Essay count */}
                <span
                  className="text-xs font-medium tabular-nums flex-shrink-0"
                  style={{ color: 'var(--littera-slate)' }}
                >
                  {essayCount} redaç{essayCount !== 1 ? 'ões' : 'ão'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
