'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { PDFRenderer } from './PDFRenderer'
import { ImageRenderer } from './ImageRenderer'
import { TextRenderer } from './TextRenderer'
import { createClient } from '@/lib/supabase/client'
import { useViewerStore } from '@/stores/viewerStore'
import { ImageIcon, X, Loader2, Save } from 'lucide-react'
import type { Essay } from '@/types/essay'

interface Props {
  essay: Essay
}

/** Lightbox to view the original handwritten image — rendered via portal so it's above everything */
function OriginalImageModal({ storagePath, onClose }: { storagePath: string; onClose: () => void }) {
  const { data: imageUrl } = useQuery({
    queryKey: ['essay-signed-url', storagePath],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase.storage.from('essays').createSignedUrl(storagePath, 3600)
      return data?.signedUrl ?? null
    },
    staleTime: 55 * 60 * 1000, // URL válida por 1h; refetch com 5 min de antecedência
    retry: 1,
  })

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--littera-paper)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--littera-dust)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--littera-ink)' }}>
            Imagem original da redação
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--littera-slate)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-auto flex-1 flex items-center justify-center p-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Redação original"
              className="max-w-full rounded-lg shadow-md"
              style={{ maxHeight: 'calc(90vh - 120px)' }}
            />
          ) : (
            <div className="flex items-center gap-2" style={{ color: 'var(--littera-slate)' }}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Carregando imagem...</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

/** Full-screen text editor — rendered via portal so it's above everything */
function TextEditModal({ essay, onClose }: { essay: Essay; onClose: () => void }) {
  const [text, setText] = useState(essay.raw_text ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/essays/${essay.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: text }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Erro ao salvar')
      }
      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, background: 'rgba(0,0,0,0.75)' }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--littera-paper)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--littera-dust)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--littera-ink)' }}>
            Editar texto da redação
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--littera-slate)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Textarea */}
        <div
          className="flex-1 overflow-auto flex flex-col items-center py-5 px-4"
          style={{ background: 'var(--littera-parchment)' }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="resize-none w-full font-serif leading-relaxed text-gray-900 focus:outline-none"
            style={{
              maxWidth: 680,
              padding: '3rem',
              fontSize: '0.9375rem',
              lineHeight: 1.8,
              minHeight: 500,
              background: '#fff',
              border: '1px solid var(--littera-dust)',
              borderRadius: 8,
              boxShadow: 'var(--littera-shadow-sm)',
            }}
            autoFocus
          />
          <p className="text-xs mt-2" style={{ color: 'var(--littera-slate)' }}>
            {text.length} caracteres
          </p>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid var(--littera-dust)' }}
        >
          {error ? (
            <p className="text-sm" style={{ color: 'var(--littera-rose)' }}>{error}</p>
          ) : (
            <p className="text-xs" style={{ color: 'var(--littera-slate)' }}>
              Corrija apenas erros de transcrição — preserve a ortografia original do aluno
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="littera-btn littera-btn-outline px-4 py-1.5 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="littera-btn littera-btn-primary px-4 py-1.5 text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function DocumentRenderer({ essay }: Props) {
  const [showImageModal, setShowImageModal] = useState(false)
  const { isTextEditMode, setIsTextEditMode } = useViewerStore()

  if (essay.source_type === 'pdf' && essay.storage_path) {
    return <PDFRenderer essay={essay} />
  }

  // Image with extracted text: show text as primary view, image accessible via modal
  if (essay.source_type === 'image' && essay.raw_text) {
    return (
      <>
        {showImageModal && essay.storage_path && (
          <OriginalImageModal
            storagePath={essay.storage_path}
            onClose={() => setShowImageModal(false)}
          />
        )}

        {isTextEditMode && (
          <TextEditModal
            essay={essay}
            onClose={() => setIsTextEditMode(false)}
          />
        )}

        {/* Button to open original image */}
        {essay.storage_path && (
          <div className="flex justify-end px-6 pt-4 pb-0">
            <button
              onClick={() => setShowImageModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: 'var(--littera-paper)',
                border: '1px solid var(--littera-dust)',
                color: 'var(--littera-slate)',
                boxShadow: 'var(--littera-shadow-xs)',
              }}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Ver imagem original
            </button>
          </div>
        )}

        <TextRenderer text={essay.raw_text} essayId={essay.id} />
      </>
    )
  }

  // Image without extracted text: show image directly (legacy or failed extraction)
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
