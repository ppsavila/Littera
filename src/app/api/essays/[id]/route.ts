import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseJsonBody, EssayUpdateSchema } from '@/lib/validation/schemas'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = await parseJsonBody(request)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const result = EssayUpdateSchema.safeParse(parsed.data)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const sanitized = result.data

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
