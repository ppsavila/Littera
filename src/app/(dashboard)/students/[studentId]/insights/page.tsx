import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { COMPETENCIES } from '@/types/essay'
import { InsightsHeader } from '@/components/students/insights/InsightsHeader'
import { CompetencyCards } from '@/components/students/insights/CompetencyCards'
import { EssayHistoryTable } from '@/components/students/insights/EssayHistoryTable'
import { EvolutionChart } from '@/components/students/insights/EvolutionChart'

interface PageProps {
  params: Promise<{ studentId: string }>
}

export default async function StudentInsightsPage({ params }: PageProps) {
  const { studentId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  /* ── Busca aluno + redações ─────────────────────────────────────────── */
  const [studentResult, essaysResult] = await Promise.all([
    supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .eq('teacher_id', user.id)
      .single(),

    supabase
      .from('essays')
      .select('id, title, theme, total_score, score_c1, score_c2, score_c3, score_c4, score_c5, created_at, status')
      .eq('student_id', studentId)
      .eq('teacher_id', user.id)
      .eq('status', 'done')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  if (studentResult.error || !studentResult.data) return notFound()

  const student = studentResult.data
  const essays  = essaysResult.data ?? []

  /* ── Últimas 10 para o gráfico de evolução ──────────────────────────── */
  const evolutionData = [...essays].reverse().slice(-10)

  /* ── Médias por competência ─────────────────────────────────────────── */
  const avgCompetency = (key: 'score_c1' | 'score_c2' | 'score_c3' | 'score_c4' | 'score_c5') => {
    const values = essays.map(e => e[key]).filter((v): v is number => v !== null)
    if (!values.length) return null
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  }

  const competencyAverages = {
    c1: avgCompetency('score_c1'),
    c2: avgCompetency('score_c2'),
    c3: avgCompetency('score_c3'),
    c4: avgCompetency('score_c4'),
    c5: avgCompetency('score_c5'),
  }

  const overallAvg = essays.length
    ? Math.round(essays.reduce((acc, e) => acc + e.total_score, 0) / essays.length)
    : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      <InsightsHeader
        student={student}
        essayCount={essays.length}
        overallAvg={overallAvg}
      />

      {essays.length === 0 ? (
        /* ── Estado vazio ─────────────────────────────────────────────── */
        <div
          className="text-center py-20 rounded-xl littera-fade-up"
          style={{
            background: 'var(--littera-paper)',
            border: '1.5px dashed var(--littera-dust)',
          }}
        >
          <div className="text-4xl mb-3">📝</div>
          <h3
            className="font-display text-lg font-semibold mb-1"
            style={{ color: 'var(--littera-ink)' }}
          >
            Nenhuma redação corrigida ainda
          </h3>
          <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--littera-slate)' }}>
            Quando redações deste aluno forem corrigidas, os dados de evolução
            e desempenho por competência aparecerão aqui.
          </p>
        </div>
      ) : (
        <>
          {/* ── Evolução (últimas 10 redações) ──────────────────────── */}
          <EvolutionChart essays={evolutionData} />

          {/* ── Cards de competência ────────────────────────────────── */}
          <CompetencyCards
            competencies={COMPETENCIES}
            averages={competencyAverages}
          />

          {/* ── Lista de redações ────────────────────────────────────── */}
          <EssayHistoryTable essays={essays} />
        </>
      )}
    </div>
  )
}
