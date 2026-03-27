export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }
}

export const onRequestError = async (
  ...args: Parameters<typeof import('@sentry/nextjs').captureRequestError>
) => {
  if (process.env.SENTRY_DSN) {
    const { captureRequestError } = await import('@sentry/nextjs')
    captureRequestError(...args)
  }
}
