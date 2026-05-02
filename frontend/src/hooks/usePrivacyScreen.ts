import { useEffect, useState } from 'react'

/**
 * Returns true when the app is backgrounded (tab hidden / app switcher).
 * Used to overlay a privacy screen so iOS doesn't snapshot sensitive data.
 */
export function usePrivacyScreen() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const handler = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return hidden
}
