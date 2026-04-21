/**
 * Feature flag: when false, all email-dependent UI is hidden (magic link, email confirmation screens).
 * Toggle via NEXT_PUBLIC_EMAIL_FEATURES_ENABLED env var.
 */
export function isEmailFeaturesEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EMAIL_FEATURES_ENABLED === 'true'
}
