'use client'

import { useEffect, useRef, useState } from 'react'
import { useAnnotationStore } from '@/stores/annotationStore'
import { createClient } from '@/lib/supabase/client'
import { Trash2, X, Save } from 'lucide-react'

interface Props {
  annotationId: string
  pageNumber: number
  x: number
  y: number
  onClose: () => void
  onDelete: () => void
  essayId: string
}

export function CommentPopover({ annotationId, pageNumber, x, y, onClose, onDelete, essayId }: Props) {
  const { annotations, updateAnnotationComment } = useAnnotationStore()
  const annotation = (annotations[pageNumber] ?? []).find((a) => a.id === annotationId)
  const [comment, setComment] = useState(annotation?.comment ?? '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSave() {
    setSaving(true)
    await supabase
      .from('annotations')
      .update({ comment: comment || null })
      .eq('id', annotationId)
    updateAnnotationComment(annotationId, comment, pageNumber)
    setSaving(false)
    onClose()
  }

  return (
    <div
      className="absolute z-50 bg-white rounded-xl shadow-xl border border-gray-200 w-64 p-3"
      style={{ left: Math.min(x + 8, 400), top: Math.max(y - 80, 8) }}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-700">Comentário</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <textarea
        ref={inputRef}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Adicione um comentário..."
        rows={3}
        className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="flex items-center justify-between mt-2">
        <button
          onClick={onDelete}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Excluir
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-3 h-3" />
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
