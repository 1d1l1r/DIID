import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { PinLockScreen } from '../pin/PinLockScreen'
import { DecoyApp } from '../decoy/DecoyApp'
import { AboutModal } from './AboutModal'
import { settingsApi } from '../../lib/api/settings'
import { useVisibilityStore } from '../../features/visibility/visibilityStore'
import { usePinStore } from '../../features/pin/pinStore'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export function AppLayout() {
  const { setConfig } = useVisibilityStore()
  const { pinHash, lock, isDecoy } = usePinStore()
  const [showAbout, setShowAbout] = useState(false)
  const pinHashRef = useRef(pinHash)

  useEffect(() => { pinHashRef.current = pinHash }, [pinHash])

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (settings) setConfig(settings.visibility)
  }, [settings, setConfig])

  // In web: lock when browser tab becomes hidden (e.g. Alt+Tab away).
  // In Tauri: handled by the app-hidden event below — visibilitychange fires
  // for minimize too, so we skip it here to avoid locking on minimize.
  useEffect(() => {
    if (isTauri) return
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && pinHash) {
        lock()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [pinHash, lock])

  // Tauri-only: listen for tray events emitted from Rust
  useEffect(() => {
    if (!isTauri) return
    const cleanup: Array<() => void> = []
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen('tray-about', () => setShowAbout(true)).then(fn => cleanup.push(fn))
      listen('app-hidden', () => {
        if (pinHashRef.current) usePinStore.getState().lock()
      }).then(fn => cleanup.push(fn))
    })
    return () => cleanup.forEach(fn => fn())
  }, [])

  // Decoy mode — show only the notes screen
  if (isDecoy) return <DecoyApp />

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-zinc-900 border-r border-zinc-800 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-zinc-900 border-t border-zinc-800 z-40">
        <MobileNav />
      </nav>

      {/* PIN lock overlay — above everything */}
      <PinLockScreen />

      {/* About dialog — triggered from tray menu */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  )
}
