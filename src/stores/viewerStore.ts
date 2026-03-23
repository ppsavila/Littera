import { create } from 'zustand'

interface ViewerState {
  zoom: number
  currentPage: number
  totalPages: number
  isLoading: boolean
  pageDimensions: Record<number, { width: number; height: number }>

  setZoom: (zoom: number) => void
  setCurrentPage: (page: number) => void
  setTotalPages: (total: number) => void
  setIsLoading: (v: boolean) => void
  setPageDimensions: (page: number, dims: { width: number; height: number }) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

const ZOOM_STEP = 0.25
const MIN_ZOOM = 0.2
const MAX_ZOOM = 3

export const useViewerStore = create<ViewerState>((set, get) => ({
  zoom: 1,
  currentPage: 1,
  totalPages: 1,
  isLoading: true,
  pageDimensions: {},

  setZoom: (zoom) => set({ zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)) }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setTotalPages: (totalPages) => set({ totalPages }),
  setIsLoading: (isLoading) => set({ isLoading }),

  setPageDimensions: (page, dims) =>
    set((state) => ({
      pageDimensions: { ...state.pageDimensions, [page]: dims },
    })),

  zoomIn: () => {
    const { zoom } = get()
    set({ zoom: Math.min(MAX_ZOOM, zoom + ZOOM_STEP) })
  },

  zoomOut: () => {
    const { zoom } = get()
    set({ zoom: Math.max(MIN_ZOOM, zoom - ZOOM_STEP) })
  },

  resetZoom: () => set({ zoom: 1 }),
}))
