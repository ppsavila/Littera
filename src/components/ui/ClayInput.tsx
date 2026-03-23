'use client'

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ClayInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: ReactNode
  error?: string
}

export const ClayInput = forwardRef<HTMLInputElement, ClayInputProps>(
  ({ label, icon, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold ml-0.5"
            style={{ color: 'var(--littera-ink)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--littera-slate)' }}
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn('littera-input', className)}
            style={icon ? { paddingLeft: '2.5rem' } : undefined}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs ml-0.5 font-medium" style={{ color: 'var(--littera-rose)' }}>
            {error}
          </p>
        )}
      </div>
    )
  }
)

ClayInput.displayName = 'ClayInput'

interface ClayTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const ClayTextarea = forwardRef<HTMLTextAreaElement, ClayTextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold ml-0.5"
            style={{ color: 'var(--littera-ink)' }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn('littera-input resize-none', className)}
          {...props}
        />
        {error && (
          <p className="text-xs ml-0.5 font-medium" style={{ color: 'var(--littera-rose)' }}>
            {error}
          </p>
        )}
      </div>
    )
  }
)

ClayTextarea.displayName = 'ClayTextarea'
