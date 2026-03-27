'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { PlanBadge } from '@/components/subscription/PlanBadge'
import { UsageIndicator } from '@/components/subscription/UsageIndicator'
import type { UsageInfo } from '@/lib/subscriptions/access'

interface HeaderProps {
  user: SupabaseUser
  usageInfo?: UsageInfo
}

const PAGE_TITLES: Record<string, string> = {
  '/essays':   'Redações',
  '/students': 'Alunos',
  '/dashboard': 'Painel',
}

export function Header({ user, usageInfo }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = (user.email ?? '?').slice(0, 2).toUpperCase()

  // Find best matching page title
  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname.startsWith(key)
  )?.[1] ?? 'Litterando'

  return (
    <header
      className="flex items-center justify-between gap-4 px-5 py-3"
      style={{
        background: 'var(--littera-paper)',
        borderBottom: '1px solid var(--littera-dust)',
        minHeight: 56,
      }}
    >
      {/* Page title — visible on mobile too */}
      <h2
        className="font-display text-base font-semibold"
        style={{ color: 'var(--littera-ink)' }}
      >
        {pageTitle}
      </h2>

      {/* User section */}
      <div className="flex items-center gap-2">
        {/* Usage indicator (compact) */}
        {usageInfo && (
          <UsageIndicator
            plan={usageInfo.plan}
            used={usageInfo.used}
            limit={usageInfo.limit}
            subscriptionsEnabled={usageInfo.subscriptionsEnabled}
            compact
          />
        )}

        {/* Plan badge */}
        {usageInfo && (
          <PlanBadge
            plan={usageInfo.plan}
            subscriptionsEnabled={usageInfo.subscriptionsEnabled}
          />
        )}

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: 'var(--littera-forest)' }}
        >
          {initials}
        </div>

        <span
          className="text-sm hidden sm:block truncate max-w-[180px]"
          style={{ color: 'var(--littera-slate)' }}
        >
          {user.email}
        </span>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-opacity-80"
          style={{
            color: 'var(--littera-slate)',
            background: 'var(--littera-mist)',
            border: '1px solid var(--littera-dust)',
          }}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
