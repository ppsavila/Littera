import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface EssaySnapshot {
  title: string
  theme: string | null
  score_c1: number | null
  score_c2: number | null
  score_c3: number | null
  score_c4: number | null
  score_c5: number | null
  total_score: number
  created_at: string
}

export interface StudentProgressAnalysis {
  trend: 'improving' | 'stable' | 'declining' | 'mixed'
  summary: string
  competencies: {
    c1: { label: string; trend: string; insight: string }
    c2: { label: string; trend: string; insight: string }
    c3: { label: string; trend: string; insight: string }
    c4: { label: string; trend: string; insight: string }
    c5: { label: string; trend: string; insight: string }
  }
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  analyzed_at: string
}

export async function analyzeStudentProgress(
  studentName: string,
  essays: EssaySnapshot[]
): Promise<StudentProgressAnalysis> {
  const essayList = essays
    .map((e, i) => {
      const date = new Date(e.created_at).toLocaleDateString('pt-BR')
      const scores = [e.score_c1, e.score_c2, e.score_c3, e.score_c4, e.score_c5]
        .map((s, ci) => `C${ci + 1}: ${s ?? '—'}`)
        .join(', ')
      return `Redação ${i + 1} (${date}) — "${e.title}"${e.theme ? ` [tema: ${e.theme}]` : ''}
  Notas: ${scores} | Total: ${e.total_score}/1000`
    })
    .join('\n')

  const prompt = `Você é um especialista em análise pedagógica de redações do ENEM. Analise a evolução do(a) aluno(a) "${studentName}" com base nas redações abaixo e retorne um JSON estruturado.

HISTÓRICO DE REDAÇÕES (em ordem cronológica):
${essayList}

COMPETÊNCIAS ENEM:
- C1: Domínio da norma culta
- C2: Compreensão da proposta e aplicação de conceitos
- C3: Seleção, relação e organização de informações
- C4: Mecanismos linguísticos de coesão
- C5: Elaboração de proposta de intervenção

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "trend": "improving" | "stable" | "declining" | "mixed",
  "summary": "Parágrafo de 2-3 frases resumindo a evolução geral do aluno",
  "competencies": {
    "c1": { "label": "Domínio da norma culta", "trend": "melhorando" | "estável" | "piorando" | "variável", "insight": "observação específica em 1 frase" },
    "c2": { "label": "Compreensão da proposta", "trend": "...", "insight": "..." },
    "c3": { "label": "Seleção e organização", "trend": "...", "insight": "..." },
    "c4": { "label": "Mecanismos de coesão", "trend": "...", "insight": "..." },
    "c5": { "label": "Proposta de intervenção", "trend": "...", "insight": "..." }
  },
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "improvements": ["área de melhoria 1", "área de melhoria 2", "área de melhoria 3"],
  "recommendations": ["recomendação prática 1", "recomendação prática 2", "recomendação prática 3"]
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Could not parse AI student analysis response as JSON')
    parsed = JSON.parse(match[0])
  }

  return {
    ...parsed,
    analyzed_at: new Date().toISOString(),
  } as StudentProgressAnalysis
}
