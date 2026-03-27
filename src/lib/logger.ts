/**
 * Structured logger for server-side use.
 *
 * Outputs JSON to stdout/stderr so log aggregators (Vercel, Datadog, etc.)
 * can parse fields automatically. Also forwards errors to Sentry when configured.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info('checkout.started', { userId, plan })
 *   logger.error('webhook.failed', error, { event, paymentId })
 */

type LogLevel = 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

function write(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...context,
  }

  if (error instanceof Error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }
  } else if (error !== undefined) {
    entry.error = String(error)
  }

  const line = JSON.stringify(entry)
  if (level === 'error') {
    console.error(line)
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.log(line)
  }
}

export const logger = {
  info(message: string, context?: LogContext) {
    write('info', message, context)
  },

  warn(message: string, context?: LogContext) {
    write('warn', message, context)
  },

  error(message: string, error?: unknown, context?: LogContext) {
    write('error', message, context, error)

    // Forward to Sentry if available (imported lazily to avoid edge-runtime issues)
    if (typeof process !== 'undefined' && process.env.SENTRY_DSN) {
      import('@sentry/nextjs').then(({ captureException, withScope }) => {
        if (error instanceof Error) {
          withScope((scope) => {
            if (context) scope.setExtras(context)
            scope.setTag('logger.message', message)
            captureException(error)
          })
        }
      }).catch(() => { /* Sentry unavailable — already logged to console */ })
    }
  },
}
