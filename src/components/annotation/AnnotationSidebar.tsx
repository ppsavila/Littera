'use client'

import { useAnnotationStore } from '@/stores/annotationStore'
import { useErrorMarkerStore } from '@/stores/errorMarkerStore'
import { getErrorType } from '@/types/error-marker'
import { COMPETENCIES } from '@/types/essay'
import { Highlighter, Pen, ArrowRight, Type, MapPin, MessageSquare, Trash2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Annotation, AnnotationType } from '@/types/annotation'
import type { ErrorMarker } from '@/types/error-marker'

const TYPE_CONFIG: Record<AnnotationType, { label: string; icon: React.ElementType }> = {
  highlight: { label: 'Destaque', icon: Highlighter },
  freehand: { label: 'Caneta livre', icon: Pen },
  arrow: { label: 'Seta', icon: ArrowRight },
  textbox: { label: 'Texto', icon: Type },
  marker: { label: 'Marcador', icon: MapPin },
}

function getCompetencyColor(competency: number): string {
  return COMPETENCIES.find((c) => c.number === competency)?.color ?? '#ef4444'
}

interface Props {
  essayId: string
}

export function AnnotationSidebar({ essayId }: Props) {
  const { annotations, removeAnnotation, selectAnnotation, selectedId } = useAnnotationStore()
  const { markers, removeMarker } = useErrorMarkerStore()
  const supabase = createClient()

  const allAnnotations = Object.entries(annotations)
    .flatMap(([page, anns]) => anns.map((a) => ({ ...a, page: Number(page) })))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  async function handleDeleteAnnotation(ann: Annotation & { page: number }) {
    await supabase.from('annotations').delete().eq('id', ann.id)
    removeAnnotation(ann.id, ann.page)
  }

  async function handleDeleteMarker(marker: ErrorMarker) {
    await supabase.from('error_markers').delete().eq('id', marker.id)
    removeMarker(marker.id)
  }

  const totalCount = allAnnotations.length + markers.length

  return (
    <div className="w-56 bg-white border-l border-r border-gray-200 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Anotações ({totalCount})
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {totalCount === 0 ? (
          <p className="text-xs text-gray-400 p-4 text-center">
            Nenhuma anotação ainda
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Drawing annotations */}
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
                    onClick={(e) => { e.stopPropagation(); handleDeleteAnnotation(ann) }}
                    className="text-gray-300 hover:text-red-500 transition-colors mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}

            {/* Error markers */}
            {markers.map((marker) => {
              const et = getErrorType(marker.error_code, marker.competency)
              const color = getCompetencyColor(marker.competency)
              return (
                <div
                  key={marker.id}
                  className="flex items-start gap-2 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="flex-shrink-0 mt-0.5 flex items-center justify-center rounded"
                    style={{
                      background: color,
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 700,
                      minWidth: 24,
                      height: 16,
                      padding: '0 4px',
                    }}
                  >
                    {marker.error_code}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-gray-700 truncate">
                        {et?.label ?? marker.error_code}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">· p.{marker.page_number}</span>
                    </div>
                    {marker.selected_text && (
                      <p className="text-xs text-gray-400 truncate italic mt-0.5">
                        "{marker.selected_text.slice(0, 40)}{marker.selected_text.length > 40 ? '…' : ''}"
                      </p>
                    )}
                    <p className="text-xs mt-0.5" style={{ color }}>
                      −{et?.deduction} pts · C{marker.competency}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteMarker(marker) }}
                    className="text-gray-300 hover:text-red-500 transition-colors mt-0.5 flex-shrink-0"
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
