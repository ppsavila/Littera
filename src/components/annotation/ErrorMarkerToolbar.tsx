'use client'

import { useState } from 'react'
import { useErrorMarkerStore } from '@/stores/errorMarkerStore'
import { useAnnotationStore } from '@/stores/annotationStore'
import { ERROR_TYPES_BY_COMPETENCY } from '@/types/error-marker'
import { COMPETENCIES } from '@/types/essay'
import { AlertTriangle, X, ChevronDown } from 'lucide-react'

export function ErrorMarkerToolbar() {
  const { isErrorMode, setIsErrorMode, selectedErrorCode, setSelectedErrorCode } =
    useErrorMarkerStore()
  const { setTool } = useAnnotationStore()
  const [activeCompetency, setActiveCompetency] = useState<number>(1)

  function handleToggleMode() {
    const next = !isErrorMode
    setIsErrorMode(next)
    if (next) {
      setTool('pan') // disable annotation tools in error mode
    } else {
      setSelectedErrorCode(null)
    }
  }

  function handleSelectError(code: string) {
    setSelectedErrorCode(selectedErrorCode === code ? null : code)
  }

  const errorTypes = ERROR_TYPES_BY_COMPETENCY[activeCompetency] ?? []
  const selectedError = errorTypes.find((e) => e.code === selectedErrorCode)

  return (
    <div
      className="sticky z-[55] flex-shrink-0"
      style={{
        top: 52,
        borderBottom: '1px solid var(--littera-dust)',
        background: isErrorMode ? 'var(--littera-rose-light)' : 'var(--littera-paper)',
      }}
    >
      {/* Primary row — always visible */}
      <div className="flex items-center gap-2 px-3 h-9 overflow-x-auto">
        {/* Toggle */}
        <button
          onClick={handleToggleMode}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 transition-all"
          style={
            isErrorMode
              ? {
                  background: 'var(--littera-rose)',
                  color: '#fff',
                  border: '1px solid transparent',
                }
              : {
                  background: 'var(--littera-mist)',
                  color: 'var(--littera-slate)',
                  border: '1px solid var(--littera-dust)',
                }
          }
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {isErrorMode ? 'Modo: Erros' : 'Marcar erros'}
          </span>
          <span className="sm:hidden">{isErrorMode ? 'Erros' : 'Erros'}</span>
        </button>

        {isErrorMode && (
          <>
            {/* Divider */}
            <div className="w-px h-4 flex-shrink-0" style={{ background: 'rgba(190,18,60,0.25)' }} />

            {/* Competency tabs */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {COMPETENCIES.map((comp) => (
                <button
                  key={comp.key}
                  onClick={() => {
                    setActiveCompetency(comp.number)
                    setSelectedErrorCode(null)
                  }}
                  title={comp.description}
                  className="h-6 w-8 rounded-md text-xs font-bold flex-shrink-0 transition-all"
                  style={
                    activeCompetency === comp.number
                      ? { backgroundColor: comp.color, color: '#fff' }
                      : {
                          background: 'rgba(255,255,255,0.7)',
                          color: 'var(--littera-slate)',
                          border: '1px solid var(--littera-dust)',
                        }
                  }
                >
                  C{comp.number}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-4 flex-shrink-0" style={{ background: 'rgba(190,18,60,0.25)' }} />

            {/* Error type chips — horizontally scrollable */}
            <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
              {errorTypes.map((et) => {
                const active = selectedErrorCode === et.code
                const severityBg =
                  et.severity === 'high'
                    ? 'var(--littera-rose)'
                    : et.severity === 'medium'
                    ? 'var(--littera-amber)'
                    : 'var(--littera-gold)'
                return (
                  <button
                    key={et.code}
                    onClick={() => handleSelectError(et.code)}
                    title={`${et.label} (−${et.deduction} pts)`}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold flex-shrink-0 transition-all"
                    style={
                      active
                        ? {
                            background: 'var(--littera-rose)',
                            color: '#fff',
                            border: '1px solid transparent',
                          }
                        : {
                            background: 'rgba(255,255,255,0.85)',
                            color: 'var(--littera-rose)',
                            border: '1px solid rgba(190,18,60,0.30)',
                          }
                    }
                  >
                    <span
                      className="inline-flex items-center justify-center w-6 h-4 rounded text-[10px] font-bold"
                      style={{
                        background: active ? 'rgba(255,255,255,0.25)' : severityBg,
                        color: active ? '#fff' : '#fff',
                      }}
                    >
                      {et.code}
                    </span>
                    <span className="hidden md:inline max-w-[120px] truncate">{et.label}</span>
                    <span className="opacity-70">−{et.deduction}</span>
                  </button>
                )
              })}
            </div>

            {/* Selected error instruction or clear */}
            {selectedErrorCode && (
              <>
                <div className="w-px h-4 flex-shrink-0" style={{ background: 'rgba(190,18,60,0.25)' }} />
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <p className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--littera-rose)' }}>
                    <AlertTriangle className="w-3 h-3 inline mr-0.5" />
                    Clique na redação
                  </p>
                  <button
                    onClick={() => setSelectedErrorCode(null)}
                    className="w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 transition-colors"
                    style={{ color: 'var(--littera-rose)', background: 'rgba(190,18,60,0.12)' }}
                    title="Cancelar seleção"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
