'use client'

import { useAnnotationStore } from '@/stores/annotationStore'
import { Highlighter, Pen, ArrowRight, Type, MapPin, MessageSquare, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Annotation, AnnotationType } from '@/types/annotation'

const TYPE_CONFIG: Record<AnnotationType, { label: string; icon: React.ElementType }> = {
  highlight: { label: 'Destaque', icon: Highlighter },
  freehand: { label: 'Caneta livre', icon: Pen },
  arrow: { label: 'Seta', icon: ArrowRight },
  textbox: { label: 'Texto', icon: Type },
  marker: { label: 'Marcador', icon: MapPin },
}

interface Props {
  essayId: string
}

export function AnnotationSidebar({ essayId }: Props) {
  const { annotations, removeAnnotation, selectAnnotation, selectedId } = useAnnotationStore()
  const supabase = createClient()

  const allAnnotations = Object.entries(annotations)
    .flatMap(([page, anns]) => anns.map((a) => ({ ...a, page: Number(page) })))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  async function handleDelete(ann: Annotation & { page: number }) {
    await supabase.from('annotations').delete().eq('id', ann.id)
    removeAnnotation(ann.id, ann.page)
  }

  return (
    <div className="w-56 bg-white border-l border-r border-gray-200 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Anotações ({allAnnotations.length})
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {allAnnotations.length === 0 ? (
          <p className="text-xs text-gray-400 p-4 text-center">
            Nenhuma anotação ainda
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {allAnnotations.map((ann) => {
              const config = TYPE_CONFIG[ann.type]
              const Icon = config.icon
              return (
                <div
                  key={ann.id}
                  className={`flex items-start gap-2 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedId === ann.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => selectAnnotation(ann.id)}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: ann.color + '33' }}
                  >
                    <Icon className="w-3 h-3" style={{ color: ann.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-gray-700">{config.label}</span>
                      <span className="text-xs text-gray-400">· p.{ann.page}</span>
                    </div>
                    {ann.comment && (
                      <div className="flex items-start gap-1 mt-0.5">
                        <MessageSquare className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-500 truncate">{ann.comment}</p>
                      </div>
                    )}
                    {(ann as Annotation & { shape_data: { text?: string } }).shape_data.text && (
                      <p className="text-xs text-gray-500 truncate">
                        "{(ann as Annotation & { shape_data: { text?: string } }).shape_data.text}"
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(ann) }}
                    className="text-gray-300 hover:text-red-500 transition-colors mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
