import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { canUseFeature } from '@/lib/subscriptions/access'

/**
 * POST /api/whatsapp/send
 * Premium feature: send essay result to a WhatsApp number.
 *
 * Body: { essayId: string, phone: string, message?: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await canUseFeature(user.id, 'whatsapp'))) {
    return NextResponse.json(
      {
        error: 'Envio por WhatsApp está disponível apenas no plano Premium.',
        code: 'FEATURE_REQUIRES_PREMIUM',
        upgrade: 'premium',
      },
      { status: 403 }
    )
  }

  const { essayId, phone, message } = await request.json()
  if (!essayId) return NextResponse.json({ error: 'essayId is required' }, { status: 400 })
  if (!phone) return NextResponse.json({ error: 'phone is required' }, { status: 400 })

  const { data: essay } = await supabase
    .from('essays')
    .select('title, student_id, total_score, status')
    .eq('id', essayId)
    .eq('teacher_id', user.id)
    .single()

  if (!essay) return NextResponse.json({ error: 'Essay not found' }, { status: 404 })

  // Sanitize phone: digits only, add Brazil prefix if needed
  const sanitizedPhone = phone.replace(/\D/g, '')
  if (sanitizedPhone.length < 10) {
    return NextResponse.json({ error: 'Número de telefone inválido' }, { status: 400 })
  }

  const whatsappNumber = sanitizedPhone.startsWith('55') ? sanitizedPhone : `55${sanitizedPhone}`

  // TODO: Implement WhatsApp API integration
  // Options: Z-API, Evolution API, Twilio, or WhatsApp Business Cloud API
  //
  // Example with Z-API:
  // const response = await fetch(`https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE}/token/${process.env.ZAPI_TOKEN}/send-text`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', 'Client-Token': process.env.ZAPI_CLIENT_TOKEN! },
  //   body: JSON.stringify({ phone: whatsappNumber, message: message ?? buildDefaultMessage(essay) }),
  // })

  return NextResponse.json({
    success: false,
    message: 'Integração com WhatsApp em desenvolvimento — disponível em breve!',
    phone: whatsappNumber,
    essayTitle: essay.title,
  })
}

function buildDefaultMessage(essay: { title: string; total_score: number | null }): string {
  return `📝 *${essay.title}*\n\nNota final: *${essay.total_score ?? 'N/A'}/1000*\n\n_Enviado pelo Litterando_`
}
