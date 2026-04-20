import { useEffect, useRef } from 'react'

/**
 * Debounced auto-save. Calls `onSave` after `delayMs` of inactivity whenever
 * `isDirty` is true. Always invokes the latest version of `onSave` (ref pattern),
 * so callers don't need to stabilize the callback.
 *
 * Returns `cancelPending` — call it before a manual save to prevent the
 * auto-save from firing immediately after.
 */
export function useAutoSave({
  isDirty,
  deps,
  delayMs,
  onSave,
}: {
  isDirty: boolean
  deps: unknown[]
  delayMs: number
  onSave: () => Promise<void>
}): { cancelPending: () => void } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave

  useEffect(() => {
    if (!isDirty) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { onSaveRef.current() }, delayMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // deps is intentionally spread — callers control what triggers a save
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, delayMs, ...deps])

  return {
    cancelPending: () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
  }
}
