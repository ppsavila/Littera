import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { UserCircle } from 'lucide-react'

interface Props {
  searchParams: Promise<{ onboarding?: string }>
}

export default async function ProfilePage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, cellphone, school')
    .eq('id', user.id)
    .single()

  const { onboarding } = await searchParams
  const isOnboarding = onboarding === 'true'

  return (
    <div className="flex flex-col items-center justify-start min-h-full p-6 pt-10">
      <div
        className="littera-card w-full max-w-md p-8"
        style={{ boxShadow: 'var(--littera-shadow-md)' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'var(--littera-forest)', color: '#fff' }}
          >
            <UserCircle className="w-8 h-8" />
          </div>

          {isOnboarding ? (
            <>
              <h1 className="font-display text-2xl font-semibold text-center" style={{ color: 'var(--littera-ink)' }}>
                Bem-vindo ao Litterando!
              </h1>
              <p className="text-sm text-center leading-relaxed" style={{ color: 'var(--littera-slate)' }}>
                Complete seu perfil para que possamos emitir cobranças corretamente.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--littera-ink)' }}>
                Meu Perfil
              </h1>
              <p className="text-sm" style={{ color: 'var(--littera-slate)' }}>
                Suas informações de conta
              </p>
            </>
          )}
        </div>

        <ProfileForm
          initialData={{
            full_name: profile?.full_name ?? '',
            cellphone: profile?.cellphone ?? null,
            school:    profile?.school    ?? null,
          }}
          email={user.email ?? ''}
          onboarding={isOnboarding}
        />
      </div>
    </div>
  )
}
