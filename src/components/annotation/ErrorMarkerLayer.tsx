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
  readOnly?: boolean
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

// ─── Note Popover (shown after placing a marker) ────────────────────────────────
interface NotePopoverProps {
  x: number
  y: number
  containerWidth: number
  onConfirm: (note: string) => void
  onDismiss: () => void
}

function NotePopover({ x, y, containerWidth, onConfirm, onDismiss }: NotePopoverProps) {
  const [note, setNote] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Clamp so popover doesn't overflow the container
  const left = Math.min(x, containerWidth - 230)

  return (
    <div
      data-marker-badge="true"
      style={{
        position: 'absolute',
        left: Math.max(4, left),
        top: Math.max(4, y + 24),
        width: 224,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        padding: 12,
        zIndex: 60,
        pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        Adicionar comentário <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span>
      </p>
      <textarea
        ref={inputRef}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ex: reescreva usando norma culta..."
        rows={2}
        style={{
          width: '100%',
          resize: 'none',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          padding: '6px 8px',
          fontSize: 11,
          fontFamily: 'inherit',
          outline: 'none',
          marginBottom: 8,
          color: '#374151',
          lineHeight: 1.5,
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onConfirm(note) }
          if (e.key === 'Escape') onDismiss()
        }}
      />
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => onConfirm(note)}
          style={{
            flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 600,
            background: 'var(--littera-forest)', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer',
          }}
        >
          Confirmar
        </button>
        <button
          onClick={onDismiss}
          style={{
            flex: 1, padding: '5px 0', fontSize: 11,
            background: '#f3f4f6', color: '#6b7280',
            border: 'none', borderRadius: 8, cursor: 'pointer',
          }}
        >
          Pular
        </button>
      </div>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function ErrorMarkerLayer({ essayId, pageNumber, width, height, readOnly }: Props) {
  const { markers, addMarker, removeMarker, updateMarker, selectedErrorCode, isErrorMode } =
    useErrorMarkerStore()
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
  const [pendingNote, setPendingNote] = useState<{
    markerId: string
    badgeLeft: number
    badgeTop: number
  } | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const pageMarkers = markers.filter((m) => m.page_number === pageNumber)

  // Clear selection when leaving error mode
  useEffect(() => {
    if (!isErrorMode) window.getSelection()?.removeAllRanges()
  }, [isErrorMode])

  // Persists a new marker to DB and triggers the optional note popover
  const saveMarker = useCallback(
    async (
      { x, y, x2, y2, selectedText, rects }: {
        x: number; y: number; x2: number | null; y2: number | null
        selectedText: string | null; rects: import('@/types/error-marker').MarkerRect[] | null
      },
      badgeLeft: number,
      badgeTop: number,
    ) => {
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
      if (data) {
        addMarker(data as ErrorMarker)
        // Prompt for optional note
        setPendingNote({ markerId: data.id, badgeLeft, badgeTop })
      }
    },
    [supabase, selectedErrorCode, essayId, pageNumber, addMarker],
  )

  // Document-level mouseup: captures text selections and point clicks
  const handleDocMouseUp = useCallback(
    async (e: MouseEvent) => {
      if (!isErrorMode || !selectedErrorCode) return
      if ((e.target as HTMLElement).closest('[data-marker-badge]')) return

      const overlay = overlayRef.current
      if (!overlay) return

      const overlayRect = overlay.getBoundingClientRect()

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

        if (
          selRect.right < overlayRect.left ||
          selRect.left > overlayRect.right ||
          selRect.bottom < overlayRect.top ||
          selRect.top > overlayRect.bottom
        ) {
          return
        }

        const lineRects = Array.from(range.getClientRects())
          .map((r) => ({
            x:  Math.max(0, (r.left  - overlayRect.left) / width),
            y:  Math.max(0, (r.top   - overlayRect.top)  / height),
            x2: Math.min(1, (r.right - overlayRect.left) / width),
            y2: Math.min(1, (r.bottom - overlayRect.top) / height),
          }))
          .filter((r) => r.x2 - r.x > 0.001 && r.y2 - r.y > 0.001)

        const x  = Math.max(0, (selRect.left   - overlayRect.left) / width)
        const y  = Math.max(0, (selRect.top    - overlayRect.top)  / height)
        const x2 = Math.min(1, (selRect.right  - overlayRect.left) / width)
        const y2 = Math.min(1, (selRect.bottom - overlayRect.top)  / height)

        const selectedText = selection.toString().trim()
        selection.removeAllRanges()

        if (selectedText && lineRects.length > 0) {
          const lastRect = lineRects[lineRects.length - 1]
          await saveMarker(
            { x, y, x2, y2, selectedText, rects: lineRects },
            lastRect.x2 * width + 2,
            lastRect.y  * height - 14,
          )
        }
      } else if (inBounds) {
        const px = (e.clientX - overlayRect.left)
        const py = (e.clientY - overlayRect.top)
        await saveMarker(
          { x: px / width, y: py / height, x2: null, y2: null, selectedText: null, rects: null },
          px - 14,
          py - 14,
        )
      }
    },
    [isErrorMode, selectedErrorCode, width, height, saveMarker],
  )

  useEffect(() => {
    document.addEventListener('mouseup', handleDocMouseUp)
    return () => document.removeEventListener('mouseup', handleDocMouseUp)
  }, [handleDocMouseUp])

  async function handleNoteConfirm(note: string) {
    if (!pendingNote) return
    const { markerId } = pendingNote
    setPendingNote(null)

    if (!note.trim()) return

    const { error } = await supabase
      .from('error_markers')
      .update({ note: note.trim() })
      .eq('id', markerId)

    if (!error) {
      updateMarker(markerId, { note: note.trim() })
    }
  }

  function handleNoteDismiss() {
    setPendingNote(null)
  }

  async function handleDelete(marker: ErrorMarker, e: React.MouseEvent) {
    e.stopPropagation()
    // Optimistic: remove immediately for fast UI feedback
    removeMarker(marker.id)
    setHoveredMarkerId(null)

    const { error } = await supabase.from('error_markers').delete().eq('id', marker.id)
    if (error) {
      // Rollback: restore the marker so it stays in sync with DB
      console.error('[ErrorMarkerLayer] delete failed — rolling back:', error.message)
      addMarker(marker)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0"
      style={{ zIndex: 20, pointerEvents: 'none' }}
    >
      {pageMarkers.map((marker) => {
        const et = getErrorType(marker.error_code, marker.competency)
        const color = getColor(marker.competency)
        const isHovered = hoveredMarkerId === marker.id
        const isSel = isSelectionMarker(marker)

        const px = marker.x * width
        const py = marker.y * height

        const highlightRects = (marker.rects && marker.rects.length > 0)
          ? marker.rects
          : isSel
            ? [{ x: marker.x, y: marker.y, x2: marker.x2!, y2: marker.y2! }]
            : []

        const lastRect = highlightRects[highlightRects.length - 1]
        const badgeLeft = isSel && lastRect ? lastRect.x2 * width + 2  : px - 14
        const badgeTop  = isSel && lastRect ? lastRect.y  * height - 14 : py - 14

        // Hover handlers shared by badge and highlight rects
        const hoverProps = {
          onMouseEnter: () => setHoveredMarkerId(marker.id),
          onMouseLeave: (e: React.MouseEvent) => {
            // Only clear if not moving to another part of the same marker UI
            const rel = e.relatedTarget as HTMLElement | null
            if (!rel?.closest(`[data-marker-id="${marker.id}"]`)) {
              setHoveredMarkerId(null)
            }
          },
        }

        return (
          <div key={marker.id} data-marker-id={marker.id}>
            {/* Per-line selection highlights */}
            {highlightRects.map((r, ri) => (
              <div
                key={ri}
                data-marker-badge="true"
                {...hoverProps}
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
              {...hoverProps}
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
                boxShadow: isHovered ? `0 2px 10px ${color}88` : '0 2px 6px rgba(0,0,0,0.25)',
                pointerEvents: 'auto',
                userSelect: 'none',
                zIndex: 22,
                whiteSpace: 'nowrap',
                transition: 'box-shadow 0.15s',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
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

            {/* Hover Tooltip */}
            {isHovered && (
              <div
                data-marker-badge="true"
                data-marker-id={marker.id}
                onMouseEnter={() => setHoveredMarkerId(marker.id)}
                onMouseLeave={() => setHoveredMarkerId(null)}
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
                    &quot;{marker.selected_text.length > 90
                      ? marker.selected_text.slice(0, 90) + '…'
                      : marker.selected_text}&quot;
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

                {/* Teacher note */}
                {marker.note && (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 6,
                    padding: '5px 8px',
                    fontSize: 11,
                    color: '#15803d',
                    marginBottom: 6,
                    lineHeight: 1.4,
                  }}>
                    💬 {marker.note}
                  </div>
                )}

                <p style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginBottom: readOnly ? 0 : 8 }}>
                  -{et?.deduction} pts · Competência {marker.competency}
                </p>
                {!readOnly && (
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
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Note input popover after placing a marker */}
      {pendingNote && (
        <NotePopover
          x={pendingNote.badgeLeft}
          y={pendingNote.badgeTop}
          containerWidth={width}
          onConfirm={handleNoteConfirm}
          onDismiss={handleNoteDismiss}
        />
      )}
    </div>
  )
}
