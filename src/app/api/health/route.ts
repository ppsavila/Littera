import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

/**
 * GET /api/health
 *
 * Returns 200 if all services are reachable, 503 if degraded.
 * Used by UptimeRobot, Vercel health checks, and CI smoke tests.
 */
export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {}
  let healthy = true

  // 1. Required environment variables
  const requiredEnv = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
  ]
  const missingEnv = requiredEnv.filter((k) => !process.env[k])
  checks.env = missingEnv.length === 0 ? 'ok' : 'error'
  if (missingEnv.length > 0) healthy = false

  // 2. Supabase connectivity (lightweight ping via count query)
  try {
    const supabase = createServiceClient()
    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    checks.supabase = error ? 'error' : 'ok'
    if (error) healthy = false
  } catch {
    checks.supabase = 'error'
    healthy = false
  }

  // 3. Payment gateway configured (optional — not a hard failure)
  checks.payments = process.env.ABACATE_PAY_API_KEY ? 'ok' : 'error'

  const status = healthy ? 200 : 503
  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      checks,
      ts: new Date().toISOString(),
    },
    { status }
  )
}
