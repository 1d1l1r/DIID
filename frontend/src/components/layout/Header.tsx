import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LogOut, Home, Lock } from 'lucide-react'
import { useAuthStore } from '../../features/auth/authStore'
import { authApi } from '../../lib/api/auth'
import { queryClient } from '../../lib/query-client'
import { SearchOverlay } from '../search/SearchOverlay'
import { usePinStore } from '../../features/pin/pinStore'
import { useLangStore, useT } from '../../lib/i18n'
import toast from 'react-hot-toast'

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const { logout } = useAuthStore()
  const { pinHash, lock } = usePinStore()
  const { lang, setLang } = useLangStore()
  const navigate = useNavigate()
  const t = useT()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      logout()
      queryClient.clear()
      navigate('/login')
    }
    toast.success(t.sessions.ok_revoked)
  }

  return (
    <>
      <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-zinc-800 bg-zinc-950 flex-shrink-0">
        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors text-sm w-52 md:w-72"
        >
          <Search size={14} />
          <span className="flex-1 text-left">{t.common.search_placeholder}</span>
          <kbd className="text-xs border border-zinc-700 rounded px-1 py-0.5 hidden sm:inline">⌘K</kbd>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Home — mobile only */}
          <button
            onClick={() => navigate('/')}
            title="Home"
            className="md:hidden flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <Home size={17} />
          </button>

          {/* Lock — mobile only, shown only when PIN is set */}
          {pinHash && (
            <button
              onClick={lock}
              title={t.pin.locked_title}
              className="md:hidden flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
            >
              <Lock size={17} />
            </button>
          )}

          {/* Language toggle — mobile only */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ru' : lang === 'ru' ? 'kk' : 'en')}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-xs font-semibold"
          >
            {lang === 'en' ? 'RU' : lang === 'ru' ? 'KK' : 'EN'}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors text-sm"
          >
            <LogOut size={15} />
            <span className="hidden md:inline">{t.common.sign_out}</span>
          </button>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
