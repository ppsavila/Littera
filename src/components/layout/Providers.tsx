'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { SuspendedPostHogPageView } from '@/components/analytics/PostHogPageView'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  )

  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false,    // manual tracking via PostHogPageView (D-05)
      autocapture: false,         // D-18: no noise, full control
      persistence: 'localStorage', // D-18
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <QueryClientProvider client={queryClient}>
        <SuspendedPostHogPageView />
        {children}
      </QueryClientProvider>
    </PHProvider>
  )
}
