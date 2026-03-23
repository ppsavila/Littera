'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Stage, Layer, Line, Rect, Arrow, Text, Circle } from 'react-konva'
import { useAnnotationStore } from '@/stores/annotationStore'
import { useErrorMarkerStore } from '@/stores/errorMarkerStore'
import { createClient } from '@/lib/supabase/client'
import { CommentPopover } from './CommentPopover'
import type Konva from 'konva'
import type { Annotation, ShapeData } from '@/types/annotation'

interface Props {
  essayId: string
  pageNumber: number
  width: number
  height: number
  naturalWidth: number
  naturalHeight: number
}

interface DrawingState {
  isDrawing: boolean
  startX: number
  startY: number
  currentPoints: number[]
}

export function AnnotationCanvas({
  essayId,
  pageNumber,
  width,
  height,
  naturalWidth,
  naturalHeight,
}: Props) {
  const {
    activeTool,
    activeColor,
    strokeWidth,
    activeCompetency,
    annotations,
    selectedId,
    addAnnotation,
    removeAnnotation,
    selectAnnotation,
  } = useAnnotationStore()

  const [drawing, setDrawing] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentPoints: [],
  })

  const [popover, setPopover] = useState<{
    visible: boolean
    annotationId: string
    x: number
    y: number
  } | null>(null)

  const { isErrorMode } = useErrorMarkerStore()
  const supabase = createClient()
  const pageAnnotations = annotations[pageNumber] ?? []

  // Normalize coords (absolute → 0-1 relative to natural page size)
  function normalize(x: number, y: number) {
    return {
      x: x / width,
      y: y / height,
    }
  }

  // Denormalize (0-1 → absolute pixels at current zoom)
  function denormalize(x: number, y: number) {
    return {
      x: x * width,
      y: y * height,
    }
  }

  function normalizePoints(points: number[]) {
    return points.map((v, i) => (i % 2 === 0 ? v / width : v / height))
  }

  function denormalizePoints(points: number[]) {
    return points.map((v, i) => (i % 2 === 0 ? v * width : v * height))
  }

  async function saveAnnotation(shapeData: ShapeData, type: Annotation['type']) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('annotations')
      .insert({
        essay_id: essayId,
        teacher_id: user.id,
        page_number: pageNumber,
        type,
        shape_data: { ...shapeData, normalized: true },
        color: activeColor,
        competency: activeCompetency,
      })
      .select()
      .single()

    if (!error && data) {
      addAnnotation(data as Annotation)
    }
  }

  async function deleteAnnotation(id: string) {
    await supabase.from('annotations').delete().eq('id', id)
    removeAnnotation(id, pageNumber)
    setPopover(null)
  }

  function getRelativePos(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    const stage = e.target.getStage()!
    const pos = stage.getPointerPosition()!
    return { x: pos.x, y: pos.y }
  }

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (activeTool === 'pan') return
    if (e.target !== e.target.getStage() && activeTool !== 'eraser') return

    const { x, y } = getRelativePos(e)
    selectAnnotation(null)
    setPopover(null)

    setDrawing({ isDrawing: true, startX: x, startY: y, currentPoints: [x, y] })
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!drawing.isDrawing) return
    const { x, y } = getRelativePos(e)

    if (activeTool === 'freehand') {
      setDrawing((d) => ({
        ...d,
        currentPoints: [...d.currentPoints, x, y],
      }))
    } else {
      setDrawing((d) => ({ ...d, currentPoints: [d.startX, d.startY, x, y] }))
    }
  }

  async function handleMouseUp(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!drawing.isDrawing) return
    const { x, y } = getRelativePos(e)
    setDrawing((d) => ({ ...d, isDrawing: false }))

    const { startX, startY, currentPoints } = drawing
    const dx = Math.abs(x - startX)
    const dy = Math.abs(y - startY)

    if (dx < 3 && dy < 3 && activeTool !== 'freehand') {
      return // Too small, skip
    }

    const normStart = normalize(startX, startY)
    const normEnd = normalize(x, y)

    switch (activeTool) {
      case 'highlight': {
        await saveAnnotation({
          x: normStart.x,
          y: normStart.y,
          width: normEnd.x - normStart.x,
          height: normEnd.y - normStart.y,
          opacity: 0.35,
          fill: activeColor,
        }, 'highlight')
        break
      }

      case 'freehand': {
        if (currentPoints.length < 4) return
        await saveAnnotation({
          points: normalizePoints(currentPoints),
          stroke: activeColor,
          strokeWidth,
          opacity: 1,
        }, 'freehand')
        break
      }

      case 'arrow': {
        await saveAnnotation({
          points: normalizePoints([startX, startY, x, y]),
          stroke: activeColor,
          strokeWidth,
          opacity: 1,
        }, 'arrow')
        break
      }

      case 'marker': {
        await saveAnnotation({
          x: normStart.x,
          y: normStart.y,
          stroke: activeColor,
          strokeWidth: strokeWidth * 2,
          opacity: 1,
        }, 'marker')
        break
      }
    }
  }

  async function handleTextboxClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (activeTool !== 'textbox') return
    const { x, y } = getRelativePos(e)
    const norm = normalize(x, y)
    const text = window.prompt('Digite o texto da anotação:')
    if (!text) return

    await saveAnnotation({
      x: norm.x,
      y: norm.y,
      text,
      fontSize: 14,
      fill: activeColor,
      opacity: 1,
    }, 'textbox')
  }

  function handleShapeClick(ann: Annotation, e: Konva.KonvaEventObject<MouseEvent>) {
    e.cancelBubble = true
    if (activeTool === 'eraser') {
      deleteAnnotation(ann.id)
      return
    }
    selectAnnotation(ann.id)
    const stage = e.target.getStage()!
    const pos = stage.getPointerPosition()!
    setPopover({ visible: true, annotationId: ann.id, x: pos.x, y: pos.y })
  }

  const cursorStyle =
    activeTool === 'pan'
      ? 'default'
      : activeTool === 'eraser'
      ? 'cell'
      : 'crosshair'

  // Render preview shape while drawing
  function renderPreview() {
    if (!drawing.isDrawing || drawing.currentPoints.length < 2) return null

    const { startX, startY, currentPoints } = drawing
    const endX = currentPoints[currentPoints.length - 2]
    const endY = currentPoints[currentPoints.length - 1]

    switch (activeTool) {
      case 'highlight':
        return (
          <Rect
            x={startX}
            y={startY}
            width={endX - startX}
            height={endY - startY}
            fill={activeColor}
            opacity={0.35}
            listening={false}
          />
        )
      case 'freehand':
        return (
          <Line
            points={currentPoints}
            stroke={activeColor}
            strokeWidth={strokeWidth}
            tension={0.3}
            lineCap="round"
            listening={false}
          />
        )
      case 'arrow':
        return (
          <Arrow
            points={currentPoints}
            stroke={activeColor}
            strokeWidth={strokeWidth}
            fill={activeColor}
            listening={false}
          />
        )
      default:
        return null
    }
  }

  // Render saved annotations
  function renderAnnotation(ann: Annotation) {
    const s = ann.shape_data
    const isSelected = ann.id === selectedId

    const strokeBorder = isSelected ? 2 : 0
    const onClick = (e: Konva.KonvaEventObject<MouseEvent>) => handleShapeClick(ann, e)

    switch (ann.type) {
      case 'highlight': {
        const pos = denormalize(s.x!, s.y!)
        return (
          <Rect
            key={ann.id}
            x={pos.x}
            y={pos.y}
            width={s.width! * width}
            height={s.height! * height}
            fill={ann.color}
            opacity={s.opacity ?? 0.35}
            stroke={isSelected ? '#1e40af' : undefined}
            strokeWidth={strokeBorder}
            onClick={onClick}
          />
        )
      }
      case 'freehand': {
        return (
          <Line
            key={ann.id}
            points={denormalizePoints(s.points!)}
            stroke={ann.color}
            strokeWidth={s.strokeWidth ?? strokeWidth}
            tension={0.3}
            lineCap="round"
            opacity={s.opacity ?? 1}
            onClick={onClick}
            hitStrokeWidth={10}
          />
        )
      }
      case 'arrow': {
        return (
          <Arrow
            key={ann.id}
            points={denormalizePoints(s.points!)}
            stroke={ann.color}
            strokeWidth={s.strokeWidth ?? strokeWidth}
            fill={ann.color}
            opacity={s.opacity ?? 1}
            onClick={onClick}
            hitStrokeWidth={10}
          />
        )
      }
      case 'marker': {
        const pos = denormalize(s.x!, s.y!)
        return (
          <Circle
            key={ann.id}
            x={pos.x}
            y={pos.y}
            radius={8}
            fill={ann.color}
            opacity={0.9}
            stroke={isSelected ? '#1e40af' : '#fff'}
            strokeWidth={isSelected ? 2 : 1}
            onClick={onClick}
          />
        )
      }
      case 'textbox': {
        const pos = denormalize(s.x!, s.y!)
        return (
          <Text
            key={ann.id}
            x={pos.x}
            y={pos.y}
            text={s.text ?? ''}
            fontSize={(s.fontSize ?? 14)}
            fill={ann.color}
            opacity={s.opacity ?? 1}
            padding={4}
            onClick={onClick}
          />
        )
      }
      default:
        return null
    }
  }

  return (
    <div
      className="absolute inset-0"
      style={{ cursor: cursorStyle, pointerEvents: isErrorMode ? 'none' : 'auto' }}
    >
      <Stage
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={activeTool === 'textbox' ? handleTextboxClick : undefined}
      >
        <Layer>
          {pageAnnotations.map(renderAnnotation)}
          {renderPreview()}
        </Layer>
      </Stage>

      {popover?.visible && (
        <CommentPopover
          annotationId={popover.annotationId}
          pageNumber={pageNumber}
          x={popover.x}
          y={popover.y}
          onClose={() => setPopover(null)}
          onDelete={() => deleteAnnotation(popover.annotationId)}
          essayId={essayId}
        />
      )}
    </div>
  )
}
