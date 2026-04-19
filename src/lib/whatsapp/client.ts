/**
 * WhatsApp client abstraction.
 *
 * Provider selection (checked at runtime from env):
 *   1. Evolution API — if EVOLUTION_API_URL + EVOLUTION_API_KEY are set
 *   2. Z-API         — if ZAPI_INSTANCE_ID + ZAPI_TOKEN are set
 *
 * Both providers expose the same `sendText()` interface so callers
 * are completely decoupled from the underlying transport.
 */

export interface WhatsAppSendResult {
  success: boolean
  provider: 'zapi' | 'evolution'
  messageId?: string
  error?: string
}

/**
 * Validates a Brazilian WhatsApp number.
 * Rules: digits only, starts with 55, 12–13 digits total.
 * Examples: 5511999999999 (mobile) or 551133334444 (landline — rare via WA)
 */
export function validatePhone(phone: string): { valid: boolean; normalized: string; error?: string } {
  const digits = phone.replace(/\D/g, '')

  if (!digits.startsWith('55')) {
    return { valid: false, normalized: digits, error: 'Número deve começar com 55 (código do Brasil).' }
  }

  if (digits.length < 12 || digits.length > 13) {
    return {
      valid: false,
      normalized: digits,
      error: `Número inválido: esperado 12–13 dígitos, recebido ${digits.length}.`,
    }
  }

  return { valid: true, normalized: digits }
}

/**
 * Detects which provider is configured in the environment.
 */
function detectProvider(): 'zapi' | 'evolution' | null {
  if (process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY) return 'evolution'
  if (process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN) return 'zapi'
  return null
}

/**
 * Sends a text message via Z-API.
 * Docs: https://developer.z-api.io/message/send-text
 */
async function sendViaZapi(phone: string, message: string): Promise<WhatsAppSendResult> {
  const instanceId = process.env.ZAPI_INSTANCE_ID!
  const token = process.env.ZAPI_TOKEN!
  const clientToken = process.env.ZAPI_CLIENT_TOKEN

  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (clientToken) headers['Client-Token'] = clientToken

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phone, message }),
  })

  if (!res.ok) {
    const text = await res.text()
    return {
      success: false,
      provider: 'zapi',
      error: `Z-API error ${res.status}: ${text}`,
    }
  }

  const data = await res.json() as { zaapId?: string; messageId?: string }
  return {
    success: true,
    provider: 'zapi',
    messageId: data.zaapId ?? data.messageId,
  }
}

/**
 * Sends a text message via Evolution API (self-hosted).
 * Docs: https://doc.evolution-api.com/send-message/text
 */
async function sendViaEvolution(phone: string, message: string): Promise<WhatsAppSendResult> {
  const baseUrl = process.env.EVOLUTION_API_URL!.replace(/\/$/, '')
  const apiKey = process.env.EVOLUTION_API_KEY!
  const instance = process.env.EVOLUTION_INSTANCE ?? 'littera'

  const url = `${baseUrl}/message/sendText/${instance}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: phone,
      text: message,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return {
      success: false,
      provider: 'evolution',
      error: `Evolution API error ${res.status}: ${text}`,
    }
  }

  const data = await res.json() as { key?: { id?: string } }
  return {
    success: true,
    provider: 'evolution',
    messageId: data.key?.id,
  }
}

/**
 * Sends a WhatsApp text message using whichever provider is configured.
 * Throws if no provider is configured (should be caught by the route handler).
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string,
): Promise<WhatsAppSendResult> {
  const provider = detectProvider()

  if (!provider) {
    return {
      success: false,
      provider: 'zapi',
      error: 'Nenhum provedor WhatsApp configurado. Defina ZAPI_INSTANCE_ID/ZAPI_TOKEN ou EVOLUTION_API_URL/EVOLUTION_API_KEY.',
    }
  }

  if (provider === 'evolution') {
    return sendViaEvolution(phone, message)
  }

  return sendViaZapi(phone, message)
}
