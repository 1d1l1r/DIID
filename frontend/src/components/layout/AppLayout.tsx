import { useEffect, useState } from 'react'
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

import { useConcealed } from '../../lib/privacy'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export function AppLayout() {
  const { setConfig } = useVisibilityStore()
  const { pinHash, isLocked, isDecoy } = usePinStore()
  const concealed = useConcealed()
  const [showAbout, setShowAbout] = useState(false)

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (settings) setConfig(settings.visibility)
  }, [settings, setConfig])

  // Tauri-only: listen for tray events emitted from Rust
  useEffect(() => {
    if (!isTauri) return
    const cleanup: Array<() => void> = []
    let disposed = false
    const remember = (fn: () => void) => disposed ? fn() : cleanup.push(fn)
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen('tray-about', () => setShowAbout(true)).then(remember)
      listen('app-hidden', () => {
        if (usePinStore.getState().pinHash) usePinStore.getState().lock()
      }).then(remember)
    })
    return () => { disposed = true; cleanup.forEach(fn => fn()) }
  }, [])

  // Remove the vault tree, including body portals, while locked/backgrounded.
  if (pinHash && isLocked) return <PinLockScreen />
  if (concealed) return null

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

      {/* About dialog — triggered from tray menu */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  )
}
