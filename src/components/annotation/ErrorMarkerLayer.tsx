'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useErrorMarkerStore } from '@/stores/errorMarkerStore'
import { ERROR_TYPES_BY_COMPETENCY, getErrorType, isSelectionMarker } from '@/types/error-marker'
import { createClient } from '@/lib/supabase/client'
import { COMPETENCIES } from '@/types/essay'
import type { ErrorMarker } from '@/types/error-marker'

interface Props {
  essayId: string
  pageNumber: number
  width: number
  height: number
}

function findCompetency(errorCode: string): number {
  for (const [comp, errors] of Object.entries(ERROR_TYPES_BY_COMPETENCY)) {
    if (errors.some((e) => e.code === errorCode)) return Number(comp)
  }
  return 1
}

function getColor(competency: number): string {
  return COMPETENCIES.find((c) => c.number === competency)?.color ?? '#ef4444'
}

export function ErrorMarkerLayer({ essayId, pageNumber, width, height }: Props) {
  const { markers, addMarker, removeMarker, selectedErrorCode, isErrorMode } =
    useErrorMarkerStore()
  const [tooltip, setTooltip] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const pageMarkers = markers.filter((m) => m.page_number === pageNumber)

  // Clear selection when leaving error mode
  useEffect(() => {
    if (!isErrorMode) window.getSelection()?.removeAllRanges()
  }, [isErrorMode])

  // Document-level mouseup: captures both text selections and point clicks
  const handleDocMouseUp = useCallback(
    async (e: MouseEvent) => {
      if (!isErrorMode || !selectedErrorCode) return
      // Ignore clicks on marker badges/tooltips
      if ((e.target as HTMLElement).closest('[data-marker-badge]')) return

      const overlay = overlayRef.current
      if (!overlay) return

      const overlayRect = overlay.getBoundingClientRect()

      // Check if the event is within this page's bounds
      const inBounds =
        e.clientX >= overlayRect.left &&
        e.clientX <= overlayRect.right &&
        e.clientY >= overlayRect.top &&
        e.clientY <= overlayRect.bottom

      const selection = window.getSelection()
      const hasSelection = selection && selection.rangeCount > 0 && !selection.isCollapsed

      if (hasSelection) {
        const range = selection.getRangeAt(0)
        const selRect = range.getBoundingClientRect()

        // Check if selection overlaps this page
        if (
          selRect.right < overlayRect.left ||
          selRect.left > overlayRect.right ||
          selRect.bottom < overlayRect.top ||
          selRect.top > overlayRect.bottom
        ) {
          return
        }

        // Per-line rects for accurate highlight rendering (avoids full bounding-box)
        const lineRects = Array.from(range.getClientRects())
          .map((r) => ({
            x:  Math.max(0, (r.left  - overlayRect.left) / width),
            y:  Math.max(0, (r.top   - overlayRect.top)  / height),
            x2: Math.min(1, (r.right - overlayRect.left) / width),
            y2: Math.min(1, (r.bottom - overlayRect.top) / height),
          }))
          .filter((r) => r.x2 - r.x > 0.001 && r.y2 - r.y > 0.001)

        // Bounding box kept for badge positioning & backward compat
        const x  = Math.max(0, (selRect.left   - overlayRect.left) / width)
        const y  = Math.max(0, (selRect.top    - overlayRect.top)  / height)
        const x2 = Math.min(1, (selRect.right  - overlayRect.left) / width)
        const y2 = Math.min(1, (selRect.bottom - overlayRect.top)  / height)

        const selectedText = selection.toString().trim()
        selection.removeAllRanges()

        if (selectedText && lineRects.length > 0) {
          await saveMarker({ x, y, x2, y2, selectedText, rects: lineRects })
        }
      } else if (inBounds) {
        // Point click (no selection)
        const x = (e.clientX - overlayRect.left) / width
        const y = (e.clientY - overlayRect.top) / height
        await saveMarker({ x, y, x2: null, y2: null, selectedText: null, rects: null })
      }
    },
    [isErrorMode, selectedErrorCode, width, height]
  )

  useEffect(() => {
    document.addEventListener('mouseup', handleDocMouseUp)
    return () => document.removeEventListener('mouseup', handleDocMouseUp)
  }, [handleDocMouseUp])

  async function saveMarker({
    x, y, x2, y2, selectedText, rects,
  }: {
    x: number; y: number; x2: number | null; y2: number | null
    selectedText: string | null; rects: import('@/types/error-marker').MarkerRect[] | null
  }) {
    const competency = findCompetency(selectedErrorCode!)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('error_markers')
      .insert({
        essay_id: essayId,
        teacher_id: user.id,
        page_number: pageNumber,
        x, y, x2, y2,
        rects: rects ?? null,
        selected_text: selectedText,
        error_code: selectedErrorCode,
        competency,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar marcador:', error.message)
      return
    }
    if (data) addMarker(data as ErrorMarker)
  }

  async function handleDelete(marker: ErrorMarker, e: React.MouseEvent) {
    e.stopPropagation()
    await supabase.from('error_markers').delete().eq('id', marker.id)
    removeMarker(marker.id)
    setTooltip(null)
  }

  return (
    // pointer-events:none on the container — badges inside have pointer-events:auto
    <div
      ref={overlayRef}
      className="absolute inset-0"
      style={{ zIndex: 20, pointerEvents: 'none' }}
    >
      {pageMarkers.map((marker) => {
        const et = getErrorType(marker.error_code, marker.competency)
        const color = getColor(marker.competency)
        const isOpen = tooltip === marker.id
        const isSel = isSelectionMarker(marker)

        const px = marker.x * width
        const py = marker.y * height

        // Use per-line rects if available, fall back to bounding box for old markers
        const highlightRects = (marker.rects && marker.rects.length > 0)
          ? marker.rects
          : isSel
            ? [{ x: marker.x, y: marker.y, x2: marker.x2!, y2: marker.y2! }]
            : []

        // Badge anchored to the end of the last highlight rect
        const lastRect = highlightRects[highlightRects.length - 1]
        const badgeLeft = isSel && lastRect ? lastRect.x2 * width + 2  : px - 14
        const badgeTop  = isSel && lastRect ? lastRect.y  * height - 14 : py - 14

        return (
          <div key={marker.id}>
            {/* Per-line selection highlights */}
            {highlightRects.map((r, ri) => (
              <div
                key={ri}
                data-marker-badge="true"
                onClick={(e) => { e.stopPropagation(); setTooltip(isOpen ? null : marker.id) }}
                style={{
                  position: 'absolute',
                  left:   r.x  * width,
                  top:    r.y  * height,
                  width:  Math.max((r.x2 - r.x) * width,  4),
                  height: Math.max((r.y2 - r.y) * height, 4),
                  backgroundColor: color,
                  opacity: 0.25,
                  border: `1.5px solid ${color}66`,
                  borderRadius: 2,
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                }}
              />
            ))}

            {/* Badge */}
            <div
              data-marker-badge="true"
              onClick={(e) => { e.stopPropagation(); setTooltip(isOpen ? null : marker.id) }}
              title={et?.label}
              style={{
                position: 'absolute',
                left: badgeLeft,
                top: badgeTop,
                minWidth: 26,
                height: 20,
                padding: '0 5px',
                borderRadius: 10,
                backgroundColor: color,
                color: '#fff',
                fontSize: 9,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                pointerEvents: 'auto',
                userSelect: 'none',
                zIndex: 22,
                whiteSpace: 'nowrap',
              }}
            >
              {marker.error_code}
            </div>

            {/* Underline for point marker */}
            {!isSel && (
              <div style={{
                position: 'absolute',
                left: px - 20,
                top: py + 8,
                width: 40,
                height: 2,
                backgroundColor: color,
                opacity: 0.7,
                pointerEvents: 'none',
              }} />
            )}

            {/* Tooltip */}
            {isOpen && (
              <div
                data-marker-badge="true"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  left: Math.min(badgeLeft + 4, width - 215),
                  top: Math.max(badgeTop + 22, 4),
                  width: 210,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  padding: 12,
                  zIndex: 50,
                  pointerEvents: 'auto',
                }}
              >
                {marker.selected_text && (
                  <div style={{
                    background: `${color}18`,
                    border: `1px solid ${color}33`,
                    borderRadius: 6,
                    padding: '5px 8px',
                    fontSize: 11,
                    color: '#374151',
                    marginBottom: 8,
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                    maxHeight: 64,
                    overflow: 'hidden',
                  }}>
                    "{marker.selected_text.length > 90
                      ? marker.selected_text.slice(0, 90) + '…'
                      : marker.selected_text}"
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    background: color, color: '#fff', borderRadius: 4,
                    padding: '2px 6px', fontSize: 11, fontWeight: 700,
                  }}>
                    {marker.error_code}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1f2937' }}>{et?.label}</span>
                </div>
                <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{et?.description}</p>
                <p style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>
                  -{et?.deduction} pts · Competência {marker.competency}
                </p>
                <button
                  onClick={(e) => handleDelete(marker, e)}
                  style={{
                    width: '100%', padding: '4px 0', fontSize: 11,
                    color: '#ef4444', border: '1px solid #fecaca',
                    borderRadius: 8, background: 'white', cursor: 'pointer',
                  }}
                >
                  Remover
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
