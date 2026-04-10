'use client'

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

interface Props {
  userId: string
  plan: string
  createdAt: string
}

export function PostHogIdentify({ userId, plan, createdAt }: Props) {
  const posthog = usePostHog()

  useEffect(() => {
    if (posthog && userId && !posthog._isIdentified()) {
      posthog.identify(userId, { plan, created_at: createdAt })
    }
  }, [posthog, userId, plan, createdAt])

  return null
}
