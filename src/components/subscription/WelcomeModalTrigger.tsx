'use client'

import { useState } from 'react'
import { UpgradeModal } from './UpgradeModal'

interface Props {
  onboarded: boolean
  currentPlan?: 'free' | 'plus' | 'premium'
}

export function WelcomeModalTrigger({ onboarded, currentPlan = 'free' }: Props) {
  const [open, setOpen] = useState(() => !onboarded && currentPlan === 'free')

  async function handleClose() {
    setOpen(false)
    // Mark as onboarded — fire and forget, optimistic
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarded: true }),
      })
    } catch {
      // Silent fail — modal won't reappear due to local state
    }
  }

  return <UpgradeModal open={open} onClose={handleClose} reason="welcome" currentPlan={currentPlan} />
}
