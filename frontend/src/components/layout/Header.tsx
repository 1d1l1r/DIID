import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LogOut, Home } from 'lucide-react'
import { useAuthStore } from '../../features/auth/authStore'
import { authApi } from '../../lib/api/auth'
import { queryClient } from '../../lib/query-client'
import { SearchOverlay } from '../search/SearchOverlay'
import toast from 'react-hot-toast'

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      logout()
      queryClient.clear()
      navigate('/login')
    }
    toast.success('Вышли из системы')
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
          <span className="flex-1 text-left">Поиск...</span>
          <kbd className="text-xs border border-zinc-700 rounded px-1 py-0.5">⌘K</kbd>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Home — mobile only, sidebar handles desktop */}
          <button
            onClick={() => navigate('/')}
            title="Главная"
            className="md:hidden flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <Home size={17} />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors text-sm"
          >
            <LogOut size={15} />
            <span className="hidden md:inline">Выйти</span>
          </button>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
