/**
 * Feature flag: when false, everyone is treated as unlimited free (launch/testing mode).
 * When true, the tier system is enforced.
 *
 * Toggle via NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED env var.
 */
export function isSubscriptionsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED === 'true'
}
