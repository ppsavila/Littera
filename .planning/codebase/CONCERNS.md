# Codebase Concerns

**Analysis Date:** 2026-03-28

## Tech Debt

**Incomplete WhatsApp Integration:**
- Issue: WhatsApp feature gate is implemented and charging Premium users, but the actual integration is not implemented. The endpoint returns a stub response saying "Em desenvolvimento".
- Files: `src/app/api/whatsapp/send/route.ts` (line 48)
- Impact: Premium users cannot use a feature they're paying for. This is a critical revenue/trust issue.
- Fix approach: Complete the Z-API, Evolution API, Twilio, or WhatsApp Business Cloud API integration. The endpoint has placeholder comments with Z-API example. Choose a provider and implement full send + delivery tracking.

**Unvalidated Request JSON Parsing:**
- Issue: Multiple API routes call `await request.json()` without try-catch, and several do not validate request body structure. This can cause unhandled errors on malformed requests.
- Files:
  - `src/app/api/essays/route.ts` (line 37)
  - `src/app/api/essays/[id]/route.ts` (line 14)
  - `src/app/api/profile/route.ts` (line 9)
  - `src/app/api/whatsapp/send/route.ts` (line 27)
  - `src/app/api/subscription/activate/route.ts` (line 11)
  - `src/app/api/subscription/checkout/route.ts` (line 16)
  - `src/app/api/ai/student-analysis/route.ts` (line 28)
- Impact: 500 errors on invalid JSON payloads instead of 400. Poor API resilience.
- Fix approach: Wrap all `request.json()` calls in try-catch blocks or use a request validation middleware. Use Zod schemas for request body validation.

**Silent Error Swallowing in Error Handling:**
- Issue: Some catch blocks silently ignore errors without logging or alternative handling.
- Files:
  - `src/lib/ai/analyze-essay.ts` (line 89): `catch` block ignores JSON parse failures on stream completion
  - `src/components/essay/UploadWizard.tsx` (line 152): `essayRes.json().catch(() => ({}))`
  - `src/components/scoring/ScoringPanel.tsx` (line 89): `JSON.parse(body).error ?? msg` nested try-catch silently fails
  - `src/app/api/subscription/checkout/route.ts` (line 81): `response.json().catch(() => ({}))`
  - `src/app/api/subscription/cancel/route.ts` (line 52): `res.json().catch(() => ({}))`
- Impact: Errors are hidden, making debugging difficult. Users may think operations succeeded when they fail silently.
- Fix approach: Log all caught errors with context. Provide meaningful fallback messages to users. Use structured logging for unexpected errors.

**Duplicate CPF Validation Logic:**
- Issue: CPF validation algorithm is duplicated in two places with subtle differences.
- Files:
  - `src/app/api/subscription/checkout/route.ts` (lines 130-144): Full validation function
  - `src/app/(dashboard)/pricing/PricingClient.tsx` (lines 76-88): Identical logic on client side
- Impact: Maintenance burden. Changes to validation logic must be kept in sync. Client-side validation is easily bypassed.
- Fix approach: Extract shared validation to a single `lib/validation/cpf.ts` module. Use only server-side validation for authoritative checks.

**Race Condition in Daily Correction Limit Reset:**
- Issue: The daily correction limit reset logic has a race condition. When a new day is detected, it resets the counter to 0, then immediately increments it to 1 in two separate database updates.
- Files: `src/lib/subscriptions/access.ts` (lines 48-58)
- Impact: If two requests arrive simultaneously on a new day, both may see the reset date as outdated and both perform the reset, causing inconsistent state.
- Fix approach: Use a database transaction or a single atomic update: `SET daily_corrections_count = 1, daily_corrections_reset_date = ? WHERE daily_corrections_reset_date != ?`

**Missing Error Handling in Subscription Webhook Idempotency:**
- Issue: The webhook endpoint checks for duplicate payment IDs to ensure idempotency, but the count operation on line 142 is unreliable for detecting whether an update occurred (Supabase doesn't expose `rowCount`).
- Files: `src/app/api/subscription/webhook/route.ts` (lines 131-143)
- Impact: Duplicate payments could result in duplicate subscription payment records if idempotency detection fails.
- Fix approach: After attempting the update, query the database to verify the payment_id exists. If not, then insert.

**Unhandled Promise.all Rejection in Activate Endpoint:**
- Issue: The `Promise.all()` on line 33 in the activate endpoint has no error handling.
- Files: `src/app/api/subscription/activate/route.ts` (lines 33-36)
- Impact: If either database update fails, the user receives a 500 error without details. No rollback or partial failure handling.
- Fix approach: Wrap Promise.all in try-catch and provide appropriate error responses. Consider transaction-based updates.

## Security Considerations

**CPF Exposed in Metadata:**
- Risk: CPF (Brazilian tax ID) is stored in Abacate.pay metadata and webhook data without encryption. While payment processor metadata is expected to contain PII, ensure HIPAA/LGPD compliance.
- Files:
  - `src/app/api/subscription/checkout/route.ts` (line 72)
  - `src/app/api/subscription/webhook/route.ts` (line 41, data exposure)
- Current mitigation: Validation is performed on server-side; no plaintext storage locally.
- Recommendations: Verify that Abacate.pay complies with Brazilian data protection law (LGPD). Log CPF interactions for audit trails.

**File Extension Determined by MIME Type Only:**
- Risk: File extensions in storage are determined by MIME type, not filename. While this prevents directory traversal, it may hide file type spoofing attacks.
- Files: `src/components/essay/UploadWizard.tsx` (line 119)
- Current mitigation: `maxSize: 20 * 1024 * 1024` enforces a file size limit. Dropzone validates MIME type.
- Recommendations: Validate file magic bytes/headers after upload to detect spoofed files. Run virus scanning on uploads if processing user-submitted content.

**No CSRF Protection on API Endpoints:**
- Risk: API endpoints like `/api/essays`, `/api/profile`, `/api/subscription/checkout` accept POST/PATCH from any origin without explicit CSRF tokens.
- Files: All API route files in `src/app/api/`
- Current mitigation: Auth is checked via session (Supabase Auth), which is httpOnly cookie-based.
- Recommendations: Verify Next.js middleware or Supabase Auth handles CSRF for cookie-based sessions. Explicitly test cross-origin requests.

**No Rate Limiting on Most Endpoints:**
- Risk: Only `/api/essays/[id]/analyze` has rate limiting. Other endpoints like `/api/subscription/checkout` can be hammered.
- Files: Most API routes lack rate limiting
- Current mitigation: Database constraints and Supabase row-level security may provide some protection.
- Recommendations: Implement global rate limiting middleware based on user IP or authenticated user ID. Use Redis or Supabase's rate limit functions.

## Known Bugs

**AI Analysis Parse Fallback Mask Failures:**
- Symptoms: When Claude's response is partially malformed JSON, the fallback regex `\{[\s\S]*\}` may extract invalid JSON if there are unmatched braces.
- Files: `src/lib/ai/analyze-essay.ts` (lines 14-16)
- Trigger: AI returns response like `Some text {valid: "json" ... extra text } more text`
- Workaround: The error is caught and logged; user sees "Erro ao processar análise da IA" message.
- Fix: Use a JSON parser that reports the last valid object boundary, or request Claude to always wrap output in a specific marker.

**Daily Correction Limit Bug on Same-Day Resets:**
- Symptoms: On the day the reset date changes, a race condition allows off-by-one errors in usage counting.
- Files: `src/lib/subscriptions/access.ts` (lines 48-58)
- Trigger: Two simultaneous requests on a new calendar day trigger double-reset logic.
- Workaround: Unlikely to occur in practice due to typical request patterns, but possible.

## Performance Bottlenecks

**Large Component Files:**
- Problem: Several components exceed 400 lines, making them harder to maintain and potentially slower to parse.
- Files:
  - `src/app/(dashboard)/pricing/PricingClient.tsx` (533 lines)
  - `src/components/annotation/AnnotationCanvas.tsx` (418 lines)
  - `src/components/essay/UploadWizard.tsx` (408 lines)
  - `src/components/essay/ExportPDFButton.tsx` (401 lines)
  - `src/components/auth/LoginForm.tsx` (389 lines)
  - `src/app/(dashboard)/essays/page.tsx` (341 lines)
- Cause: Feature-rich components with inline styles and state management.
- Improvement path: Extract sub-components (e.g., PricingCard, PricingFeatureTable into separate files). Use composition over monolithic components.

**AI Analysis Streaming Without Incremental JSON Validation:**
- Problem: The analyze stream handler buffers event lines but doesn't validate JSON incrementally, risking memory bloat on very long responses.
- Files: `src/components/scoring/ScoringPanel.tsx` (lines 93-124)
- Cause: Full text accumulation in `fullText` variable before parsing on stream completion.
- Improvement path: Parse and yield events incrementally. Set a max buffer size to prevent OOM on pathological responses.

**No Pagination Depth Limit on Essays Query:**
- Problem: The essays page loads all essays into memory to compute pagination stats, then slices them.
- Files: `src/app/(dashboard)/essays/page.tsx` (lines 38-64)
- Cause: The query fetches all matching essays, filters client-side, then computes `totalPages`.
- Improvement path: Use Supabase's count API (`count: 'exact'`) to get total without fetching all rows. Implement cursor-based or offset pagination with a page size limit.

## Fragile Areas

**Essay Storage Deletion Without Verify:**
- Files: `src/app/api/essays/[id]/route.ts` (lines 63-65)
- Why fragile: DELETE endpoint removes the essay file from storage without verifying the operation succeeded, then deletes the database record. If storage deletion fails silently, orphaned files accumulate.
- Safe modification: Check the response from `storage.remove()` and log failures. Consider soft-delete (mark as deleted in DB) instead of hard delete.
- Test coverage: No tests covering the storage deletion path.

**Webhook Idempotency Relies on Database Count:**
- Files: `src/app/api/subscription/webhook/route.ts` (line 142)
- Why fragile: The code assumes `count` property indicates whether the update succeeded, but Supabase doesn't return count on update operations. This makes duplicate detection unreliable.
- Safe modification: Query after update to verify the change was applied: `SELECT id FROM subscription_payments WHERE payment_id = ? AND status = 'paid'`.
- Test coverage: Webhook idempotency is not tested.

**Concurrent UploadWizard Student Creation:**
- Files: `src/components/essay/UploadWizard.tsx` (lines 89-109)
- Why fragile: Student creation uses `maybeSingle()` to find existing student, but a race condition can occur if two simultaneous submissions create the same student twice.
- Safe modification: Add a unique constraint on `(teacher_id, name)` in the database and use `ON CONFLICT DO UPDATE` or `INSERT ... ON CONFLICT`.
- Test coverage: No concurrent submission tests.

**AI Analysis Saves Scores Before Parsing Completes:**
- Files: `src/app/api/essays/[id]/analyze/route.ts` (lines 105-110)
- Why fragile: The code saves AI-suggested scores to the essay record, but if the parsing fails after stream ends, the scores are still saved as if they were confirmed by the teacher.
- Safe modification: Save analysis as `ai_analysis` JSON blob without overwriting the score fields. Only update score fields on explicit teacher confirmation.
- Test coverage: No tests for failure scenarios during stream.

## Scaling Limits

**No Pagination on Student List:**
- Current capacity: Loads all students into memory on `/dashboard/students` page.
- Limit: Breaks at ~1000+ students per teacher (depends on browser memory).
- Scaling path: Implement infinite scroll or pagination. Add server-side filtering and search. Use React Query for caching.

**Analyzing Multiple Essays Simultaneously:**
- Current capacity: One analyze request per essay, but no queue or concurrency limit.
- Limit: If many users submit analyses simultaneously, Anthropic API rate limits will be hit.
- Scaling path: Implement a job queue (Bull, Temporal, or Supabase's `pg_cron`). Add per-user and global rate limits. Monitor API usage and cache common analyses.

**File Storage Growth Unbounded:**
- Current capacity: All uploaded essays stored in Supabase Storage with no lifecycle policy.
- Limit: Storage bills grow linearly with uploads; no cleanup for deleted essays.
- Scaling path: Set up Supabase bucket lifecycle rules to delete orphaned files after 30 days. Implement soft-delete in essays table with scheduled cleanup jobs.

## Dependencies at Risk

**Tesseract.js Performance Concerns:**
- Risk: Tesseract.js (OCR) is large (~8 MB) and runs client-side synchronously, blocking the UI during image processing.
- Files: `package.json` lists `tesseract.js: ^7.0.0`; imported in `src/components/essay/*`
- Impact: Large pages with image uploads will have poor performance on slow devices.
- Migration plan: Consider server-side OCR (Python Tesseract, AWS Textract) or lazy-load Tesseract.js only when needed. Cache OCR results.

**Sharp for Image Processing:**
- Risk: Sharp is a native module that must be compiled for the server runtime. It can cause deployment issues if not installed correctly.
- Files: `package.json` lists `sharp: ^0.34.5`
- Impact: Next.js builds may fail in certain deployment environments.
- Migration plan: Ensure `sharp` is listed in `optionalDependencies`. Test builds in target deployment environment (Vercel, AWS, etc.). Document build requirements.

**React Query Not Used Consistently:**
- Risk: `@tanstack/react-query` is in dependencies but patterns suggest some components use raw fetch + useState instead of React Query.
- Files: `package.json` lists `@tanstack/react-query: ^5.91.2`; not all data-fetching components use it
- Impact: Missed benefits: caching, deduplication, automatic refetching on window focus.
- Migration plan: Adopt React Query for all server-side data fetching. Create custom hooks for common queries (essays, students, profile).

## Test Coverage Gaps

**No Tests for Critical Payment Flows:**
- What's not tested: Subscription activation, cancellation, webhook handling, subscription expiration logic.
- Files:
  - `src/app/api/subscription/activate/route.ts`
  - `src/app/api/subscription/cancel/route.ts`
  - `src/app/api/subscription/webhook/route.ts`
  - `src/lib/subscriptions/access.ts`
- Risk: Payment system bugs could go unnoticed. Subscriptions could fail to activate or not cancel properly, causing billing disputes.
- Priority: **High** — revenue-critical paths must have test coverage.

**No Tests for AI Analysis Error Handling:**
- What's not tested: Malformed API responses, timeout scenarios, JSON parse failures.
- Files:
  - `src/lib/ai/analyze-essay.ts`
  - `src/app/api/essays/[id]/analyze/route.ts`
  - `src/components/scoring/ScoringPanel.tsx`
- Risk: Unexpected AI responses could crash the UI or corrupt essay data.
- Priority: **High** — affects core product experience.

**No Tests for Storage Operations:**
- What's not tested: File upload success/failure, storage deletion, orphaned file cleanup.
- Files:
  - `src/components/essay/UploadWizard.tsx`
  - `src/app/api/essays/[id]/route.ts` (DELETE endpoint)
- Risk: Files could be uploaded but essays deleted without cleanup, or vice versa.
- Priority: **Medium** — impacts data integrity over time.

**No Tests for Rate Limiting:**
- What's not tested: Daily correction limit enforcement, per-user rate limits.
- Files:
  - `src/lib/subscriptions/access.ts` (checkAndIncrementDailyLimit)
  - `src/app/api/essays/[id]/analyze/route.ts` (checkRateLimit)
- Risk: Rate limits could be bypassed or enforced inconsistently.
- Priority: **Medium** — affects fairness and prevents abuse.

**No Webhook Idempotency Tests:**
- What's not tested: Duplicate webhook events, out-of-order events, missing events.
- Files: `src/app/api/subscription/webhook/route.ts`
- Risk: Duplicate charges or missed subscription activations.
- Priority: **High** — critical for payment integrity.

---

*Concerns audit: 2026-03-28*
