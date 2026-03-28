import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { canUseFeature } from '@/lib/subscriptions/access'
import { analyzeStudentProgress } from '@/lib/ai/analyze-student'
import { logger } from '@/lib/logger'

const STUDENT_ANALYSIS_RATE_MAX = 5
const STUDENT_ANALYSIS_RATE_WINDOW_MS = 10 * 60 * 1000 // 10 min

async function checkStudentAnalysisRateLimit(userId: string): Promise<boolean> {
  const db = createServiceClient()
  const { data } = await db.rpc('check_ai_rate_limit', {
    p_user_id: userId,
    p_max: STUDENT_ANALYSIS_RATE_MAX,
    p_window_ms: STUDENT_ANALYSIS_RATE_WINDOW_MS,
  })
  return data === true
}

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

  if (!(await checkStudentAnalysisRateLimit(user.id))) {
    return NextResponse.json(
      { error: 'Limite de análises atingido. Tente novamente em 10 minutos.' },
      { status: 429 }
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

  try {
    const analysis = await analyzeStudentProgress(student.name, essays)
    logger.info('ai.student-analysis.completed', { studentId, essayCount: essays.length })
    return NextResponse.json({
      studentId,
      studentName: student.name,
      essayCount: essays.length,
      analysis,
    })
  } catch (err) {
    logger.error('ai.student-analysis.failed', err, { studentId })
    return NextResponse.json(
      { error: 'Erro ao gerar análise de progresso. Tente novamente.' },
      { status: 500 }
    )
  }
}
