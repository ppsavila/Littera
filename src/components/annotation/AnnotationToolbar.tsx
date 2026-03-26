'use client'

import { useAnnotationStore, ANNOTATION_COLORS_LIST } from '@/stores/annotationStore'
import { useErrorMarkerStore } from '@/stores/errorMarkerStore'
import { cn } from '@/lib/utils'
import {
  MousePointer2,
  Highlighter,
  Pen,
  ArrowRight,
  Type,
  MapPin,
  Eraser,
  Minus,
  Plus,
  AlertTriangle,
} from 'lucide-react'
import type { AnnotationTool } from '@/types/annotation'

const TOOLS: { tool: AnnotationTool; label: string; icon: React.ElementType; shortcut: string }[] = [
  { tool: 'pan',       label: 'Mover',    icon: MousePointer2, shortcut: 'V' },
  { tool: 'highlight', label: 'Destaque', icon: Highlighter,   shortcut: 'H' },
  { tool: 'freehand',  label: 'Caneta',   icon: Pen,           shortcut: 'P' },
  { tool: 'arrow',     label: 'Seta',     icon: ArrowRight,    shortcut: 'A' },
  { tool: 'textbox',   label: 'Texto',    icon: Type,          shortcut: 'T' },
  { tool: 'marker',    label: 'Marcador', icon: MapPin,        shortcut: 'M' },
  { tool: 'eraser',    label: 'Apagar',   icon: Eraser,        shortcut: 'E' },
]

/** Desktop vertical toolbar — hidden on mobile */
export function AnnotationToolbar() {
  const { activeTool, setTool, activeColor, setColor, strokeWidth, setStrokeWidth } =
    useAnnotationStore()
  const { isErrorMode, setIsErrorMode, setSelectedErrorCode } = useErrorMarkerStore()

  function selectTool(tool: AnnotationTool) {
    if (isErrorMode) {
      setIsErrorMode(false)
      setSelectedErrorCode(null)
    }
    setTool(tool)
  }

  function handleToggleErrorMode() {
    const next = !isErrorMode
    setIsErrorMode(next)
    if (next) {
      setTool('pan')
    } else {
      setSelectedErrorCode(null)
    }
  }

  return (
    <div
      className="hidden sm:flex flex-col overflow-y-auto max-h-full flex-shrink-0"
      style={{
        background: 'var(--littera-paper)',
        borderRight: '1px solid var(--littera-dust)',
        width: 48,
      }}
    >
      <div className="flex flex-col items-center gap-3 py-4 px-1.5">
        {/* Tools */}
        <div className="flex flex-col gap-1">
          {TOOLS.map(({ tool, label, icon: Icon, shortcut }) => (
            <button
              key={tool}
              onClick={() => selectTool(tool)}
              title={`${label} (${shortcut})`}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={
                activeTool === tool
                  ? {
                      background: 'var(--littera-forest)',
                      color: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    }
                  : {
                      color: 'var(--littera-slate)',
                    }
              }
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-6 h-px" style={{ background: 'var(--littera-dust)' }} />

        {/* Error mode toggle */}
        <button
          onClick={handleToggleErrorMode}
          title="Marcar erros"
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
          style={
            isErrorMode
              ? { background: 'var(--littera-rose)', color: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }
              : { color: 'var(--littera-slate)' }
          }
        >
          <AlertTriangle className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-6 h-px" style={{ background: 'var(--littera-dust)' }} />

        {/* Color palette */}
        <div className="flex flex-col gap-1.5">
          {ANNOTATION_COLORS_LIST.map((color) => (
            <button
              key={color}
              onClick={() => setColor(color)}
              className="w-5 h-5 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                border: activeColor === color
                  ? '2px solid var(--littera-ink)'
                  : '2px solid transparent',
                transform: activeColor === color ? 'scale(1.15)' : undefined,
              }}
              title={color}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-6 h-px" style={{ background: 'var(--littera-dust)' }} />

        {/* Stroke width */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => setStrokeWidth(Math.min(8, strokeWidth + 1))}
            className="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style={{ color: 'var(--littera-slate)' }}
          >
            <Plus className="w-3 h-3" />
          </button>
          <div
            className="rounded-full"
            style={{
              width: strokeWidth + 2,
              height: strokeWidth + 2,
              background: 'var(--littera-ink)',
            }}
          />
          <button
            onClick={() => setStrokeWidth(Math.max(1, strokeWidth - 1))}
            className="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style={{ color: 'var(--littera-slate)' }}
          >
            <Minus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Mobile horizontal mini-toolbar */
export function AnnotationToolbarMobile() {
  const { activeTool, setTool, activeColor, setColor } = useAnnotationStore()
  const { isErrorMode, setIsErrorMode, setSelectedErrorCode } = useErrorMarkerStore()

  const mobileTools = TOOLS.filter((t) =>
    ['pan', 'highlight', 'freehand', 'marker', 'eraser'].includes(t.tool)
  )

  function selectTool(tool: AnnotationTool) {
    if (isErrorMode) {
      setIsErrorMode(false)
      setSelectedErrorCode(null)
    }
    setTool(tool)
  }

  function handleToggleErrorMode() {
    const next = !isErrorMode
    setIsErrorMode(next)
    if (next) {
      setTool('pan')
    } else {
      setSelectedErrorCode(null)
    }
  }

  return (
    <div
      className="sm:hidden flex items-center gap-1 px-2 py-1.5 overflow-x-auto flex-shrink-0"
      style={{
        background: 'var(--littera-paper)',
        borderBottom: '1px solid var(--littera-dust)',
      }}
    >
      {mobileTools.map(({ tool, label, icon: Icon }) => (
        <button
          key={tool}
          onClick={() => selectTool(tool)}
          title={label}
          className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 transition-all"
          style={
            activeTool === tool
              ? { background: 'var(--littera-forest)', color: '#fff' }
              : { color: 'var(--littera-slate)' }
          }
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}

      {/* Divider */}
      <div className="w-px h-5 flex-shrink-0 mx-1" style={{ background: 'var(--littera-dust)' }} />

      {/* Error mode toggle */}
      <button
        onClick={handleToggleErrorMode}
        title="Marcar erros"
        className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 transition-all"
        style={
          isErrorMode
            ? { background: 'var(--littera-rose)', color: '#fff' }
            : { color: 'var(--littera-slate)' }
        }
      >
        <AlertTriangle className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-5 flex-shrink-0 mx-1" style={{ background: 'var(--littera-dust)' }} />

      {/* Color dots */}
      {ANNOTATION_COLORS_LIST.map((color) => (
        <button
          key={color}
          onClick={() => setColor(color)}
          className="flex-shrink-0 rounded-full transition-transform"
          style={{
            width: 16,
            height: 16,
            backgroundColor: color,
            border: activeColor === color ? '2px solid var(--littera-ink)' : '2px solid transparent',
            transform: activeColor === color ? 'scale(1.2)' : undefined,
          }}
        />
      ))}
    </div>
  )
}
