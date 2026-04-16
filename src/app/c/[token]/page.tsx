import { createServiceClient } from '@/lib/supabase/service'
import { SharedEssayView } from '@/components/essay/SharedEssayView'
import type { Essay } from '@/types/essay'
import type { ErrorMarker } from '@/types/error-marker'

interface Props {
  params: Promise<{ token: string }>
}

/**
 * Public shared essay page — no auth required.
 * URL: /c/<share_token>
 *
 * Uses the service role client (bypasses RLS) and enforces access control
 * manually via is_shared = true. Only essays explicitly shared by their
 * owner are visible — no login needed.
 */
export default async function SharedEssayPage({ params }: Props) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: essay, error } = await supabase
    .from('essays')
    .select('*, student:students(name, class_name)')
    .eq('share_token', token)
    .eq('is_shared', true)
    .single()

  // Show a clear "not found" UI instead of a generic 404 — easier to debug
  if (!essay) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--littera-parchment, #faf9f5)' }}
      >
        <div className="text-center max-w-sm px-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#fee2e2' }}
          >
            <span style={{ fontSize: 24 }}>📄</span>
          </div>
          <h1
            className="text-lg font-bold mb-2"
            style={{ color: '#111827' }}
          >
            Correção não encontrada
          </h1>
          <p className="text-sm" style={{ color: '#6b7280', lineHeight: 1.6 }}>
            Este link pode ter expirado ou a correção não foi compartilhada publicamente.
            Peça ao professor para compartilhar novamente.
          </p>
          {process.env.NODE_ENV === 'development' && error && (
            <pre className="mt-4 text-xs text-left bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          )}
        </div>
      </div>
    )
  }

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
  const supabase = createServiceClient()

  const { data: essay } = await supabase
    .from('essays')
    .select('title, theme, score_c1, score_c2, score_c3, score_c4, score_c5')
    .eq('share_token', token)
    .eq('is_shared', true)
    .single()

  if (!essay) return { title: 'Correção não encontrada — Littera' }

  const total = (essay.score_c1 ?? 0) + (essay.score_c2 ?? 0) + (essay.score_c3 ?? 0) +
                (essay.score_c4 ?? 0) + (essay.score_c5 ?? 0)
  return {
    title: `${essay.title} — Correção (${total}/1000) | Littera`,
    description: essay.theme
      ? `Tema: ${essay.theme} · Nota: ${total}/1000`
      : `Nota final: ${total}/1000`,
  }
}
