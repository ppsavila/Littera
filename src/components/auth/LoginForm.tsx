'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayInput } from '@/components/ui/ClayInput'

type Mode = 'password' | 'magic' | 'signup'

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggleShow: () => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold ml-0.5" style={{ color: 'var(--littera-ink)' }}>
        {label}
      </label>
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--littera-slate)' }}
        >
          <Lock className="w-4 h-4" />
        </span>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          required
          className="littera-input pr-10"
          style={{ paddingLeft: '2.5rem' }}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: 'var(--littera-slate)' }}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export function LoginForm() {
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handlePassword(e: React.SyntheticEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos'
          : error.message
      )
    } else {
      router.push('/essays')
      router.refresh()
    }
  }

  async function handleSignup(e: React.SyntheticEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/callback?next=/profile?onboarding=true` },
    })
    setLoading(false)
    if (error) {
      setError(
        error.message.includes('already registered')
          ? 'Este e-mail já está cadastrado. Faça login.'
          : error.message
      )
    } else {
      setSignedUp(true)
    }
  }

  async function handleMagicLink(e: React.SyntheticEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/callback` },
    })
    setLoading(false)
    if (error) {
      setError(
        error.message.includes('rate limit')
          ? 'Limite de e-mails atingido. Aguarde alguns minutos ou use senha.'
          : error.message
      )
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div
        className="text-center py-8 px-6 rounded-xl"
        style={{
          background: 'var(--littera-forest-light)',
          border: '1px solid rgba(26,77,58,0.20)',
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--littera-forest)', color: '#fff' }}
        >
          <Mail className="w-5 h-5" />
        </div>
        <h3 className="font-display text-lg font-semibold mb-2" style={{ color: 'var(--littera-forest)' }}>
          Verifique seu e-mail
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--littera-slate)' }}>
          Enviamos um link para{' '}
          <strong className="font-medium" style={{ color: 'var(--littera-ink)' }}>{email}</strong>.
          <br />Clique no link para entrar.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-5 text-sm font-medium underline underline-offset-2 transition-colors"
          style={{ color: 'var(--littera-forest)' }}
        >
          Voltar
        </button>
      </div>
    )
  }

  if (signedUp) {
    return (
      <div
        className="text-center py-8 px-6 rounded-xl"
        style={{
          background: 'var(--littera-forest-light)',
          border: '1px solid rgba(26,77,58,0.20)',
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--littera-forest)', color: '#fff' }}
        >
          <Mail className="w-5 h-5" />
        </div>
        <h3 className="font-display text-lg font-semibold mb-2" style={{ color: 'var(--littera-forest)' }}>
          Conta criada!
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--littera-slate)' }}>
          Enviamos um e-mail de confirmação para{' '}
          <strong className="font-medium" style={{ color: 'var(--littera-ink)' }}>{email}</strong>.
          <br />Confirme para ativar sua conta.
        </p>
        <button
          onClick={() => { setSignedUp(false); setMode('password') }}
          className="mt-5 text-sm font-medium underline underline-offset-2 transition-colors"
          style={{ color: 'var(--littera-forest)' }}
        >
          Ir para login
        </button>
      </div>
    )
  }

  const loginModes: { key: Mode; label: string }[] = [
    { key: 'password', label: 'Senha' },
    { key: 'magic',    label: 'Link mágico' },
    { key: 'signup',   label: 'Criar conta' },
  ]

  const submitDisabled =
    loading ||
    !email ||
    ((mode === 'password' || mode === 'signup') && !password) ||
    (mode === 'signup' && !confirmPassword)

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div
        className="flex rounded-lg p-0.5"
        style={{
          background: 'var(--littera-mist)',
          border: '1px solid var(--littera-dust)',
        }}
      >
        {loginModes.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setMode(key); setError('') }}
            className="flex-1 py-2 text-sm font-medium rounded-md transition-all"
            style={
              mode === key
                ? {
                    background: 'var(--littera-paper)',
                    color: 'var(--littera-ink)',
                    boxShadow: 'var(--littera-shadow-sm)',
                  }
                : { color: 'var(--littera-slate)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      <form
        onSubmit={
          mode === 'password' ? handlePassword
          : mode === 'signup'  ? handleSignup
          : handleMagicLink
        }
        className="space-y-4"
      >
        <ClayInput
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="professor@escola.edu.br"
          required
          icon={<Mail className="w-4 h-4" />}
        />

        {(mode === 'password' || mode === 'signup') && (
          <PasswordField
            label="Senha"
            value={password}
            onChange={setPassword}
            show={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
          />
        )}

        {mode === 'signup' && (
          <PasswordField
            label="Confirmar senha"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirmPassword}
            onToggleShow={() => setShowConfirmPassword((v) => !v)}
          />
        )}

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

        <ClayButton
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={submitDisabled}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : mode === 'signup' || mode === 'password' ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          {loading
            ? mode === 'signup' ? 'Criando conta...' : 'Entrando...'
            : mode === 'password'
            ? 'Entrar'
            : mode === 'signup'
            ? 'Criar conta'
            : 'Enviar link de acesso'}
        </ClayButton>
      </form>
    </div>
  )
}
