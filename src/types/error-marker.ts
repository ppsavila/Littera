export interface ErrorType {
  code: string          // Shortcode shown on canvas (e.g. "Ort", "Conc")
  label: string         // Full label (e.g. "Desvio de ortografia")
  description: string   // Brief explanation
  deduction: number     // Points deducted per occurrence
  competency: 1 | 2 | 3 | 4 | 5
  severity: 'low' | 'medium' | 'high'
}

export interface MarkerRect {
  x: number; y: number; x2: number; y2: number
}

export interface ErrorMarker {
  id: string
  essay_id: string
  teacher_id: string
  page_number: number
  x: number              // normalized 0-1 (top-left or click point / bounding box)
  y: number              // normalized 0-1
  x2: number | null      // normalized end x (bounding box, selection only)
  y2: number | null      // normalized end y (bounding box, selection only)
  rects: MarkerRect[] | null  // per-line rects for accurate highlight rendering
  selected_text: string | null
  error_code: string
  competency: 1 | 2 | 3 | 4 | 5
  note: string | null
  created_at: string
}

export function isSelectionMarker(m: ErrorMarker): boolean {
  return m.x2 !== null && m.y2 !== null
}

// ─── COMPETÊNCIA 1: Domínio da norma culta ───────────────────────────────────
const C1_ERRORS: ErrorType[] = [
  {
    code: 'Ort',
    label: 'Ortografia / Acentuação',
    description: 'Desvio de ortografia, acentuação gráfica ou hífen',
    deduction: 5,
    competency: 1,
    severity: 'low',
  },
  {
    code: 'Conc',
    label: 'Concordância',
    description: 'Erro de concordância nominal ou verbal',
    deduction: 8,
    competency: 1,
    severity: 'medium',
  },
  {
    code: 'Reg',
    label: 'Regência',
    description: 'Erro de regência verbal ou nominal',
    deduction: 8,
    competency: 1,
    severity: 'medium',
  },
  {
    code: 'Pont',
    label: 'Pontuação',
    description: 'Desvio de pontuação que compromete a leitura',
    deduction: 5,
    competency: 1,
    severity: 'low',
  },
  {
    code: 'Pron',
    label: 'Pronome',
    description: 'Uso inadequado de pronomes (colocação, referência)',
    deduction: 8,
    competency: 1,
    severity: 'medium',
  },
  {
    code: 'Sint',
    label: 'Estrutura sintática',
    description: 'Truncamento, justaposição ou falha sintática grave',
    deduction: 15,
    competency: 1,
    severity: 'high',
  },
  {
    code: 'Reg.',
    label: 'Registro informal',
    description: 'Uso de linguagem informal, gíria ou marca de oralidade',
    deduction: 8,
    competency: 1,
    severity: 'medium',
  },
  {
    code: 'Lex',
    label: 'Léxico impreciso',
    description: 'Escolha vocabular inadequada ou imprecisa',
    deduction: 5,
    competency: 1,
    severity: 'low',
  },
]

// ─── COMPETÊNCIA 2: Compreensão da proposta ───────────────────────────────────
const C2_ERRORS: ErrorType[] = [
  {
    code: 'FT',
    label: 'Fuga ao tema',
    description: 'Texto não aborda o tema proposto',
    deduction: 160,
    competency: 2,
    severity: 'high',
  },
  {
    code: 'Tang',
    label: 'Tema tangencial',
    description: 'Desenvolvimento periférico ou superficial do tema',
    deduction: 40,
    competency: 2,
    severity: 'high',
  },
  {
    code: 'RI',
    label: 'Repertório inadequado',
    description: 'Repertório descontextualizado ou não pertinente',
    deduction: 20,
    competency: 2,
    severity: 'medium',
  },
  {
    code: 'RA',
    label: 'Sem repertório',
    description: 'Ausência de repertório sociocultural legitimado',
    deduction: 30,
    competency: 2,
    severity: 'medium',
  },
  {
    code: 'Tipo',
    label: 'Tipo textual inadequado',
    description: 'Texto não é dissertativo-argumentativo',
    deduction: 40,
    competency: 2,
    severity: 'high',
  },
]

// ─── COMPETÊNCIA 3: Seleção e organização ────────────────────────────────────
const C3_ERRORS: ErrorType[] = [
  {
    code: 'Inc',
    label: 'Incoerência',
    description: 'Contradição ou incoerência nas ideias',
    deduction: 20,
    competency: 3,
    severity: 'high',
  },
  {
    code: 'SP',
    label: 'Sem progressão',
    description: 'Ausência de progressão temática ou repetição',
    deduction: 15,
    competency: 3,
    severity: 'medium',
  },
  {
    code: 'AF',
    label: 'Argumento fraco',
    description: 'Argumento sem fundamentação ou muito superficial',
    deduction: 10,
    competency: 3,
    severity: 'low',
  },
  {
    code: 'Est',
    label: 'Estrutura prejudicada',
    description: 'Problemas na organização de introdução, desenvolvimento ou conclusão',
    deduction: 15,
    competency: 3,
    severity: 'medium',
  },
  {
    code: 'Par',
    label: 'Parágrafo mal delimitado',
    description: 'Parágrafos sem unidade temática ou mal divididos',
    deduction: 10,
    competency: 3,
    severity: 'low',
  },
]

// ─── COMPETÊNCIA 4: Mecanismos de coesão ─────────────────────────────────────
const C4_ERRORS: ErrorType[] = [
  {
    code: 'SC',
    label: 'Sem conector',
    description: 'Ausência de conectivo onde necessário',
    deduction: 10,
    competency: 4,
    severity: 'medium',
  },
  {
    code: 'CI',
    label: 'Conector inadequado',
    description: 'Uso de conectivo com sentido errado',
    deduction: 10,
    competency: 4,
    severity: 'medium',
  },
  {
    code: 'Ref',
    label: 'Referência ambígua',
    description: 'Pronome ou expressão com referência obscura ou ambígua',
    deduction: 8,
    competency: 4,
    severity: 'medium',
  },
  {
    code: 'Rupt',
    label: 'Ruptura de coesão',
    description: 'Quebra abrupta de sequência ou linha de raciocínio',
    deduction: 15,
    competency: 4,
    severity: 'high',
  },
  {
    code: 'Rep',
    label: 'Repetição excessiva',
    description: 'Repetição desnecessária de palavras ou estruturas',
    deduction: 5,
    competency: 4,
    severity: 'low',
  },
]

// ─── COMPETÊNCIA 5: Proposta de intervenção ──────────────────────────────────
const C5_ERRORS: ErrorType[] = [
  {
    code: 'PA',
    label: 'Proposta ausente',
    description: 'Nenhuma proposta de intervenção — nota obrigatoriamente 0',
    deduction: 200,
    competency: 5,
    severity: 'high',
  },
  {
    code: 'PI',
    label: 'Proposta incompleta',
    description: 'Proposta vaga, sem agente, ação, meio ou finalidade',
    deduction: 40,
    competency: 5,
    severity: 'high',
  },
  {
    code: 'PD',
    label: 'Pouco detalhada',
    description: 'Proposta presente mas sem detalhamento suficiente',
    deduction: 20,
    competency: 5,
    severity: 'medium',
  },
  {
    code: 'DH',
    label: 'Viola direitos humanos',
    description: 'Proposta que desrespeita direitos humanos — nota 0',
    deduction: 200,
    competency: 5,
    severity: 'high',
  },
  {
    code: 'PT',
    label: 'Proposta desvinculada',
    description: 'Proposta não relacionada com o tema desenvolvido',
    deduction: 30,
    competency: 5,
    severity: 'medium',
  },
]

export const ERROR_TYPES_BY_COMPETENCY: Record<number, ErrorType[]> = {
  1: C1_ERRORS,
  2: C2_ERRORS,
  3: C3_ERRORS,
  4: C4_ERRORS,
  5: C5_ERRORS,
}

export const ALL_ERROR_TYPES: ErrorType[] = [
  ...C1_ERRORS,
  ...C2_ERRORS,
  ...C3_ERRORS,
  ...C4_ERRORS,
  ...C5_ERRORS,
]

export function getErrorType(code: string, competency: number): ErrorType | undefined {
  return ERROR_TYPES_BY_COMPETENCY[competency]?.find((e) => e.code === code)
}

/** Calculate score deduction from error markers for a given competency */
export function calcDeduction(
  markers: ErrorMarker[],
  competency: 1 | 2 | 3 | 4 | 5
): number {
  return markers
    .filter((m) => m.competency === competency)
    .reduce((sum, m) => {
      const et = getErrorType(m.error_code, competency)
      return sum + (et?.deduction ?? 0)
    }, 0)
}

/** Suggest score based on AI suggestion minus teacher error markers */
export function calcSuggestedScore(
  aiSuggestion: number | undefined,
  markers: ErrorMarker[],
  competency: 1 | 2 | 3 | 4 | 5
): number {
  const base = aiSuggestion ?? 200
  const deduction = calcDeduction(markers, competency)
  const raw = base - deduction
  // Snap to nearest valid step
  const steps = [0, 40, 80, 120, 160, 200]
  const clamped = Math.max(0, Math.min(200, raw))
  return steps.reduce((prev, curr) =>
    Math.abs(curr - clamped) < Math.abs(prev - clamped) ? curr : prev
  )
}
