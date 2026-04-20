import type { LucideIcon } from 'lucide-react'
import { Type, Lightbulb, AlignLeft, Link2, Target } from 'lucide-react'

export type EssayStatus = 'pending' | 'analyzing' | 'analyzed' | 'correcting' | 'done'
export type SourceType = 'pdf' | 'image' | 'text'

export interface Essay {
  id: string
  teacher_id: string
  student_id: string | null
  title: string
  source_type: SourceType
  storage_path: string | null
  raw_text: string | null
  theme: string | null
  status: EssayStatus
  score_c1: number | null
  score_c2: number | null
  score_c3: number | null
  score_c4: number | null
  score_c5: number | null
  total_score: number
  notes_c1: string | null
  notes_c2: string | null
  notes_c3: string | null
  notes_c4: string | null
  notes_c5: string | null
  general_comment: string | null
  ai_analysis: AIAnalysis | null
  share_token: string | null
  is_shared: boolean
  share_doc_url: string | null
  created_at: string
  updated_at: string
  student?: Student
}

export interface Student {
  id: string
  teacher_id: string
  name: string
  class_name: string | null
  created_at: string
}

export interface AICompetencyAnalysis {
  suggested_score: number
  feedback: string
  strengths?: string[]
  issues?: string[]
  proposal_present?: boolean
}

export interface AIAnalysis {
  competencies: {
    c1: AICompetencyAnalysis
    c2: AICompetencyAnalysis
    c3: AICompetencyAnalysis
    c4: AICompetencyAnalysis
    c5: AICompetencyAnalysis
  }
  overall_feedback: string
  model: string
  analyzed_at: string
}

export const COMPETENCIES: Array<{
  key: 'c1' | 'c2' | 'c3' | 'c4' | 'c5'
  number: number
  title: string
  description: string
  color: string
  icon: LucideIcon
}> = [
  {
    key: 'c1',
    number: 1,
    title: 'Domínio da norma culta',
    description: 'Domínio da norma culta da língua escrita',
    color: '#3B82F6', // blue
    icon: Type,
  },
  {
    key: 'c2',
    number: 2,
    title: 'Compreensão da proposta',
    description: 'Compreensão da proposta e aplicação de conceitos de diferentes áreas do conhecimento',
    color: '#10B981', // green
    icon: Lightbulb,
  },
  {
    key: 'c3',
    number: 3,
    title: 'Seleção e organização',
    description: 'Seleção, relação, organização e interpretação de informações e argumentos',
    color: '#F59E0B', // amber
    icon: AlignLeft,
  },
  {
    key: 'c4',
    number: 4,
    title: 'Mecanismos linguísticos',
    description: 'Conhecimento dos mecanismos linguísticos necessários para a construção da argumentação',
    color: '#8B5CF6', // purple
    icon: Link2,
  },
  {
    key: 'c5',
    number: 5,
    title: 'Proposta de intervenção',
    description: 'Proposta de intervenção para o problema abordado, respeitando os direitos humanos',
    color: '#EF4444', // red
    icon: Target,
  },
]
