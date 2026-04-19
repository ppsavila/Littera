'use client'

import { useAnnotationStore, ANNOTATION_COLORS_LIST } from '@/stores/annotationStore'
import { createClient } from '@/lib/supabase/client'
import { Trash2, X } from 'lucide-react'

interface Props {
  annotationId: string
  pageNumber: number
  x: number
  y: number
  onClose: () => void
  onDelete: () => void
}

export function ShapeControlsPanel({ annotationId, pageNumber, x, y, onClose, onDelete }: Props) {
  const { annotations, updateAnnotationColor } = useAnnotationStore()
  const annotation = (annotations[pageNumber] ?? []).find((a) => a.id === annotationId)
  const supabase = createClient()

  async function handleColorChange(color: string) {
    // Optimistic local update first
    updateAnnotationColor(annotationId, color, pageNumber)
    // Persist to DB in background
    const update: Record<string, unknown> = { color }
    if (annotation?.type === 'highlight') {
      update.shape_data = { ...annotation.shape_data, fill: color }
    }
    await supabase.from('annotations').update(update).eq('id', annotationId)
  }

  return (
    <div
      className="absolute z-50 rounded-xl shadow-xl border border-gray-200"
      style={{
        left: Math.min(x + 8, 420),
        top: Math.max(y - 60, 8),
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '8px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {/* Color swatches */}
      <div className="flex items-center gap-1.5">
        {ANNOTATION_COLORS_LIST.map((color) => (
          <button
            key={color}
            onClick={() => handleColorChange(color)}
            className="rounded-full transition-transform hover:scale-110"
            style={{
              width: 18,
              height: 18,
              backgroundColor: color,
              border: annotation?.color === color
                ? '2px solid #1e293b'
                : '2px solid transparent',
              outline: annotation?.color === color ? '1.5px solid #fff' : 'none',
              outlineOffset: '-3px',
            }}
            title={color}
          />
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: '#e2e8f0', flexShrink: 0 }} />

      {/* Delete */}
      <button
        onClick={onDelete}
        className="flex items-center justify-center rounded-lg transition-colors hover:bg-red-50"
        style={{ width: 28, height: 28, color: '#ef4444', flexShrink: 0 }}
        title="Excluir anotação"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Close */}
      <button
        onClick={onClose}
        className="flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
        style={{ width: 24, height: 24, color: '#94a3b8', flexShrink: 0 }}
        title="Fechar"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
