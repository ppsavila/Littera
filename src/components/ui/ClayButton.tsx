'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'coral' | 'purple' | 'mint' | 'white' | 'ghost' | 'primary' | 'gold' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ClayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClass: Record<Variant, string> = {
  primary: 'littera-btn-primary',
  coral:   'littera-btn-primary',   // alias
  gold:    'littera-btn-gold',
  purple:  'littera-btn-gold',      // alias
  outline: 'littera-btn-outline',
  white:   'littera-btn-outline',   // alias
  mint:    'littera-btn-outline',   // alias
  ghost:   'littera-btn-ghost',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
}

export const ClayButton = forwardRef<HTMLButtonElement, ClayButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn('littera-btn', variantClass[variant], sizeClasses[size], className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

ClayButton.displayName = 'ClayButton'
