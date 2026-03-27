import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { getUserUsageInfo } from '@/lib/subscriptions/access'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const usageInfo = await getUserUsageInfo(user.id)

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--littera-parchment)' }}
    >
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header user={user} usageInfo={usageInfo} />
        <main
          className="flex-1 overflow-auto"
          /* pb-20 on mobile for bottom nav clearance */
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="pb-20 md:pb-0">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
