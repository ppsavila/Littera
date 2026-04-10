import type { Metadata } from 'next'
import { Montserrat, Open_Sans, Pacifico } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/Providers'

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

const pacifico = Pacifico({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-brand',
  weight: ['400'],
})

export const metadata: Metadata = {
  title: 'Litterando — Correção de Redações do ENEM',
  description: 'Plataforma inteligente para correção de redações do ENEM com análise por IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      className={`h-full ${montserrat.variable} ${openSans.variable} ${pacifico.variable}`}
    >
      <body
        className={`${openSans.className} h-full`}
        style={{ background: 'var(--littera-parchment)', color: 'var(--littera-ink)' }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
