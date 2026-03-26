'use client'

import { useEffect, useState, useRef } from 'react'
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

export function ImageRenderer({ essay }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { zoom, setZoom, setPageDimensions, setTotalPages, setIsLoading, setPageCanvas } = useViewerStore()

  useEffect(() => {
    async function loadImage() {
      const supabase = createClient()
      const { data } = await supabase.storage
        .from('essays')
        .createSignedUrl(essay.storage_path!, 3600)

      if (data?.signedUrl) setImageUrl(data.signedUrl)
    }
    loadImage()
  }, [essay.storage_path])

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight, src } = e.currentTarget
    setDims({ width: naturalWidth, height: naturalHeight })
    setPageDimensions(1, { width: naturalWidth, height: naturalHeight })
    setTotalPages(1)
    setIsLoading(false)
    // Store canvas for export
    const canvas = document.createElement('canvas')
    canvas.width = naturalWidth
    canvas.height = naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(e.currentTarget, 0, 0)
    setPageCanvas(1, canvas)

    // Auto-fit to width on mobile
    if (window.innerWidth < 640) {
      const available = (containerRef.current?.clientWidth ?? window.innerWidth) - 32
      setZoom(available / naturalWidth)
    }
  }

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        Carregando imagem...
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-4" ref={containerRef}>
      <ZoomControls />
      <div
        data-essay-page={1}
        className="relative shadow-lg mt-4"
        style={dims ? { width: dims.width * zoom, height: dims.height * zoom } : undefined}
      >
        <img
          src={imageUrl}
          alt="Redação"
          crossOrigin="anonymous"
          onLoad={handleImageLoad}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
        {dims && (
          <>
            <AnnotationCanvas
              essayId={essay.id}
              pageNumber={1}
              width={dims.width * zoom}
              height={dims.height * zoom}
              naturalWidth={dims.width}
              naturalHeight={dims.height}
            />
            <ErrorMarkerLayer
              essayId={essay.id}
              pageNumber={1}
              width={dims.width * zoom}
              height={dims.height * zoom}
            />
          </>
        )}
      </div>
    </div>
  )
}
