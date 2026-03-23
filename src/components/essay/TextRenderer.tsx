'use client'

import { useEffect, useRef, useState } from 'react'
import { AnnotationCanvas } from '@/components/annotation/AnnotationCanvas'
import { ErrorMarkerLayer } from '@/components/annotation/ErrorMarkerLayer'
import { useViewerStore } from '@/stores/viewerStore'
import { useErrorMarkerStore } from '@/stores/errorMarkerStore'

interface Props {
  text: string
  essayId: string
}

const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

export function TextRenderer({ text, essayId }: Props) {
  const [height, setHeight] = useState(PAGE_HEIGHT)
  const { zoom, setZoom } = useViewerStore()
  const { isErrorMode } = useErrorMarkerStore()
  const outerRef = useRef<HTMLDivElement>(null)

  // Auto-fit to container width on mobile
  useEffect(() => {
    if (window.innerWidth < 640) {
      const available = (outerRef.current?.clientWidth ?? window.innerWidth) - 32
      setZoom(available / PAGE_WIDTH)
    }
  }, [setZoom])

  function handleContainerRef(el: HTMLDivElement | null) {
    if (el) {
      const actual = el.scrollHeight
      if (actual > 0) setHeight(actual)
    }
  }

  const paragraphs = text.split(/\n\n+/).filter(Boolean)

  return (
    <div className="flex flex-col items-center py-4" ref={outerRef}>
      <div
        className="relative shadow-lg bg-white"
        style={{ width: PAGE_WIDTH * zoom, minHeight: height * zoom }}
        // data attr so ErrorMarkerLayer can identify this container
        data-essay-page="1"
      >
        {/* Annotation canvas (hidden when error mode) */}
        {!isErrorMode && (
          <AnnotationCanvas
            essayId={essayId}
            pageNumber={1}
            width={PAGE_WIDTH * zoom}
            height={height * zoom}
            naturalWidth={PAGE_WIDTH}
            naturalHeight={height}
          />
        )}

        {/* Text — selectable in error mode, pointer-events off otherwise */}
        <div
          ref={handleContainerRef}
          className="absolute inset-0 p-12 font-serif text-gray-900 leading-relaxed"
          style={{
            fontSize: 16 * zoom,
            lineHeight: 1.8,
            minHeight: PAGE_HEIGHT,
            // In error mode: text is selectable and interactive
            // In annotation mode: pointer-events off (canvas handles it)
            userSelect: isErrorMode ? 'text' : 'none',
            pointerEvents: isErrorMode ? 'auto' : 'none',
            zIndex: isErrorMode ? 5 : 0,
          }}
        >
          {paragraphs.map((para, i) => (
            <p key={i} className="mb-4">
              {para}
            </p>
          ))}
        </div>

        {/* Error markers rendered on top — pointer-events:none on layer,
            individual badges have pointer-events:auto */}
        <ErrorMarkerLayer
          essayId={essayId}
          pageNumber={1}
          width={PAGE_WIDTH * zoom}
          height={height * zoom}
        />
      </div>
    </div>
  )
}
