'use client'

import { useViewerStore } from '@/stores/viewerStore'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

export function ZoomControls() {
  const { zoom, zoomIn, zoomOut, resetZoom } = useViewerStore()

  return (
    <div className="sticky z-30 flex items-center gap-1 px-2 py-1 rounded-lg shadow border" style={{ top: 96, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderColor: 'var(--littera-dust)' }}>
      <button
        onClick={zoomOut}
        className="p-1 rounded transition-colors"
        style={{ color: 'var(--littera-slate)' }}
        title="Diminuir zoom"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        onClick={resetZoom}
        className="px-2 text-xs font-mono rounded transition-colors min-w-[44px] text-center"
        style={{ color: 'var(--littera-ink)' }}
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        onClick={zoomIn}
        className="p-1 rounded transition-colors"
        style={{ color: 'var(--littera-slate)' }}
        title="Aumentar zoom"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
    </div>
  )
}
