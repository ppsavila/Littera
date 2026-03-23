export type AnnotationType = 'highlight' | 'freehand' | 'arrow' | 'textbox' | 'marker'
export type AnnotationTool = AnnotationType | 'pan' | 'eraser'

export interface ShapeData {
  // Common
  x?: number
  y?: number
  width?: number
  height?: number
  // Freehand / Arrow
  points?: number[]
  // Text
  text?: string
  fontSize?: number
  // Style
  stroke?: string
  strokeWidth?: number
  fill?: string
  opacity?: number
  // Normalized (0-1) coordinates flag
  normalized?: boolean
}

export interface Annotation {
  id: string
  essay_id: string
  teacher_id: string
  page_number: number
  type: AnnotationType
  shape_data: ShapeData
  comment: string | null
  competency: number | null
  color: string
  created_at: string
}

export interface CreateAnnotationPayload {
  essay_id: string
  page_number: number
  type: AnnotationType
  shape_data: ShapeData
  comment?: string
  competency?: number
  color?: string
}
