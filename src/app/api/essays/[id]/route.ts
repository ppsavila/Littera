import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Whitelist allowed fields to prevent mass assignment
  const ALLOWED_FIELDS = [
    'title', 'theme', 'status', 'raw_text',
    'score_c1', 'score_c2', 'score_c3', 'score_c4', 'score_c5',
    'notes_c1', 'notes_c2', 'notes_c3', 'notes_c4', 'notes_c5',
    'general_comment', 'ai_analysis',
  ] as const

  const sanitized: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) sanitized[key] = body[key]
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('essays')
    .update(sanitized)
    .eq('id', id)
    .eq('teacher_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get essay to delete storage file
  const { data: essay } = await supabase
    .from('essays')
    .select('storage_path')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single()

  if (essay?.storage_path) {
    await supabase.storage.from('essays').remove([essay.storage_path])
  }

  const { error } = await supabase
    .from('essays')
    .delete()
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
