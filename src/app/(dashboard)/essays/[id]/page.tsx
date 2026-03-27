import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CorrectionWorkspace } from '@/components/essay/CorrectionWorkspace'
import { canUseFeature } from '@/lib/subscriptions/access'
import type { Essay } from '@/types/essay'
import type { ErrorMarker } from '@/types/error-marker'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EssayPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: essay } = await supabase
    .from('essays')
    .select('*, student:students(name, class_name)')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single()

  if (!essay) notFound()

  const [annotationsResult, errorMarkersResult, canWhatsApp] = await Promise.all([
    supabase
      .from('annotations')
      .select('*')
      .eq('essay_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('error_markers')
      .select('*')
      .eq('essay_id', id)
      .order('created_at', { ascending: true })
      .then((r) => r), // errors handled gracefully below
    canUseFeature(user.id, 'whatsapp'),
  ])

  return (
    <CorrectionWorkspace
      essay={essay as Essay}
      initialAnnotations={annotationsResult.data ?? []}
      initialErrorMarkers={(errorMarkersResult.error ? [] : errorMarkersResult.data ?? []) as ErrorMarker[]}
      canWhatsApp={canWhatsApp}
    />
  )
}
