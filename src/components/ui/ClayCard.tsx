import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ClayCardProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md'
  variant?: 'default' | 'warm' | 'forest'
  padding?: string
}

const variantClass = {
  default: 'littera-card',
  warm:    'littera-card-warm',
  forest:  'littera-card-forest',
}

export function ClayCard({
  size = 'md',
  variant = 'warm',
  padding = 'p-5',
  className,
  children,
  ...props
}: ClayCardProps) {
  return (
    <div
      className={cn(variantClass[variant], padding, className)}
      {...props}
    >
      {children}
    </div>
  )
}
