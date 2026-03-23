import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeColor = 'coral' | 'purple' | 'mint' | 'yellow' | 'red' | 'green' | 'gray' |
                  'forest' | 'gold' | 'teal' | 'amber' | 'rose' | 'sage' | 'sky'

interface ClayBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor
}

const colorStyles: Record<BadgeColor, { bg: string; border: string; text: string }> = {
  // Littera palette
  forest: { bg: 'var(--littera-forest-light)', border: 'rgba(26,77,58,0.30)',  text: 'var(--littera-forest)'     },
  gold:   { bg: 'var(--littera-gold-light)',   border: 'rgba(201,134,10,0.30)', text: 'var(--littera-gold)'       },
  teal:   { bg: 'var(--littera-teal-light)',   border: 'rgba(15,118,110,0.30)', text: 'var(--littera-teal)'       },
  amber:  { bg: 'var(--littera-amber-light)',  border: 'rgba(180,83,9,0.30)',  text: 'var(--littera-amber)'      },
  rose:   { bg: 'var(--littera-rose-light)',   border: 'rgba(190,18,60,0.30)', text: 'var(--littera-rose)'       },
  sage:   { bg: 'var(--littera-sage-light)',   border: 'rgba(63,98,18,0.30)',  text: 'var(--littera-sage)'       },
  sky:    { bg: 'var(--littera-sky-light)',    border: 'rgba(3,105,161,0.30)', text: 'var(--littera-sky)'        },
  gray:   { bg: 'var(--littera-mist)',         border: 'var(--littera-dust)',  text: 'var(--littera-slate)'      },
  // Backward-compat aliases
  coral:  { bg: 'var(--littera-forest-light)', border: 'rgba(26,77,58,0.30)',  text: 'var(--littera-forest)'     },
  purple: { bg: 'var(--littera-gold-light)',   border: 'rgba(201,134,10,0.30)', text: 'var(--littera-gold)'       },
  mint:   { bg: 'var(--littera-teal-light)',   border: 'rgba(15,118,110,0.30)', text: 'var(--littera-teal)'       },
  yellow: { bg: 'var(--littera-amber-light)',  border: 'rgba(180,83,9,0.30)',  text: 'var(--littera-amber)'      },
  red:    { bg: 'var(--littera-rose-light)',   border: 'rgba(190,18,60,0.30)', text: 'var(--littera-rose)'       },
  green:  { bg: 'var(--littera-sage-light)',   border: 'rgba(63,98,18,0.30)',  text: 'var(--littera-sage)'       },
}

export function ClayBadge({ color = 'gray', className, children, style, ...props }: ClayBadgeProps) {
  const c = colorStyles[color]
  return (
    <span
      className={cn('littera-badge', className)}
      style={{ background: c.bg, borderColor: c.border, color: c.text, ...style }}
      {...props}
    >
      {children}
    </span>
  )
}
