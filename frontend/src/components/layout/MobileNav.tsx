import { NavLink } from 'react-router-dom'
import { Users, FileText, CreditCard, KeyRound, Settings } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useT, useLangStore } from '../../lib/i18n'

export function MobileNav() {
  const t = useT()
  const { lang, setLang } = useLangStore()

  const NAV = [
    { to: '/profiles', label: t.nav.profiles, icon: Users },
    { to: '/documents', label: t.nav.documents, icon: FileText },
    { to: '/cards', label: t.nav.cards, icon: CreditCard },
    { to: '/passwords', label: t.nav.passwords, icon: KeyRound },
    { to: '/settings', label: t.nav.settings, icon: Settings },
  ]

  return (
    <div className="flex items-center justify-around px-2 py-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className={({ isActive }) =>
            cn(
              'flex items-center justify-center p-3 rounded-xl transition-colors',
              isActive ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-500 hover:text-zinc-300',
            )
          }
        >
          <Icon size={22} />
        </NavLink>
      ))}
      {/* Language toggle */}
      <button
        onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
        className="flex items-center justify-center p-3 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors text-xs font-semibold leading-none"
        title={lang === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
      >
        {lang === 'en' ? 'RU' : 'EN'}
      </button>
    </div>
  )
}
