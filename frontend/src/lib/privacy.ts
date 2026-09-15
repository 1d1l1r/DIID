import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { usePinStore } from '../features/pin/pinStore'
import { checkAccountChanged } from '../features/auth/authStore'

let concealed = false
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export const useConcealed = () => useSyncExternalStore(subscribe, () => concealed)

/** DOM shield is synchronous; React then unmounts vault pages and their portals.
 * This improves snapshot privacy, but the OS can capture before web events fire.
 */
export function installPrivacyLifecycle() {
  const isDesktop = '__TAURI_INTERNALS__' in window
  const conceal = () => {
    document.documentElement.dataset.private = 'true'
    flushSync(() => {
      concealed = true
      const pin = usePinStore.getState()
      if (!isDesktop && pin.pinHash) pin.lock()
      listeners.forEach(listener => listener())
    })
  }
  const reveal = () => {
    if (document.hidden) return
    flushSync(() => {
      checkAccountChanged()
      concealed = false
      listeners.forEach(listener => listener())
    })
    delete document.documentElement.dataset.private
  }
  const visibility = () => document.hidden ? conceal() : reveal()
  const pageShow = (event: PageTransitionEvent) => {
    if (event.persisted) conceal()
    reveal()
  }
  document.addEventListener('visibilitychange', visibility)
  window.addEventListener('pagehide', conceal)
  window.addEventListener('pageshow', pageShow)
  // Mobile Safari can send blur before visibilitychange during the home gesture.
  // Desktop web also locks on focus loss; Tauri retains its tray-only PIN policy.
  if (!isDesktop) window.addEventListener('blur', conceal)
  window.addEventListener('focus', reveal)
  if (document.hidden) conceal()
  return () => {
    document.removeEventListener('visibilitychange', visibility)
    window.removeEventListener('pagehide', conceal)
    window.removeEventListener('pageshow', pageShow)
    window.removeEventListener('blur', conceal)
    window.removeEventListener('focus', reveal)
  }
}
