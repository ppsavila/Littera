import { test, expect, type Page } from '@playwright/test'

// Helper: fill and submit the login form
// LoginForm.tsx selectors:
//   - Email: ClayInput label="E-mail" -> id="e-mail" (generated via label.toLowerCase().replace(/\s+/g, '-'))
//   - Password: PasswordField renders <input type="password"> (no id/name)
//   - Submit: <button type="submit"> with text "Entrar" in password mode
async function performLogin(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('#e-mail', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
}

test.describe('Authentication flows', () => {
  test('unauthenticated user is redirected from /essays to /login', async ({ page }) => {
    await page.goto('/essays')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated user is redirected from any protected route to /login', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login/)
  })

  test('user can log in with valid credentials', async ({ page }) => {
    await performLogin(page, process.env.TEST_USER_A_EMAIL!, process.env.TEST_USER_A_PASSWORD!)
    // After successful login LoginForm calls router.push('/essays')
    await expect(page).toHaveURL(/\/essays/, { timeout: 10000 })
  })

  test('logged-in user can log out', async ({ page }) => {
    await performLogin(page, process.env.TEST_USER_A_EMAIL!, process.env.TEST_USER_A_PASSWORD!)
    await expect(page).toHaveURL(/\/essays/, { timeout: 10000 })

    // Header.tsx: button with text "Sair" calls supabase.auth.signOut() -> router.push('/login')
    await page.click('button:has-text("Sair")')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('session persists — /essays remains accessible after login', async ({ page }) => {
    await performLogin(page, process.env.TEST_USER_A_EMAIL!, process.env.TEST_USER_A_PASSWORD!)
    await expect(page).toHaveURL(/\/essays/, { timeout: 10000 })

    // Navigate away and back — proxy must not redirect authenticated user to /login
    await page.goto('/essays')
    await expect(page).toHaveURL(/\/essays/)
    await expect(page).not.toHaveURL(/\/login/)
  })
})
