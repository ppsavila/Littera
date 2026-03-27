import { createClient } from '@/lib/supabase/server'
import { PricingClient } from './PricingClient'
import { getUserUsageInfo } from '@/lib/subscriptions/access'
import { type Plan } from '@/lib/subscriptions/plans'

interface Props {
  searchParams: Promise<{ success?: string; plan?: string }>
}

export default async function PricingPage({ searchParams }: Props) {
  const { success, plan: planParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const usageInfo = user ? await getUserUsageInfo(user.id) : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 littera-fade-up text-center">
        <h1
          className="font-display text-3xl sm:text-4xl font-semibold mb-3"
          style={{ color: 'var(--littera-ink)' }}
        >
          Planos Litterando
        </h1>
        <p className="text-base" style={{ color: 'var(--littera-slate)' }}>
          Escolha o plano ideal para sua rotina de correções
        </p>
        <div className="littera-rule mt-5 max-w-xs mx-auto" />
      </div>

      <PricingClient
        currentPlan={usageInfo?.plan ?? 'free'}
        subscriptionsEnabled={usageInfo?.subscriptionsEnabled ?? false}
        successPlan={success === 'true' ? (planParam as Plan) : undefined}
      />
    </div>
  )
}
