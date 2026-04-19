'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { Upload, FileText, ImageIcon, Type, ChevronRight, Loader2, Sparkles, AlertTriangle, SkipForward } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { UpgradeModal } from '@/components/subscription/UpgradeModal'
import { usePostHog } from 'posthog-js/react'

type ExtractionState = 'idle' | 'extracting' | 'done' | 'error'

/** Resizes an image client-side and returns base64 JPEG — keeps payload under Claude's 5MB limit */
async function resizeImageToBase64(file: File, maxDimension = 2000): Promise<{ base64: string; mimeType: 'image/jpeg' }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context unavailable'))
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' })
    }
    img.onerror = reject
    img.src = url
  })
}

type Step = 'upload' | 'metadata'
type SourceType = 'pdf' | 'image' | 'text'

// Allowed MIME types mapped to safe extensions
const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg':      'jpg',
  'image/png':       'png',
  'image/webp':      'webp',
}

interface FileState {
  file: File | null
  sourceType: SourceType
  textContent: string
  preview: string | null
}

export function UploadWizard() {
  const router = useRouter()
  const supabase = createClient()
  const posthog = usePostHog()

  const [step, setStep] = useState<Step>('upload')
  const [fileState, setFileState] = useState<FileState>({
    file: null,
    sourceType: 'text',
    textContent: '',
    preview: null,
  })
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file')

  const [title, setTitle]             = useState('')
  const [theme, setTheme]             = useState('')
  const [studentName, setStudentName] = useState('')
  const [className, setClassName]     = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const [extractionState, setExtractionState] = useState<ExtractionState>('idle')
  const [extractedText, setExtractedText]     = useState('')

  async function extractText(file: File) {
    setExtractionState('extracting')
    try {
      const { base64, mimeType } = await resizeImageToBase64(file)
      const res = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })
      if (!res.ok) throw new Error('extraction failed')
      const { text } = await res.json()
      setExtractedText(text)
      setExtractionState('done')
    } catch {
      setExtractionState('error')
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const sourceType: SourceType = file.type === 'application/pdf' ? 'pdf' : 'image'
    const preview = sourceType === 'image' ? URL.createObjectURL(file) : null
    setFileState({ file, sourceType, textContent: '', preview })
    setTitle(file.name.replace(/\.[^.]+$/, ''))

    if (sourceType === 'image') {
      extractText(file)
    } else {
      setStep('metadata')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg':       ['.jpg', '.jpeg'],
      'image/png':        ['.png'],
      'image/webp':       ['.webp'],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  })

  function handleTextContinue() {
    if (!fileState.textContent.trim()) return
    if (!title) setTitle('Redação sem título')
    setStep('metadata')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // Find existing student or create new one (avoids duplicates)
      let studentId: string | null = null
      if (studentName.trim()) {
        const { data: existing } = await supabase
          .from('students')
          .select('id')
          .eq('teacher_id', user.id)
          .eq('name', studentName.trim())
          .maybeSingle()

        if (existing) {
          studentId = existing.id
        } else {
          const { data: created, error: createError } = await supabase
            .from('students')
            .insert({ teacher_id: user.id, name: studentName.trim(), class_name: className.trim() || null })
            .select('id')
            .single()
          if (createError) throw createError
          studentId = created.id
        }
      }

      let storagePath: string | null = null
      let rawText: string | null = null

      if (fileState.sourceType === 'text') {
        rawText = fileState.textContent
      } else if (fileState.file) {
        // Use MIME type to determine extension — not the filename
        const ext = MIME_TO_EXT[fileState.file.type] ?? 'bin'
        const path = `${user.id}/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('essays')
          .upload(path, fileState.file, { contentType: fileState.file.type })

        if (uploadError) throw uploadError
        storagePath = path

        // Include AI-extracted text so the essay can be analyzed
        if (extractedText.trim()) {
          rawText = extractedText.trim()
        }
      }

      // Create essay via API (enforces daily limit)
      const essayRes = await fetch('/api/essays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id:   studentId,
          title:        title || 'Redação sem título',
          source_type:  fileState.sourceType,
          storage_path: storagePath,
          raw_text:     rawText,
          theme:        theme.trim() || null,
          status:       'pending',
        }),
      })

      if (essayRes.status === 429) {
        setShowUpgradeModal(true)
        setSubmitting(false)
        return
      }

      if (!essayRes.ok) {
        const errData = await essayRes.json().catch(() => ({}))
        throw new Error(errData.error ?? 'Erro ao criar redação')
      }

      const essay = await essayRes.json()
      posthog?.capture('essay_created', { source_type: fileState.sourceType })
      router.push(`/essays/${essay.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar redação')
      setSubmitting(false)
    }
  }

  if (step === 'metadata') {
    return (
      <>
        <UpgradeModal
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          reason="daily_limit"
        />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className="rounded-xl p-5"
          style={{
            background: 'var(--littera-paper)',
            border: '1px solid var(--littera-dust)',
            boxShadow: 'var(--littera-shadow-sm)',
          }}
        >
          <h2
            className="font-display text-base font-semibold mb-4"
            style={{ color: 'var(--littera-ink)' }}
          >
            Informações da Redação
          </h2>

          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--littera-ink)' }}
              >
                Título <span style={{ color: 'var(--littera-rose)' }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Ex: Redação - João Silva - Turma 3A"
                className="littera-input"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--littera-ink)' }}
              >
                Tema da Redação
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Ex: O desafio do combate à desinformação no Brasil"
                className="littera-input"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--littera-slate)' }}>
                Informar o tema melhora a análise da IA
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--littera-ink)' }}
                >
                  Nome do Aluno
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nome completo"
                  className="littera-input"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--littera-ink)' }}
                >
                  Turma
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ex: 3A"
                  className="littera-input"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm"
            style={{
              background: 'var(--littera-rose-light)',
              border: '1px solid rgba(190,18,60,0.20)',
              color: 'var(--littera-rose)',
            }}
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep('upload')}
            className="littera-btn littera-btn-outline px-4 py-2 text-sm"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={submitting || !title}
            className="littera-btn littera-btn-primary px-6 py-2 text-sm"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {submitting ? 'Criando...' : 'Criar e analisar'}
          </button>
        </div>
      </form>
      </>
    )
  }

  // After dropping an image, show extraction progress / review before going to metadata
  if (inputMode === 'file' && fileState.sourceType === 'image' && extractionState !== 'idle') {
    return (
      <div className="space-y-4">
        {/* Image thumbnail */}
        {fileState.preview && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--littera-dust)', maxHeight: '220px' }}
          >
            <img
              src={fileState.preview}
              alt="Redação"
              className="w-full object-contain"
              style={{ maxHeight: '220px', background: 'var(--littera-mist)' }}
            />
          </div>
        )}

        {extractionState === 'extracting' && (
          <div
            className="rounded-xl p-6 flex flex-col items-center gap-3"
            style={{
              background: 'var(--littera-paper)',
              border: '1px solid var(--littera-dust)',
            }}
          >
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--littera-forest)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--littera-ink)' }}>
              Extraindo texto com IA...
            </p>
            <p className="text-xs text-center" style={{ color: 'var(--littera-slate)' }}>
              Lendo a redação e transcrevendo o conteúdo
            </p>
          </div>
        )}

        {extractionState === 'done' && (
          <div className="space-y-3">
            <div
              className="rounded-xl p-4"
              style={{
                background: 'var(--littera-paper)',
                border: '1px solid var(--littera-dust)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--littera-forest)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--littera-ink)' }}>
                  Texto extraído pela IA
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--littera-slate)' }}>
                Verifique se o texto foi extraído corretamente. Corrija apenas erros de leitura — erros de ortografia do aluno devem ser mantidos.
              </p>
              <div className="flex justify-center">
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  rows={14}
                  className="resize-none w-full font-serif leading-relaxed text-gray-900 focus:outline-none"
                  style={{
                    maxWidth: 540,
                    padding: '2rem',
                    fontSize: '0.9375rem',
                    lineHeight: 1.8,
                    background: '#fff',
                    border: '1px solid var(--littera-dust)',
                    borderRadius: 8,
                    boxShadow: 'var(--littera-shadow-sm)',
                  }}
                />
              </div>
              <p className="text-xs mt-1 text-center" style={{ color: 'var(--littera-slate)' }}>
                {extractedText.length} caracteres
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('metadata')}
                disabled={!extractedText.trim()}
                className="littera-btn littera-btn-primary px-5 py-2 text-sm"
              >
                Continuar
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setExtractedText(''); setStep('metadata') }}
                className="text-sm"
                style={{ color: 'var(--littera-slate)' }}
              >
                <SkipForward className="w-3 h-3 inline mr-1" />
                Usar sem texto
              </button>
            </div>
          </div>
        )}

        {extractionState === 'error' && (
          <div className="space-y-3">
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{
                background: 'var(--littera-rose-light)',
                border: '1px solid rgba(190,18,60,0.20)',
              }}
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--littera-rose)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--littera-rose)' }}>
                  Não foi possível extrair o texto automaticamente
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--littera-rose)' }}>
                  A redação será salva normalmente, mas a análise de IA não estará disponível.
                </p>
              </div>
            </div>
            <button
              onClick={() => setStep('metadata')}
              className="littera-btn littera-btn-outline px-5 py-2 text-sm"
            >
              Continuar assim mesmo
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div
        className="flex gap-1 rounded-lg p-1"
        style={{ background: 'var(--littera-mist)' }}
      >
        {(
          [
            { key: 'file', label: 'Upload de arquivo', Icon: Upload },
            { key: 'text', label: 'Colar texto',        Icon: Type   },
          ] as const
        ).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => {
              setInputMode(key)
              if (key === 'text') setFileState((s) => ({ ...s, sourceType: 'text' }))
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all',
            )}
            style={
              inputMode === key
                ? {
                    background: 'var(--littera-paper)',
                    color: 'var(--littera-ink)',
                    boxShadow: 'var(--littera-shadow-xs)',
                  }
                : { color: 'var(--littera-slate)' }
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {inputMode === 'file' ? (
        <div
          {...getRootProps()}
          className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors"
          style={{
            borderColor: isDragActive ? 'var(--littera-forest)' : 'var(--littera-dust)',
            background: isDragActive ? 'var(--littera-forest-faint)' : 'var(--littera-paper)',
          }}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--littera-rose-light)' }}
            >
              <FileText className="w-6 h-6" style={{ color: 'var(--littera-rose)' }} />
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--littera-sky-light)' }}
            >
              <ImageIcon className="w-6 h-6" style={{ color: 'var(--littera-sky)' }} />
            </div>
          </div>
          <p className="font-medium mb-1" style={{ color: 'var(--littera-ink)' }}>
            {isDragActive ? 'Solte o arquivo aqui' : 'Arraste ou clique para selecionar'}
          </p>
          <p className="text-sm" style={{ color: 'var(--littera-slate)' }}>
            PDF, JPG, PNG ou WEBP — até 20 MB
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--littera-paper)',
              border: '1px solid var(--littera-dust)',
            }}
          >
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--littera-ink)' }}
            >
              Cole o texto da redação
            </label>
            <textarea
              value={fileState.textContent}
              onChange={(e) => setFileState((s) => ({ ...s, textContent: e.target.value }))}
              placeholder="Cole ou digite o texto da redação aqui..."
              rows={14}
              className="littera-input resize-none font-mono"
              style={{ fontSize: '0.875rem' }}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--littera-slate)' }}>
              {fileState.textContent.length} caracteres
            </p>
          </div>
          <button
            onClick={handleTextContinue}
            disabled={!fileState.textContent.trim()}
            className="littera-btn littera-btn-primary px-5 py-2 text-sm"
          >
            Continuar
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
