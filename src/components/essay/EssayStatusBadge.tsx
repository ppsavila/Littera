import type { EssayStatus } from '@/types/essay'

type BadgeConfig = {
  label: string
  bg: string
  border: string
  color: string
}

const STATUS_CONFIG: Record<EssayStatus, BadgeConfig> = {
  pending:    {
    label: 'Pendente',
    bg: 'var(--littera-amber-light)',
    border: 'rgba(180,83,9,0.25)',
    color: 'var(--littera-amber)',
  },
  analyzing:  {
    label: 'Analisando',
    bg: 'var(--littera-sky-light)',
    border: 'rgba(3,105,161,0.25)',
    color: 'var(--littera-sky)',
  },
  analyzed:   {
    label: 'Analisada',
    bg: 'var(--littera-teal-light)',
    border: 'rgba(15,118,110,0.25)',
    color: 'var(--littera-teal)',
  },
  correcting: {
    label: 'Em revisão',
    bg: 'var(--littera-forest-light)',
    border: 'rgba(26,77,58,0.25)',
    color: 'var(--littera-forest)',
  },
  done:       {
    label: 'Concluída',
    bg: 'var(--littera-sage-light)',
    border: 'rgba(63,98,18,0.25)',
    color: 'var(--littera-sage)',
  },
}

export function EssayStatusBadge({ status }: { status: EssayStatus }) {
  const c = STATUS_CONFIG[status]
  return (
    <span
      className="littera-badge"
      style={{ background: c.bg, borderColor: c.border, color: c.color }}
    >
      {c.label}
    </span>
  )
}
