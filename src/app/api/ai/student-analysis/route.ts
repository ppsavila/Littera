import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { canUseFeature } from '@/lib/subscriptions/access'

/**
 * POST /api/ai/student-analysis
 * Premium feature: Claude analyzes a student's essays over time
 * and identifies key improvement areas.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await canUseFeature(user.id, 'studentInsights'))) {
    return NextResponse.json(
      {
        error: 'Análise de progresso de aluno está disponível apenas no plano Premium.',
        code: 'FEATURE_REQUIRES_PREMIUM',
        upgrade: 'premium',
      },
      { status: 403 }
    )
  }

  const { studentId } = await request.json()
  if (!studentId) return NextResponse.json({ error: 'studentId is required' }, { status: 400 })

  const { data: student } = await supabase
    .from('students')
    .select('name')
    .eq('id', studentId)
    .eq('teacher_id', user.id)
    .single()

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const { data: essays } = await supabase
    .from('essays')
    .select('title, theme, score_c1, score_c2, score_c3, score_c4, score_c5, total_score, ai_analysis, created_at')
    .eq('teacher_id', user.id)
    .eq('student_id', studentId)
    .in('status', ['done', 'analyzed'])
    .order('created_at', { ascending: true })

  if (!essays || essays.length < 2) {
    return NextResponse.json(
      { error: 'O aluno precisa ter pelo menos 2 redações corrigidas para gerar uma análise de progresso.' },
      { status: 400 }
    )
  }

  // TODO: Implement Claude analysis of student progress
  // const analysis = await analyzeStudentProgress(student.name, essays)

  return NextResponse.json({
    studentId,
    studentName: student.name,
    essayCount: essays.length,
    // analysis,
    message: 'Análise de progresso em desenvolvimento — disponível em breve!',
  })
}
