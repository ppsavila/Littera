'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useViewerStore } from '@/stores/viewerStore'
import { AnnotationCanvas } from '@/components/annotation/AnnotationCanvas'
import { ErrorMarkerLayer } from '@/components/annotation/ErrorMarkerLayer'
import { ZoomControls } from './ZoomControls'
import { Loader2 } from 'lucide-react'
import type { Essay } from '@/types/essay'

interface Props {
  essay: Essay
}

export function PDFRenderer({ essay }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pages, setPages] = useState<{ canvas: HTMLCanvasElement; width: number; height: number }[]>([])
  const [loading, setLoading] = useState(true)
  const { zoom, setZoom, setTotalPages, setPageDimensions, setIsLoading } = useViewerStore()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadPdf() {
      const supabase = createClient()
      const { data } = await supabase.storage
        .from('essays')
        .createSignedUrl(essay.storage_path!, 3600)

      if (data?.signedUrl) {
        setPdfUrl(data.signedUrl)
      }
    }
    loadPdf()
  }, [essay.storage_path])

  useEffect(() => {
    if (!pdfUrl) return

    async function renderPdf() {
      setLoading(true)
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

      const pdf = await pdfjsLib.getDocument(pdfUrl!).promise
      setTotalPages(pdf.numPages)

      const renderedPages: typeof pages = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (page.render as any)({ canvasContext: ctx, viewport }).promise
        setPageDimensions(i, { width: viewport.width, height: viewport.height })
        renderedPages.push({ canvas, width: viewport.width, height: viewport.height })
      }

      setPages(renderedPages)
      setLoading(false)
      setIsLoading(false)

      // Auto-fit to width on mobile
      if (renderedPages.length > 0 && window.innerWidth < 640) {
        const available = (containerRef.current?.parentElement?.clientWidth ?? window.innerWidth) - 32
        setZoom(available / renderedPages[0].width)
      }
    }

    renderPdf()
  }, [pdfUrl, setTotalPages, setPageDimensions, setIsLoading])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        Carregando PDF...
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <ZoomControls />
      <div className="py-4 space-y-4" ref={containerRef}>
        {pages.map((page, i) => (
          <div
            key={i}
            className="relative shadow-lg"
            style={{ width: page.width * zoom, height: page.height * zoom }}
          >
            <canvas
              ref={(el) => {
                if (el && el !== page.canvas) {
                  const ctx = el.getContext('2d')!
                  el.width = page.canvas.width
                  el.height = page.canvas.height
                  ctx.drawImage(page.canvas, 0, 0)
                }
              }}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
            <AnnotationCanvas
              essayId={essay.id}
              pageNumber={i + 1}
              width={page.width * zoom}
              height={page.height * zoom}
              naturalWidth={page.width}
              naturalHeight={page.height}
            />
            <ErrorMarkerLayer
              essayId={essay.id}
              pageNumber={i + 1}
              width={page.width * zoom}
              height={page.height * zoom}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
