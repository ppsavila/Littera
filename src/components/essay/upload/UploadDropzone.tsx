'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, ImageIcon, Type, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type SourceType = 'pdf' | 'image' | 'text'
type InputMode = 'file' | 'text'

interface FileState {
  file: File | null
  sourceType: SourceType
  textContent: string
  preview: string | null
}

interface Props {
  inputMode: InputMode
  fileState: FileState
  onInputModeChange: (mode: InputMode) => void
  onFileStateChange: (state: FileState) => void
  onTitleChange: (title: string) => void
  onDrop: (files: File[]) => void
  onTextContinue: () => void
}

export function UploadDropzone({
  inputMode,
  fileState,
  onInputModeChange,
  onFileStateChange,
  onTitleChange,
  onDrop,
  onTextContinue,
}: Props) {
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
              onInputModeChange(key)
              if (key === 'text') onFileStateChange({ ...fileState, sourceType: 'text' })
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
              onChange={(e) => onFileStateChange({ ...fileState, textContent: e.target.value })}
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
            onClick={onTextContinue}
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
