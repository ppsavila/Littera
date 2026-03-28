import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test'

// Helper: log in via the UI and return the authenticated browser context + page.
// Uses the same selectors as auth.spec.ts (see LoginForm.tsx):
//   - Email:    #e-mail  (ClayInput label="E-mail" auto-generates id via label.toLowerCase().replace(/\s+/g,'-'))
//   - Password: input[type="password"]  (PasswordField has no id/name)
//   - Submit:   button[type="submit"]   (text "Entrar" in default password mode)
async function loginAs(
  browser: Browser,
  email: string,
  password: string
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('/login')
  await page.fill('#e-mail', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/essays/, { timeout: 10000 })
  return { context, page }
}

test.describe('Tenant isolation (RLS)', () => {
  // Verifies that Supabase RLS prevents Teacher B from modifying Teacher A's data.
  // Strategy: Teacher A creates an essay via API (using browser session cookies),
  // then Teacher B attempts PATCH and DELETE on that essay ID — both must fail.
  // The API route (essays/[id]/route.ts) adds .eq('teacher_id', user.id) before every
  // mutating query; if the authenticated user is not the owner, Supabase returns 0 rows
  // and the route returns a 400 error.
  test('teacher B cannot access teacher A essay via API', async ({ browser }) => {
    // --- Teacher A logs in ---
    const { context: ctxA } = await loginAs(
      browser,
      process.env.TEST_USER_A_EMAIL!,
      process.env.TEST_USER_A_PASSWORD!
    )

    // Teacher A creates an essay via POST /api/essays
    // context.request inherits the browser session cookies so the request is authenticated
    const createRes = await ctxA.request.post('/api/essays', {
      data: {
        title: `Isolation Test ${Date.now()}`,
        source_type: 'text',
        raw_text: 'Test essay for RLS isolation verification.',
      },
    })
    expect(createRes.ok()).toBe(true)
    const { id: essayId } = await createRes.json()
    expect(typeof essayId).toBe('string')

    // --- Teacher B logs in (separate browser context = separate session) ---
    const { context: ctxB } = await loginAs(
      browser,
      process.env.TEST_USER_B_EMAIL!,
      process.env.TEST_USER_B_PASSWORD!
    )

    // Teacher B tries to PATCH Teacher A's essay
    // essays/[id]/route.ts: .eq('teacher_id', user.id) yields 0 rows -> returns 400
    const patchRes = await ctxB.request.patch(`/api/essays/${essayId}`, {
      data: { title: 'Hijacked by Teacher B' },
    })
    expect(patchRes.status()).not.toBe(200)

    // Teacher B tries to DELETE Teacher A's essay
    // Same RLS guard: .eq('teacher_id', user.id) -> no rows matched -> error path
    const deleteRes = await ctxB.request.delete(`/api/essays/${essayId}`)
    expect(deleteRes.status()).not.toBe(200)

    // Verify the essay still exists (Teacher A can still access it)
    const verifyRes = await ctxA.request.delete(`/api/essays/${essayId}`)
    expect(verifyRes.ok()).toBe(true)

    await ctxA.close()
    await ctxB.close()
  })
})
