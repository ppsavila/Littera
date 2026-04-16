import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { SharedEssayView } from '@/components/essay/SharedEssayView'
import type { Essay } from '@/types/essay'
import type { ErrorMarker } from '@/types/error-marker'

interface Props {
  params: Promise<{ token: string }>
}

/**
 * Public shared essay page — no auth required.
 * URL: /c/<share_token>
 */
export default async function SharedEssayPage({ params }: Props) {
  const { token } = await params

  // Use anon client — RLS policies handle access control
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: essay } = await supabase
    .from('essays')
    .select('*, student:students(name, class_name)')
    .eq('share_token', token)
    .eq('is_shared', true)
    .single()

  if (!essay) notFound()

  const { data: errorMarkers } = await supabase
    .from('error_markers')
    .select('*')
    .eq('essay_id', essay.id)
    .order('page_number', { ascending: true })
    .order('created_at', { ascending: true })

  return (
    <SharedEssayView
      essay={essay as Essay}
      errorMarkers={(errorMarkers ?? []) as ErrorMarker[]}
    />
  )
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: essay } = await supabase
    .from('essays')
    .select('title, theme, score_c1, score_c2, score_c3, score_c4, score_c5')
    .eq('share_token', token)
    .eq('is_shared', true)
    .single()

  if (!essay) return { title: 'Correção não encontrada — Littera' }

  const total = (essay.score_c1 ?? 0) + (essay.score_c2 ?? 0) + (essay.score_c3 ?? 0) + (essay.score_c4 ?? 0) + (essay.score_c5 ?? 0)
  return {
    title: `${essay.title} — Correção (${total}/1000) | Littera`,
    description: essay.theme ? `Tema: ${essay.theme} · Nota: ${total}/1000` : `Nota final: ${total}/1000`,
  }
}
