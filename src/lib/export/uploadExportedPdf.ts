import { createClient } from '@/lib/supabase/client'

/**
 * Upload a generated PDF to Supabase Storage and return a 7-day signed URL.
 * Path: `<userId>/exports/<essayId>-<timestamp>.pdf` — satisfies the existing
 * "Teachers upload own essays" RLS policy which checks (storage.foldername(name))[1] = auth.uid().
 */
export async function uploadExportedPdf(
  essayId: string,
  pdfBytes: Uint8Array,
): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const path = `${user.id}/exports/${essayId}-${Date.now()}.pdf`

  const { error } = await supabase.storage
    .from('essays')
    .upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true })

  if (error) {
    console.error('PDF upload failed:', error.message)
    return null
  }

  const { data } = await supabase.storage
    .from('essays')
    .createSignedUrl(path, 60 * 60 * 24 * 7) // 7 days

  return data?.signedUrl ?? null
}
