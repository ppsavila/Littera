'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayInput } from '@/components/ui/ClayInput'
import { User, Phone, School, Loader2, CheckCircle } from 'lucide-react'

interface ProfileFormProps {
  initialData: {
    full_name: string
    cellphone: string | null
    school: string | null
  }
  email: string
  onboarding?: boolean
}

export function ProfileForm({ initialData, email, onboarding }: ProfileFormProps) {
  const router = useRouter()
  const [fullName, setFullName]     = useState(initialData.full_name)
  const [cellphone, setCellphone]   = useState(initialData.cellphone ?? '')
  const [school, setSchool]         = useState(initialData.school ?? '')
  const [loading, setLoading]       = useState(false)
  const [saved, setSaved]           = useState(false)
  const [error, setError]           = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, cellphone, school }),
    })

    setLoading(false)

    if (!res.ok) {
      setError('Não foi possível salvar. Tente novamente.')
      return
    }

    if (onboarding) {
      router.push('/essays')
    } else {
      setSaved(true)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email — read-only */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-sm font-semibold ml-0.5"
          style={{ color: 'var(--littera-ink)' }}
        >
          E-mail
        </label>
        <div
          className="littera-input flex items-center gap-2 opacity-60 cursor-not-allowed select-none"
          style={{ background: 'var(--littera-mist)' }}
        >
          <span style={{ color: 'var(--littera-slate)' }}>
            <User className="w-4 h-4" />
          </span>
          <span className="text-sm" style={{ color: 'var(--littera-slate)' }}>
            {email}
          </span>
        </div>
        <p className="text-xs ml-0.5" style={{ color: 'var(--littera-slate)' }}>
          O e-mail não pode ser alterado.
        </p>
      </div>

      <ClayInput
        label="Nome completo"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Seu nome"
        required
        icon={<User className="w-4 h-4" />}
      />

      <ClayInput
        label="Celular"
        type="tel"
        value={cellphone}
        onChange={(e) => setCellphone(e.target.value)}
        placeholder="+55 11 99999-9999"
        icon={<Phone className="w-4 h-4" />}
      />

      <ClayInput
        label="Escola / Instituição"
        type="text"
        value={school}
        onChange={(e) => setSchool(e.target.value)}
        placeholder="Nome da escola"
        icon={<School className="w-4 h-4" />}
      />

      {error && (
        <div
          className="text-sm px-4 py-3 rounded-lg"
          style={{
            background: 'var(--littera-rose-light)',
            border: '1px solid rgba(190,18,60,0.25)',
            color: 'var(--littera-rose)',
          }}
        >
          {error}
        </div>
      )}

      {saved && (
        <div
          className="text-sm px-4 py-3 rounded-lg flex items-center gap-2"
          style={{
            background: 'var(--littera-forest-light)',
            border: '1px solid rgba(26,77,58,0.20)',
            color: 'var(--littera-forest)',
          }}
        >
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Perfil salvo com sucesso!
        </div>
      )}

      <ClayButton
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={loading || !fullName}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : null}
        {loading
          ? 'Salvando...'
          : onboarding
          ? 'Salvar e começar'
          : 'Salvar perfil'}
      </ClayButton>
    </form>
  )
}
