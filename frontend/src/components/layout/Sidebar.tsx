import { NavLink } from 'react-router-dom'
import { Users, FileText, CreditCard, KeyRound, Settings, Shield, Lock } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useT, useLangStore } from '../../lib/i18n'
import { usePinStore } from '../../features/pin/pinStore'

export function Sidebar() {
  const t = useT()
  const { lang, setLang } = useLangStore()
  const { pinHash, lock } = usePinStore()

  const NAV = [
    { to: '/', label: t.nav.home, icon: Shield, end: true },
    { to: '/profiles', label: t.nav.profiles, icon: Users },
    { to: '/documents', label: t.nav.documents, icon: FileText },
    { to: '/cards', label: t.nav.cards, icon: CreditCard },
    { to: '/passwords', label: t.nav.passwords, icon: KeyRound },
    { to: '/settings', label: t.nav.settings, icon: Settings },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-zinc-800">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Shield size={14} className="text-white" />
        </div>
        <span className="font-semibold text-zinc-100 tracking-tight">DIID</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800',
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Lock button — only when PIN is set */}
      {pinHash && (
        <div className="px-3 pb-2">
          <button
            onClick={lock}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 text-sm transition-colors"
          >
            <Lock size={15} />
            {t.pin.lock_btn}
          </button>
        </div>
      )}

      {/* Language toggle */}
      <div className="p-3 border-t border-zinc-800">
        <div className="flex rounded-lg bg-zinc-800 p-0.5 gap-0.5">
          {(['en', 'ru'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
                lang === l
                  ? 'bg-zinc-600 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
