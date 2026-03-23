import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, Upload, Brain, PenLine, BarChart3 } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/essays')

  const features = [
    {
      icon: Upload,
      num: '01',
      title: 'Upload em qualquer formato',
      desc: 'PDF, imagem digitalizada ou texto colado — o Littera processa qualquer tipo de redação sem complicação.',
    },
    {
      icon: Brain,
      num: '02',
      title: 'Análise por IA (Claude)',
      desc: 'Cada competência é analisada individualmente com feedback detalhado e sugestão de nota fundamentada.',
    },
    {
      icon: PenLine,
      num: '03',
      title: 'Anotações visuais',
      desc: 'Marque trechos diretamente no documento, adicione comentários e registre erros com marcadores precisos.',
    },
    {
      icon: BarChart3,
      num: '04',
      title: 'Pontuação oficial ENEM',
      desc: 'Atribua notas seguindo os critérios oficiais: 5 competências × até 200 pontos = 1000 pontos máximos.',
    },
  ]

  const scores = [
    { label: 'C1', score: 180, max: 200 },
    { label: 'C2', score: 160, max: 200 },
    { label: 'C3', score: 200, max: 200 },
    { label: 'C4', score: 140, max: 200 },
    { label: 'C5', score: 160, max: 200 },
  ]

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--littera-parchment)', color: 'var(--littera-ink)' }}
    >
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-30 flex items-center justify-between px-6 sm:px-10 py-4"
        style={{
          background: 'rgba(253,250,245,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--littera-dust)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold"
            style={{ background: 'var(--littera-forest)', color: '#fff' }}
          >
            L
          </div>
          <span
            className="font-display text-lg font-semibold"
            style={{ color: 'var(--littera-ink)' }}
          >
            Littera
          </span>
        </div>

        <Link
          href="/login"
          className="littera-btn littera-btn-outline px-4 py-2 text-sm"
        >
          Entrar
        </Link>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="littera-fade-up">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{
                background: 'var(--littera-forest-light)',
                color: 'var(--littera-forest)',
                border: '1px solid rgba(26,77,58,0.20)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--littera-forest)' }}
              />
              Plataforma para professores do ENEM
            </div>

            <h1
              className="font-display text-4xl sm:text-5xl font-bold leading-tight mb-5"
              style={{ color: 'var(--littera-ink)' }}
            >
              Corrija redações do{' '}
              <span
                className="relative inline-block"
                style={{ color: 'var(--littera-forest)' }}
              >
                ENEM
                <span
                  className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: 'var(--littera-forest-mid)' }}
                />
              </span>
              {' '}com inteligência
            </h1>

            <p
              className="text-base sm:text-lg leading-relaxed mb-8"
              style={{ color: 'var(--littera-slate)' }}
            >
              Faça o upload da redação, receba análise automática por competência
              e atribua notas seguindo os critérios oficiais — tudo em uma só plataforma.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="littera-btn littera-btn-primary px-6 py-3 text-sm"
              >
                Começar agora
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#como-funciona"
                className="littera-btn littera-btn-outline px-6 py-3 text-sm"
              >
                Como funciona
              </a>
            </div>
          </div>

          {/* Score card preview */}
          <div className="littera-fade-up delay-200">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'var(--littera-paper)',
                border: '1px solid var(--littera-dust)',
                boxShadow: 'var(--littera-shadow-lg)',
              }}
            >
              {/* Card header */}
              <div
                className="px-5 py-4"
                style={{
                  background: 'var(--littera-forest)',
                  borderBottom: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.60)' }}>
                      ENEM 2024 · Redação
                    </p>
                    <p
                      className="font-display text-base font-semibold text-white mt-0.5"
                    >
                      Ana Carolina Martins
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-bold text-white">840</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      de 1000 pts
                    </p>
                  </div>
                </div>
              </div>

              {/* Competencies */}
              <div className="px-5 py-4 space-y-3.5">
                {scores.map(({ label, score, max }, i) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold" style={{ color: 'var(--littera-ink)' }}>
                        {label}
                      </span>
                      <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--littera-forest)' }}>
                        {score}
                        <span style={{ color: 'var(--littera-slate)' }}> / {max}</span>
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: 'var(--littera-mist)' }}
                    >
                      <div
                        className="h-full rounded-full littera-fade-up"
                        style={{
                          width: `${(score / max) * 100}%`,
                          background: score === max
                            ? 'var(--littera-forest)'
                            : score >= 160
                            ? 'var(--littera-moss)'
                            : 'var(--littera-gold)',
                          animationDelay: `${300 + i * 80}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Card footer */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderTop: '1px solid var(--littera-dust)' }}
              >
                <span className="text-xs" style={{ color: 'var(--littera-slate)' }}>
                  Concluída · Análise IA disponível
                </span>
                <span
                  className="littera-badge"
                  style={{
                    background: 'var(--littera-sage-light)',
                    borderColor: 'rgba(63,98,18,0.25)',
                    color: 'var(--littera-sage)',
                  }}
                >
                  Concluída
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10">
        <div className="littera-rule" />
      </div>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="como-funciona" className="max-w-5xl mx-auto px-6 sm:px-10 py-20">
        <div className="text-center mb-14">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--littera-forest)', letterSpacing: '0.12em' }}
          >
            Como funciona
          </p>
          <h2
            className="font-display text-3xl sm:text-4xl font-semibold"
            style={{ color: 'var(--littera-ink)' }}
          >
            Tudo que você precisa em um só lugar
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, num, title, desc }, i) => (
            <div
              key={title}
              className="rounded-xl p-6 transition-shadow hover:shadow-md group"
              style={{
                background: 'var(--littera-paper)',
                border: '1px solid var(--littera-dust)',
                boxShadow: 'var(--littera-shadow-sm)',
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'var(--littera-forest-light)',
                    border: '1px solid rgba(26,77,58,0.15)',
                  }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: 'var(--littera-forest)', width: 18, height: 18 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="font-display text-xs font-semibold"
                      style={{ color: 'var(--littera-slate)' }}
                    >
                      {num}
                    </span>
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: 'var(--littera-ink)' }}
                    >
                      {title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--littera-slate)' }}>
                    {desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--littera-forest)',
          color: '#fff',
        }}
      >
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-16 text-center">
          <h2
            className="font-display text-3xl sm:text-4xl font-semibold mb-4"
            style={{ color: '#fff' }}
          >
            Pronto para começar?
          </h2>
          <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.70)' }}>
            Acesse gratuitamente e corrija a primeira redação hoje.
          </p>
          <Link
            href="/login"
            className="littera-btn px-8 py-3.5 text-base font-semibold inline-flex"
            style={{
              background: '#fff',
              color: 'var(--littera-forest)',
              border: '1.5px solid rgba(255,255,255,0.30)',
              borderRadius: 10,
            }}
          >
            Criar conta gratuita
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <p className="text-xs mt-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Para professores corretores do ENEM
          </p>
        </div>
      </section>
    </div>
  )
}
