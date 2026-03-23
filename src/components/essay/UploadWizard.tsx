'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { Upload, FileText, ImageIcon, Type, ChevronRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const sourceType: SourceType = file.type === 'application/pdf' ? 'pdf' : 'image'
    const preview = sourceType === 'image' ? URL.createObjectURL(file) : null
    setFileState({ file, sourceType, textContent: '', preview })
    setTitle(file.name.replace(/\.[^.]+$/, ''))
    setStep('metadata')
  }, [])

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
      }

      const { data: essay, error: essayError } = await supabase
        .from('essays')
        .insert({
          teacher_id:   user.id,
          student_id:   studentId,
          title:        title || 'Redação sem título',
          source_type:  fileState.sourceType,
          storage_path: storagePath,
          raw_text:     rawText,
          theme:        theme.trim() || null,
          status:       'pending',
        })
        .select('id')
        .single()

      if (essayError) throw essayError

      router.push(`/essays/${essay.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar redação')
      setSubmitting(false)
    }
  }

  if (step === 'metadata') {
    return (
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
