import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

/**
 * POST /api/essays/[id]/share
 * Enable sharing for an essay. Generates a 1-year signed URL for the document
 * and sets is_shared = true. Returns the public share URL.
 * Available to all subscription tiers.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership and get current essay data
  const { data: essay } = await supabase
    .from('essays')
    .select('id, share_token, storage_path, source_type, is_shared, share_doc_url')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single()

  if (!essay) return NextResponse.json({ error: 'Essay not found' }, { status: 404 })

  const origin = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.littera.com.br').replace(/\/$/, '')

  // If already shared, just return the existing share URL
  if (essay.is_shared && essay.share_doc_url) {
    return NextResponse.json({
      shareToken: essay.share_token,
      shareUrl: `${origin}/c/${essay.share_token}`,
    })
  }

  // Generate a 1-year signed URL for the essay document (if file-based)
  let shareDocUrl: string | null = null
  if (essay.storage_path) {
    // Use service role client to generate a long-lived signed URL
    const service = createServiceClient()
    const { data: signed } = await service.storage
      .from('essays')
      .createSignedUrl(essay.storage_path, 60 * 60 * 24 * 365) // 1 year
    shareDocUrl = signed?.signedUrl ?? null
  }

  // Enable sharing on the essay
  const { error } = await supabase
    .from('essays')
    .update({
      is_shared: true,
      share_doc_url: shareDocUrl,
    })
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    shareToken: essay.share_token,
    shareUrl: `${origin}/c/${essay.share_token}`,
  })
}
