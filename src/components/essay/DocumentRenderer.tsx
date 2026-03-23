'use client'

import { PDFRenderer } from './PDFRenderer'
import { ImageRenderer } from './ImageRenderer'
import { TextRenderer } from './TextRenderer'
import type { Essay } from '@/types/essay'

interface Props {
  essay: Essay
}

export function DocumentRenderer({ essay }: Props) {
  if (essay.source_type === 'pdf' && essay.storage_path) {
    return <PDFRenderer essay={essay} />
  }

  if (essay.source_type === 'image' && essay.storage_path) {
    return <ImageRenderer essay={essay} />
  }

  if (essay.raw_text) {
    return <TextRenderer text={essay.raw_text} essayId={essay.id} />
  }

  return (
    <div className="flex items-center justify-center h-full text-gray-400">
      Nenhum conteúdo disponível
    </div>
  )
}
