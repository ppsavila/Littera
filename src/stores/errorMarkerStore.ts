import { create } from 'zustand'
import type { ErrorMarker } from '@/types/error-marker'

interface ErrorMarkerState {
  markers: ErrorMarker[]
  selectedErrorCode: string | null
  isErrorMode: boolean

  setMarkers: (markers: ErrorMarker[]) => void
  addMarker: (marker: ErrorMarker) => void
  removeMarker: (id: string) => void
  setSelectedErrorCode: (code: string | null) => void
  setIsErrorMode: (v: boolean) => void

  getByCompetency: (competency: number) => ErrorMarker[]
}

export const useErrorMarkerStore = create<ErrorMarkerState>((set, get) => ({
  markers: [],
  selectedErrorCode: null,
  isErrorMode: false,

  setMarkers: (markers) => set({ markers }),

  addMarker: (marker) =>
    set((state) => ({ markers: [...state.markers, marker] })),

  removeMarker: (id) =>
    set((state) => ({ markers: state.markers.filter((m) => m.id !== id) })),

  setSelectedErrorCode: (selectedErrorCode) => set({ selectedErrorCode }),

  setIsErrorMode: (isErrorMode) => set({ isErrorMode }),

  getByCompetency: (competency) =>
    get().markers.filter((m) => m.competency === competency),
}))
