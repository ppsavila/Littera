/**
 * Builds the formatted WhatsApp message sent to students.
 *
 * Format (WhatsApp markdown):
 *   Olá, [Nome]!
 *
 *   📝 *Resultado da sua redação*
 *   [Título] — [Tema se houver]
 *
 *   *Notas por competência:*
 *   C1 – Domínio da norma culta: 160/200
 *   C2 – Compreensão da proposta: 140/200
 *   ...
 *   ━━━━━━━━━━━━━━━━━
 *   *Nota total: 780/1000*
 *
 *   🔗 Veja a correção completa:
 *   https://app.litterando.com/share/[token]
 *
 *   _Enviado pelo Litterando_
 */

export interface EssayResultData {
  studentName: string
  essayTitle: string
  theme?: string | null
  scoreC1: number | null
  scoreC2: number | null
  scoreC3: number | null
  scoreC4: number | null
  scoreC5: number | null
  totalScore: number
  shareToken?: string | null
  generalComment?: string | null
}

const COMPETENCY_LABELS: Record<string, string> = {
  c1: 'Domínio da norma culta',
  c2: 'Compreensão da proposta',
  c3: 'Seleção e organização',
  c4: 'Mecanismos linguísticos',
  c5: 'Proposta de intervenção',
}

function scoreLine(key: string, score: number | null): string {
  const label = COMPETENCY_LABELS[key]
  const value = score !== null ? `${score}/200` : 'Não avaliada'
  return `C${key[1]} – ${label}: *${value}*`
}

/**
 * Builds the share URL from a share_token.
 * Uses NEXT_PUBLIC_APP_URL env if available, falls back to production URL.
 */
function buildShareUrl(shareToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://app.litterando.com'
  return `${base}/share/${shareToken}`
}

/**
 * Assembles the WhatsApp message text for a given essay result.
 */
export function buildEssayResultMessage(data: EssayResultData): string {
  const lines: string[] = []

  // Greeting
  lines.push(`Olá, ${data.studentName}!`)
  lines.push('')

  // Essay header
  lines.push(`📝 *Resultado da sua redação*`)
  lines.push(`*${data.essayTitle}*${data.theme ? ` — ${data.theme}` : ''}`)
  lines.push('')

  // Scores per competency
  lines.push('*Notas por competência:*')
  lines.push(scoreLine('c1', data.scoreC1))
  lines.push(scoreLine('c2', data.scoreC2))
  lines.push(scoreLine('c3', data.scoreC3))
  lines.push(scoreLine('c4', data.scoreC4))
  lines.push(scoreLine('c5', data.scoreC5))
  lines.push('━━━━━━━━━━━━━━━━')
  lines.push(`*Nota total: ${data.totalScore}/1000*`)

  // Optional share link
  if (data.shareToken) {
    lines.push('')
    lines.push('🔗 Veja a correção completa:')
    lines.push(buildShareUrl(data.shareToken))
  }

  // Signature
  lines.push('')
  lines.push('_Enviado pelo Litterando_')

  return lines.join('\n')
}
