export const dynamic = 'force-dynamic'

import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--littera-parchment)' }}
    >
      {/* Left panel — decorative, hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'var(--littera-forest)',
          color: '#fff',
        }}
      >
        {/* Subtle texture pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 28px,
              rgba(255,255,255,0.6) 28px,
              rgba(255,255,255,0.6) 29px
            )`,
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-lg"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff',
              }}
            >
              L
            </div>
            <span className="font-display text-xl font-semibold tracking-wide text-white">
              Littera
            </span>
          </div>

          <blockquote className="mt-auto">
            <p
              className="font-display text-4xl font-semibold leading-snug mb-6"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              "A redação bem corrigida
              <br />é a que abre portas."
            </p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Ferramenta oficial para professores corretores do ENEM
            </p>
          </blockquote>
        </div>

        {/* Mock score card */}
        <div className="relative z-10">
          <div
            className="rounded-xl p-5"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  ENEM · Redação
                </p>
                <p className="text-sm font-semibold text-white mt-0.5">Maria da Silva</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-display font-bold text-white">840</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>/1000</p>
              </div>
            </div>

            {[
              { label: 'C1 · Norma culta',        score: 180, max: 200 },
              { label: 'C2 · Compreensão',         score: 160, max: 200 },
              { label: 'C3 · Organização',         score: 200, max: 200 },
              { label: 'C4 · Mecanismos ling.',    score: 140, max: 200 },
              { label: 'C5 · Proposta de interv.', score: 160, max: 200 },
            ].map(({ label, score, max }) => (
              <div key={label} className="mb-2 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>{label}</span>
                  <span className="text-xs font-semibold text-white">{score}</span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(score / max) * 100}%`,
                      background: 'rgba(255,255,255,0.65)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-2.5 mb-10 lg:hidden">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold"
            style={{
              background: 'var(--littera-forest)',
              color: '#fff',
            }}
          >
            L
          </div>
          <span
            className="font-display text-xl font-semibold"
            style={{ color: 'var(--littera-ink)' }}
          >
            Littera
          </span>
        </div>

        <div className="w-full max-w-sm littera-scale-in">
          <div className="mb-8">
            <h1
              className="font-display text-3xl font-semibold mb-2"
              style={{ color: 'var(--littera-ink)' }}
            >
              Bem-vindo
            </h1>
            <p className="text-sm" style={{ color: 'var(--littera-slate)' }}>
              Acesse sua conta para continuar
            </p>
          </div>

          <LoginForm />

          <p
            className="text-center text-xs mt-8"
            style={{ color: 'var(--littera-slate)' }}
          >
            Plataforma exclusiva para professores corretores do ENEM
          </p>
        </div>
      </div>
    </div>
  )
}
