import { create } from 'zustand'
import type { Annotation, AnnotationTool, CreateAnnotationPayload } from '@/types/annotation'

interface AnnotationState {
  // Tool state
  activeTool: AnnotationTool
  activeColor: string
  strokeWidth: number
  activeCompetency: number | null

  // Annotations per page
  annotations: Record<number, Annotation[]>
  selectedId: string | null

  // Undo history — each entry is a full snapshot of `annotations`
  history: Record<number, Annotation[]>[]
  historyIndex: number

  // Actions
  setTool: (tool: AnnotationTool) => void
  setColor: (color: string) => void
  setStrokeWidth: (w: number) => void
  setActiveCompetency: (c: number | null) => void

  setAnnotations: (page: number, annotations: Annotation[]) => void
  addAnnotation: (annotation: Annotation) => void
  removeAnnotation: (id: string, page: number) => void
  updateAnnotationComment: (id: string, comment: string, page: number) => void
  selectAnnotation: (id: string | null) => void

  undo: () => void

  clearAll: () => void
}

const ANNOTATION_COLORS = [
  '#FACC15', // yellow (default)
  '#F87171', // red
  '#34D399', // green
  '#60A5FA', // blue
  '#C084FC', // purple
  '#FB923C', // orange
]

/** Deep-clone `annotations` so history snapshots are immutable. */
function cloneAnnotations(
  annotations: Record<number, Annotation[]>
): Record<number, Annotation[]> {
  const out: Record<number, Annotation[]> = {}
  for (const [page, anns] of Object.entries(annotations)) {
    out[Number(page)] = [...anns]
  }
  return out
}

const MAX_HISTORY = 50

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  activeTool: 'pan',
  activeColor: ANNOTATION_COLORS[0],
  strokeWidth: 3,
  activeCompetency: null,

  annotations: {},
  selectedId: null,

  history: [],
  historyIndex: -1,

  setTool: (tool) => set({ activeTool: tool }),
  setColor: (color) => set({ activeColor: color }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
  setActiveCompetency: (activeCompetency) => set({ activeCompetency }),

  setAnnotations: (page, annotations) =>
    set((state) => ({
      annotations: { ...state.annotations, [page]: annotations },
    })),

  addAnnotation: (annotation) =>
    set((state) => {
      const page = annotation.page_number
      const current = state.annotations[page] ?? []
      const newAnnotations = {
        ...state.annotations,
        [page]: [...current, annotation],
      }
      // Snapshot current state before the change, truncate any redo branch
      const snapshot = cloneAnnotations(state.annotations)
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        snapshot,
      ].slice(-MAX_HISTORY)
      return {
        annotations: newAnnotations,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    }),

  removeAnnotation: (id, page) =>
    set((state) => {
      const current = state.annotations[page] ?? []
      const newAnnotations = {
        ...state.annotations,
        [page]: current.filter((a) => a.id !== id),
      }
      // Snapshot current state before the change
      const snapshot = cloneAnnotations(state.annotations)
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        snapshot,
      ].slice(-MAX_HISTORY)
      return {
        annotations: newAnnotations,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        selectedId: state.selectedId === id ? null : state.selectedId,
      }
    }),

  updateAnnotationComment: (id, comment, page) =>
    set((state) => {
      const current = state.annotations[page] ?? []
      return {
        annotations: {
          ...state.annotations,
          [page]: current.map((a) => (a.id === id ? { ...a, comment } : a)),
        },
      }
    }),

  selectAnnotation: (selectedId) => set({ selectedId }),

  undo: () =>
    set((state) => {
      if (state.historyIndex < 0) return {}
      const snapshot = state.history[state.historyIndex]
      return {
        annotations: cloneAnnotations(snapshot),
        historyIndex: state.historyIndex - 1,
        selectedId: null,
      }
    }),

  clearAll: () => set({ annotations: {}, selectedId: null, history: [], historyIndex: -1 }),
}))

export const ANNOTATION_COLORS_LIST = ANNOTATION_COLORS
