# Technology Stack

**Analysis Date:** 2026-03-28

## Languages

**Primary:**
- TypeScript 5.x - Full codebase (frontend and backend)
- JSX/TSX - React components in Next.js app directory

**Secondary:**
- SQL - Supabase database migrations in `supabase/migrations/`

## Runtime

**Environment:**
- Node.js 24.14.0 (specified by runtime, may be managed via `.nvmrc` in production)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.2.1 - Full-stack React framework with App Router
  - Server components and route handlers
  - API routes for backend operations
  - Middleware via `src/proxy.ts` for auth and routing

**UI Components:**
- React 19.2.4 - Core UI library
- React DOM 19.2.4 - DOM rendering
- Radix UI (multiple packages v1-2.x):
  - `@radix-ui/react-dialog` - Modal dialogs
  - `@radix-ui/react-dropdown-menu` - Dropdown menus
  - `@radix-ui/react-popover` - Popover components
  - `@radix-ui/react-select` - Select components
  - `@radix-ui/react-slider` - Slider components
  - `@radix-ui/react-tabs` - Tab components
  - `@radix-ui/react-toast` - Toast notifications
  - `@radix-ui/react-tooltip` - Tooltips

**Styling:**
- Tailwind CSS 4.x - Utility-first CSS framework
- `@tailwindcss/postcss` 4.x - Tailwind PostCSS plugin
- PostCSS - CSS processing
- `class-variance-authority` 0.7.1 - Component variant management
- `clsx` 2.1.1 - Conditional className utility
- `tailwind-merge` 3.5.0 - Tailwind class merging

**Animation:**
- Framer Motion 12.38.0 - React animation library

**PDF & Document Processing:**
- `pdf-lib` 1.17.1 - PDF reading/writing
- `pdf-parse` 2.4.5 - PDF text extraction
- `pdfjs-dist` 5.5.207 - PDF rendering engine
- `react-pdf` 10.4.1 - React component for PDF display
- Tesseract.js 7.0.0 - OCR (optical character recognition)

**Canvas & Graphics:**
- Konva 10.2.3 - 2D drawing framework
- React Konva 19.2.3 - React bindings for Konva (annotation canvas)

**Image Processing:**
- Sharp 0.34.5 - Image transformation and optimization

**File Upload:**
- React Dropzone 15.0.0 - Drag-and-drop file upload

**State Management:**
- Zustand 5.0.12 - Lightweight state store

**Server-side Query:**
- TanStack React Query 5.91.2 - Data fetching and caching

**Validation:**
- Zod 4.3.6 - TypeScript-first schema validation

**Development/Linting:**
- ESLint 9.x - JavaScript/TypeScript linting
  - `eslint-config-next` 16.2.0 - Next.js rules and best practices
- TypeScript - Static type checking

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.99.3 - Supabase client SDK for database and auth
- `@supabase/ssr` 0.9.0 - Server-side auth helpers for Next.js

**AI & LLM:**
- `@anthropic-ai/sdk` 0.80.0 - Claude API client for essay and student analysis

**Error Tracking & Monitoring:**
- `@sentry/nextjs` 10.46.0 - Error tracking and performance monitoring

**Infrastructure/Utilities:**
- Node.js built-in `crypto` module - HMAC signature verification for webhooks

## Configuration

**Environment:**
Configuration via environment variables:

**Public (client-side):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `NEXT_PUBLIC_APP_URL` - App domain for payment redirects
- `NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED` - Feature flag for subscriptions
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking DSN

**Secret (server-side):**
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role for server operations
- `ANTHROPIC_API_KEY` - Claude API key
- `SENTRY_DSN` - Sentry error tracking DSN (server)
- `ABACATE_PAY_API_KEY` - Payment gateway API key
- `ABACATE_PAY_WEBHOOK_SECRET` - Webhook signature verification
- `ZAPI_TOKEN`, `ZAPI_INSTANCE`, `ZAPI_CLIENT_TOKEN` - WhatsApp integration (not yet implemented)

**Build:**
- `tsconfig.json` - TypeScript configuration with `@/*` path alias pointing to `src/`
- `next.config.ts` - Next.js config with Turbopack, CSP headers, and security settings
- `eslint.config.mjs` - ESLint config extending Next.js standards
- `postcss.config.mjs` - PostCSS config for Tailwind
- `sentry.server.config.ts` - Server-side Sentry initialization
- `sentry.client.config.ts` - Client-side Sentry initialization
- `src/instrumentation.ts` - Next.js instrumentation hook for Sentry setup

## Platform Requirements

**Development:**
- Node.js 24.14.0
- npm package manager
- Supabase account with PostgreSQL database
- Anthropic API key (Claude access)

**Production:**
- Vercel (inferred from Next.js deployment setup and Sentry/environment configuration)
- Supabase PostgreSQL database
- Anthropic API access
- Abacate.pay payment processor account

---

*Stack analysis: 2026-03-28*
