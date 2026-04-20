'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePostHog } from 'posthog-js/react'
import { UploadDropzone } from './upload/UploadDropzone'
import { ExtractionReview } from './upload/ExtractionReview'
import { MetadataForm } from './upload/MetadataForm'

type ExtractionState = 'idle' | 'extracting' | 'done' | 'error'
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

  const handleDrop = useCallback((acceptedFiles: File[]) => {
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
      <MetadataForm
        title={title}
        theme={theme}
        studentName={studentName}
        className={className}
        submitting={submitting}
        error={error}
        showUpgradeModal={showUpgradeModal}
        onTitleChange={setTitle}
        onThemeChange={setTheme}
        onStudentNameChange={setStudentName}
        onClassNameChange={setClassName}
        onBack={() => setStep('upload')}
        onSubmit={handleSubmit}
        onCloseUpgradeModal={() => setShowUpgradeModal(false)}
      />
    )
  }

  // After dropping an image, show extraction progress / review before going to metadata
  if (inputMode === 'file' && fileState.sourceType === 'image' && extractionState !== 'idle') {
    return (
      <ExtractionReview
        preview={fileState.preview}
        extractionState={extractionState}
        extractedText={extractedText}
        onExtractedTextChange={setExtractedText}
        onContinue={() => setStep('metadata')}
        onSkip={() => { setExtractedText(''); setStep('metadata') }}
      />
    )
  }

  return (
    <UploadDropzone
      inputMode={inputMode}
      fileState={fileState}
      onInputModeChange={setInputMode}
      onFileStateChange={setFileState}
      onTitleChange={setTitle}
      onDrop={handleDrop}
      onTextContinue={handleTextContinue}
    />
  )
}
