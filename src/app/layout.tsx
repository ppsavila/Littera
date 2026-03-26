import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/Providers'

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
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
      className={`h-full ${playfairDisplay.variable} ${dmSans.variable}`}
    >
      <body
        className={`${dmSans.className} h-full`}
        style={{ background: 'var(--littera-parchment)', color: 'var(--littera-ink)' }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
