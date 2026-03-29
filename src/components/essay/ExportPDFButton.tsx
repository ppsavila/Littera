'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useScoringStore } from '@/stores/scoringStore'
import { useErrorMarkerStore } from '@/stores/errorMarkerStore'
import { useAnnotationStore } from '@/stores/annotationStore'
import { useViewerStore } from '@/stores/viewerStore'
import { getErrorType } from '@/types/error-marker'
import { COMPETENCIES } from '@/types/essay'
import type { Essay } from '@/types/essay'
import type { ErrorMarker, MarkerRect } from '@/types/error-marker'
import type { Annotation } from '@/types/annotation'

interface Props {
  essay: Essay
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}

function getCompetencyColor(competency: number): string {
  return COMPETENCIES.find((c) => c.number === competency)?.color ?? '#ef4444'
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Replace characters not in WinAnsi (pdf-lib standard fonts) */
function sanitize(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2212/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\xFF]/g, '?')
}

// ─── Canvas drawing ────────────────────────────────────────────────────────────

function drawAnnotationsOnCanvas(
  ctx: CanvasRenderingContext2D,
  pageAnnotations: Annotation[],
  W: number,
  H: number,
) {
  for (const ann of pageAnnotations) {
    const s = ann.shape_data
    ctx.save()

    switch (ann.type) {
      case 'highlight': {
        ctx.globalAlpha = s.opacity ?? 0.35
        ctx.fillStyle = ann.color
        ctx.fillRect(s.x! * W, s.y! * H, s.width! * W, s.height! * H)
        break
      }
      case 'freehand': {
        if (!s.points || s.points.length < 4) break
        ctx.globalAlpha = s.opacity ?? 1
        ctx.strokeStyle = ann.color
        ctx.lineWidth = s.strokeWidth ?? 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(s.points[0] * W, s.points[1] * H)
        for (let j = 2; j < s.points.length; j += 2) {
          ctx.lineTo(s.points[j] * W, s.points[j + 1] * H)
        }
        ctx.stroke()
        break
      }
      case 'arrow': {
        if (!s.points || s.points.length < 4) break
        const x1 = s.points[0] * W, y1 = s.points[1] * H
        const x2 = s.points[2] * W, y2 = s.points[3] * H
        ctx.globalAlpha = s.opacity ?? 1
        ctx.strokeStyle = ann.color
        ctx.fillStyle = ann.color
        ctx.lineWidth = s.strokeWidth ?? 2
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
        const angle = Math.atan2(y2 - y1, x2 - x1)
        const hl = 14
        ctx.beginPath()
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - hl * Math.cos(angle - Math.PI / 6), y2 - hl * Math.sin(angle - Math.PI / 6))
        ctx.lineTo(x2 - hl * Math.cos(angle + Math.PI / 6), y2 - hl * Math.sin(angle + Math.PI / 6))
        ctx.closePath(); ctx.fill()
        break
      }
      case 'marker': {
        ctx.globalAlpha = 0.9
        ctx.fillStyle = ann.color
        ctx.beginPath()
        ctx.arc(s.x! * W, s.y! * H, 8, 0, Math.PI * 2)
        ctx.fill()
        break
      }
      case 'textbox': {
        ctx.globalAlpha = s.opacity ?? 1
        ctx.fillStyle = ann.color
        ctx.font = `${(s.fontSize ?? 14)}px Arial`
        ctx.fillText(s.text ?? '', s.x! * W, s.y! * H)
        break
      }
    }
    ctx.restore()
  }
}

function drawBadge(ctx: CanvasRenderingContext2D, text: string, color: string, x: number, y: number) {
  const pad = 5, h = 16, r = 4
  ctx.font = 'bold 10px Arial'
  const bw = ctx.measureText(text).width + pad * 2
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + bw - r, y); ctx.arcTo(x + bw, y, x + bw, y + h, r)
  ctx.lineTo(x + bw, y + h - r); ctx.arcTo(x + bw, y + h, x + bw - r, y + h, r)
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + pad, y + h / 2)
}

function drawMarkersOnCanvas(ctx: CanvasRenderingContext2D, markers: ErrorMarker[], W: number, H: number) {
  for (const marker of markers) {
    const color = getCompetencyColor(marker.competency)
    const hasRects = marker.rects && marker.rects.length > 0
    const hasBbox = marker.x2 !== null && marker.y2 !== null

    if (hasRects || hasBbox) {
      const rects: MarkerRect[] = hasRects
        ? (marker.rects as MarkerRect[])
        : [{ x: marker.x, y: marker.y, x2: marker.x2!, y2: marker.y2! }]

      ctx.globalAlpha = 0.28
      ctx.fillStyle = color
      for (const r of rects) ctx.fillRect(r.x * W, r.y * H, (r.x2 - r.x) * W, (r.y2 - r.y) * H)
      ctx.globalAlpha = 1

      const last = rects[rects.length - 1]
      drawBadge(ctx, marker.error_code, color, last.x2 * W + 2, last.y * H - 18)
    } else {
      const px = marker.x * W, py = marker.y * H
      ctx.globalAlpha = 0.75
      ctx.fillStyle = color
      ctx.fillRect(px - 22, py + 10, 44, 2)
      ctx.globalAlpha = 1
      drawBadge(ctx, marker.error_code, color, px - 14, py - 20)
    }
  }
}

// ─── Scoring summary page ──────────────────────────────────────────────────────

function wrapText(
  getPage: () => import('pdf-lib').PDFPage,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  fontSize: number,
  font: import('pdf-lib').PDFFont,
  color: import('pdf-lib').Color,
  lineHeight: number,
  onNewPage: () => number,
): number {
  const words = text.split(' ')
  let line = ''
  let y = startY
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth) {
      if (y < 55) y = onNewPage()
      getPage().drawText(line, { x, y, font, size: fontSize, color })
      y -= lineHeight
      line = word
    } else {
      line = candidate
    }
  }
  if (line) {
    if (y < 55) y = onNewPage()
    getPage().drawText(line, { x, y, font, size: fontSize, color })
    y -= lineHeight
  }
  return y
}

async function buildScoringPage(
  pdf: import('pdf-lib').PDFDocument,
  essay: Essay,
  scores: { c1: number | null; c2: number | null; c3: number | null; c4: number | null; c5: number | null },
  notes: { c1: string; c2: string; c3: string; c4: string; c5: string },
  generalComment: string,
  totalScore: number,
  markers: ErrorMarker[],
) {
  const { StandardFonts, rgb } = await import('pdf-lib')
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const W = 595, H = 842, M = 48, BOTTOM = 55
  const cw = W - M * 2

  const ink    = rgb(0.08, 0.08, 0.08)
  const slate  = rgb(0.45, 0.45, 0.45)
  const forest = rgb(0.1, 0.42, 0.3)
  const dust   = rgb(0.85, 0.85, 0.85)
  const white  = rgb(1, 1, 1)

  let page = pdf.addPage([W, H])
  let y = H - M

  function newPage() { page = pdf.addPage([W, H]); y = H - M }
  function need(space: number) { if (y - space < BOTTOM) newPage() }
  function ln(dy = 0) { y -= dy }

  // Header
  page.drawText('LITTERA', { x: M, y, font: bold, size: 9, color: forest }); ln(18)
  page.drawText('Relatório de Correção', { x: M, y, font: bold, size: 20, color: ink }); ln(10)
  page.drawLine({ start: { x: M, y }, end: { x: M + cw, y }, thickness: 0.5, color: dust }); ln(16)

  // Essay info
  page.drawText(sanitize(essay.title), { x: M, y, font: bold, size: 13, color: ink }); ln(15)
  if (essay.theme) {
    page.drawText(sanitize(essay.theme), { x: M, y, font, size: 10, color: slate }); ln(13)
  }

  // Student info + date (EXP-04)
  const studentName = essay.student?.name ?? null
  const className = essay.student?.class_name ?? null
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const infoLine = [studentName, className, dateStr].filter(Boolean).join('  |  ')
  if (infoLine) {
    page.drawText(sanitize(infoLine), { x: M, y, font, size: 10, color: slate })
    ln(13)
  }

  ln(12)

  // Total score
  need(60)
  page.drawRectangle({ x: M, y: y - 38, width: cw, height: 46, color: forest })
  page.drawText('NOTA FINAL', { x: M + 14, y: y - 15, font: bold, size: 9, color: white })
  page.drawText(`${totalScore} / 1000 pts`, { x: M + 14, y: y - 32, font: bold, size: 17, color: white })
  ln(60)

  // Competencies
  need(20)
  page.drawText('COMPETÊNCIAS', { x: M, y, font: bold, size: 9, color: slate }); ln(14)

  const compLabels = [
    'Domínio da norma culta',
    'Compreensão da proposta',
    'Seleção e organização de informações',
    'Mecanismos de coesão textual',
    'Proposta de intervenção',
  ]
  const compScoreKeys = ['c1', 'c2', 'c3', 'c4', 'c5'] as const

  for (let i = 0; i < 5; i++) {
    const score = scores[compScoreKeys[i]] ?? 0
    const note = notes[compScoreKeys[i]] ?? ''
    const compColor = COMPETENCIES[i]?.color ?? '#1a4d3a'
    const [cr, cg, cb] = hexToRgb(compColor)

    need(40)
    const scoreLabel = `${score}/200`
    const scoreLabelW = bold.widthOfTextAtSize(scoreLabel, 10)
    page.drawText(`C${i + 1}  ${compLabels[i]}`, { x: M, y, font: bold, size: 10, color: ink })
    page.drawText(scoreLabel, { x: M + cw - scoreLabelW, y, font: bold, size: 10, color: rgb(cr, cg, cb) })
    ln(11)

    page.drawRectangle({ x: M, y: y - 4, width: cw, height: 4, color: dust })
    if (score > 0) {
      page.drawRectangle({ x: M, y: y - 4, width: Math.min(cw * (score / 200), cw), height: 4, color: rgb(cr, cg, cb) })
    }
    ln(10)

    if (note.trim()) {
      need(14)
      y = wrapText(() => page, sanitize(note.trim()), M + 6, y, cw - 6, 9, font, slate, 12, () => { newPage(); return y })
    }
    ln(10)
  }

  // General comment
  if (generalComment?.trim()) {
    need(40)
    page.drawLine({ start: { x: M, y }, end: { x: M + cw, y }, thickness: 0.5, color: dust }); ln(14)
    page.drawText('COMENTÁRIO GERAL', { x: M, y, font: bold, size: 9, color: slate }); ln(13)
    y = wrapText(() => page, sanitize(generalComment.trim()), M, y, cw, 10, font, ink, 14, () => { newPage(); return y })
    ln(6)
  }

  // Errors
  if (markers.length > 0) {
    need(40)
    page.drawLine({ start: { x: M, y }, end: { x: M + cw, y }, thickness: 0.5, color: dust }); ln(14)
    page.drawText(`ERROS MARCADOS  (${markers.length})`, { x: M, y, font: bold, size: 9, color: slate }); ln(14)

    for (const marker of markers) {
      need(16)
      const et = getErrorType(marker.error_code, marker.competency)
      const [cr, cg, cb] = hexToRgb(getCompetencyColor(marker.competency))
      const label = sanitize(et ? `${et.label}  -${et.deduction} pts  C${marker.competency}  p.${marker.page_number}` : marker.error_code)
      const codeW = bold.widthOfTextAtSize(`[${marker.error_code}]`, 9)
      page.drawText(`[${marker.error_code}]`, { x: M, y, font: bold, size: 9, color: rgb(cr, cg, cb) })
      page.drawText(label, { x: M + codeW + 5, y, font, size: 9, color: slate })
      ln(13)
    }
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ExportPDFButton({ essay }: Props) {
  const [exporting, setExporting] = useState(false)
  const { scores, notes, generalComment, totalScore: getTotalScore } = useScoringStore()
  const { markers } = useErrorMarkerStore()
  const { annotations } = useAnnotationStore()
  const { pageCanvases, totalPages } = useViewerStore()

  async function handleExport() {
    setExporting(true)
    try {
      const { PDFDocument } = await import('pdf-lib')
      const pdf = await PDFDocument.create()

      // Text-type essays: capture the HTML text container to canvas via html2canvas
      if (essay.source_type === 'text' && !pageCanvases[1]) {
        const textEl = document.querySelector('[data-essay-text-container="1"]') as HTMLElement
        if (textEl) {
          const html2canvas = (await import('html2canvas')).default
          const captured = await html2canvas(textEl, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            // Use the element's scroll dimensions for full capture
            width: textEl.scrollWidth,
            height: textEl.scrollHeight,
          })
          // Register in viewerStore so the existing loop picks it up
          const { setPageCanvas } = useViewerStore.getState()
          setPageCanvas(1, captured)
        }
      }

      for (let i = 1; i <= totalPages; i++) {
        const srcCanvas = useViewerStore.getState().pageCanvases[i]
        if (!srcCanvas) continue

        const W = srcCanvas.width
        const H = srcCanvas.height

        const canvas = document.createElement('canvas')
        canvas.width = W
        canvas.height = H
        const ctx = canvas.getContext('2d')!

        // White background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, W, H)

        // Essay content (already rendered by PDFRenderer/ImageRenderer)
        ctx.drawImage(srcCanvas, 0, 0)

        // Annotations
        drawAnnotationsOnCanvas(ctx, annotations[i] ?? [], W, H)

        // Error markers
        drawMarkersOnCanvas(ctx, markers.filter((m) => m.page_number === i), W, H)

        const img = await pdf.embedJpg(dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.88)))
        const page = pdf.addPage([img.width / 2, img.height / 2])
        page.drawImage(img, { x: 0, y: 0, width: img.width / 2, height: img.height / 2 })
      }

      await buildScoringPage(pdf, essay, scores, notes, generalComment, getTotalScore(), markers)

      const bytes = await pdf.save()
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${essay.title} - Corrigida.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
      alert(`Erro ao exportar: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={{
        background: 'var(--littera-mist)',
        color: 'var(--littera-slate)',
        border: '1px solid var(--littera-dust)',
        opacity: exporting ? 0.7 : 1,
        cursor: exporting ? 'not-allowed' : 'pointer',
      }}
      title="Exportar redação corrigida em PDF"
    >
      {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      {exporting ? 'Exportando…' : 'Exportar PDF'}
    </button>
  )
}
