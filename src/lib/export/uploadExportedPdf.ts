import { createClient } from '@/lib/supabase/client'

/**
 * Upload a generated PDF to Supabase Storage and return a 7-day signed URL.
 * Files are stored under the `exports/` prefix in the `essays` bucket.
 */
export async function uploadExportedPdf(
  essayId: string,
  pdfBytes: Uint8Array,
): Promise<string | null> {
  const supabase = createClient()
  const path = `exports/${essayId}-${Date.now()}.pdf`

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
