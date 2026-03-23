import { create } from 'zustand'
import type { AIAnalysis } from '@/types/essay'

interface CompetencyScores {
  c1: number | null
  c2: number | null
  c3: number | null
  c4: number | null
  c5: number | null
}

interface CompetencyNotes {
  c1: string
  c2: string
  c3: string
  c4: string
  c5: string
}

interface ScoringState {
  scores: CompetencyScores
  notes: CompetencyNotes
  generalComment: string
  aiAnalysis: AIAnalysis | null
  isDirty: boolean
  isAnalyzing: boolean
  streamingText: string

  setScore: (key: keyof CompetencyScores, value: number | null) => void
  setNote: (key: keyof CompetencyNotes, value: string) => void
  setGeneralComment: (value: string) => void
  setAIAnalysis: (analysis: AIAnalysis | null) => void
  setIsAnalyzing: (v: boolean) => void
  appendStreamingText: (text: string) => void
  clearStreamingText: () => void
  markClean: () => void
  initFromEssay: (data: {
    scores: CompetencyScores
    notes: CompetencyNotes
    generalComment: string
    aiAnalysis: AIAnalysis | null
  }) => void

  totalScore: () => number
}

export const useScoringStore = create<ScoringState>((set, get) => ({
  scores: { c1: null, c2: null, c3: null, c4: null, c5: null },
  notes: { c1: '', c2: '', c3: '', c4: '', c5: '' },
  generalComment: '',
  aiAnalysis: null,
  isDirty: false,
  isAnalyzing: false,
  streamingText: '',

  setScore: (key, value) =>
    set((state) => ({
      scores: { ...state.scores, [key]: value },
      isDirty: true,
    })),

  setNote: (key, value) =>
    set((state) => ({
      notes: { ...state.notes, [key]: value },
      isDirty: true,
    })),

  setGeneralComment: (generalComment) => set({ generalComment, isDirty: true }),

  setAIAnalysis: (aiAnalysis) => set({ aiAnalysis }),

  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  appendStreamingText: (text) =>
    set((state) => ({ streamingText: state.streamingText + text })),

  clearStreamingText: () => set({ streamingText: '' }),

  markClean: () => set({ isDirty: false }),

  initFromEssay: ({ scores, notes, generalComment, aiAnalysis }) =>
    set({ scores, notes, generalComment, aiAnalysis, isDirty: false }),

  totalScore: () => {
    const { scores } = get()
    return (
      (scores.c1 ?? 0) +
      (scores.c2 ?? 0) +
      (scores.c3 ?? 0) +
      (scores.c4 ?? 0) +
      (scores.c5 ?? 0)
    )
  },
}))
