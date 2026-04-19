# External Integrations

**Analysis Date:** 2026-03-28

## APIs & External Services

**AI Analysis:**
- Claude (Anthropic) - Essay analysis and student progress insights
  - SDK: `@anthropic-ai/sdk` 0.80.0
  - Models: `claude-sonnet-4-6`
  - Auth: `ANTHROPIC_API_KEY` env var
  - Implementation: `src/lib/ai/analyze-essay.ts`, `src/lib/ai/analyze-student.ts`
  - Usage:
    - Analyzes individual essays for competency scores (ENEM competencies)
    - Generates student progress analysis across multiple essays
    - Streaming responses for real-time feedback

**Payments:**
- Abacate.pay - Brazilian payment gateway (PIX)
  - API URL: `https://api.abacatepay.com/v1`
  - Auth: `ABACATE_PAY_API_KEY` (Bearer token)
  - Webhook Secret: `ABACATE_PAY_WEBHOOK_SECRET` (HMAC-SHA256 verification)
  - Implementation: `src/app/api/subscription/checkout/route.ts`, `src/app/api/subscription/webhook/route.ts`
  - Endpoints:
    - POST `/api/subscription/checkout` - Create checkout session
    - POST `/api/subscription/webhook` - Webhook receiver
  - Events handled: `billing.paid`, `subscription.completed`, `subscription.renewed`, `subscription.cancelled`, `checkout.refunded`
  - Payment method: PIX (one-time and recurring billing)
  - Currency: BRL (Brazilian Real)

**WhatsApp (Planned - Not Implemented):**
- Multiple options documented but not yet integrated
  - Potential providers: Z-API, Evolution API, Twilio, WhatsApp Business Cloud API
  - Env vars prepared: `ZAPI_TOKEN`, `ZAPI_INSTANCE`, `ZAPI_CLIENT_TOKEN`
  - Implementation stub: `src/app/api/whatsapp/send/route.ts` (returns "coming soon" message)
  - Feature: Send essay analysis results via WhatsApp (Premium plan feature)

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Connection: Via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client) or `SUPABASE_SERVICE_ROLE_KEY` (server)
  - Client libraries: `@supabase/supabase-js` 2.99.3, `@supabase/ssr` 0.9.0
  - Schema migrations: `supabase/migrations/` (001-009)
  - Tables:
    - `profiles` - User profiles (extends auth.users)
    - `students` - Student records linked to teacher
    - `essays` - Essay submissions with scoring
    - `error_markers` - Annotation markers on essays
    - `error_marker_selections` - Detailed annotations
    - `subscription_payments` - Payment transaction history
  - RLS (Row Level Security): Enabled on all user-facing tables
  - Auth trigger: Auto-creates profile on user signup

**File Storage:**
- Local filesystem only
  - Essay PDFs and images stored via `storage_path` in database
  - No cloud storage integration detected
  - Processed via Sharp, pdf-lib, react-pdf

**Caching:**
- TanStack React Query (client-side) - Query caching and synchronization
- No external caching layer (Redis, Memcached) detected

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in)
  - Implementation: `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (server)
  - Flow: OAuth/Magic link via Supabase dashboard (configured externally)
  - Callback: `src/app/(auth)/callback/route.ts` - Exchanges OAuth code for session
  - Middleware: `src/proxy.ts` - Protects routes, redirects unauthenticated users to `/login`
  - Session management: Cookie-based via Supabase SSR helpers

## Monitoring & Observability

**Error Tracking:**
- Sentry 10.46.0
  - Server DSN: `SENTRY_DSN`
  - Client DSN: `NEXT_PUBLIC_SENTRY_DSN`
  - Config: `sentry.server.config.ts`, `sentry.client.config.ts`
  - Sample rate: 10% of transactions for performance monitoring
  - Integration: `src/instrumentation.ts` (Next.js hook), `src/lib/logger.ts` (manual captures)
  - Error forwarding: Custom logger captures exceptions and context

**Logs:**
- Structured JSON logging to stdout/stderr
  - Implementation: `src/lib/logger.ts`
  - Format: `{ ts, level, msg, ...context, error? }`
  - Levels: `info`, `warn`, `error`
  - Consumption: Vercel logs, Datadog, or other log aggregators
  - Key metrics logged:
    - Webhook events (`webhook.received`, `webhook.idempotent_skip`, `webhook.subscription_activated`)
    - Checkout flow (`checkout.created`, `checkout.abacate_error`)
    - AI analysis (`ai.student-analysis.completed`, `ai.student-analysis.failed`)

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from Next.js setup, environment configuration, and `NEXT_PUBLIC_APP_URL` usage)
- Deployment: Git-based (GitHub)

**CI Pipeline:**
- GitHub Actions (configured externally in `.github/` directory)
- ESLint for code quality checks

## Environment Configuration

**Required env vars (Production):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (base domain for payment redirects)
- `ANTHROPIC_API_KEY` (Claude API)
- `ABACATE_PAY_API_KEY` (Payments)
- `ABACATE_PAY_WEBHOOK_SECRET` (Webhook verification)
- `SENTRY_DSN` (Server error tracking)
- `NEXT_PUBLIC_SENTRY_DSN` (Client error tracking)
- `NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED` (Feature flag, boolean)

**Optional env vars:**
- `ZAPI_TOKEN`, `ZAPI_INSTANCE`, `ZAPI_CLIENT_TOKEN` (WhatsApp - not implemented)
- `NODE_ENV` (development/production)

**Secrets location:**
- `.env.local` (development) - NOT committed to git
- Vercel environment variables (production)

## Webhooks & Callbacks

**Incoming:**
- Abacate.pay webhook: `POST /api/subscription/webhook`
  - Signature verification: `X-Webhook-Signature` header (HMAC-SHA256)
  - Events: `billing.paid`, `subscription.completed`, `subscription.renewed`, `subscription.cancelled`, `checkout.refunded`
  - Payload structure: `{ id, event, apiVersion, devMode, data }`
  - Implementation: `src/app/api/subscription/webhook/route.ts` (lines 23-80)

**Outgoing:**
- Abacate.pay API calls: `POST https://api.abacatepay.com/v1/billing/create`
  - Request: Customer data, products, metadata, return URLs
  - Response: Checkout URL and subscription ID
  - Implementation: `src/app/api/subscription/checkout/route.ts` (lines 51-78)
- WhatsApp API (planned, not implemented)
  - Would call: Z-API, Evolution API, Twilio, or WhatsApp Cloud API
  - Endpoint stub: `POST /api/whatsapp/send`

---

*Integration audit: 2026-03-28*
