import { create } from 'zustand'
import type { User } from '../../lib/types'
import { queryClient } from '../../lib/query-client'
import { selectAccountState } from './accountState'

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (v: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  setUser: (user) => {
    if (get().user?.id !== user?.id) {
      queryClient.clear()
      selectAccountState(user)
    }
    set({ user, loading: false })
    localStorage.setItem('diid-active-account', user?.id ?? '')
  },
  setLoading: (loading) => set({ loading }),
  logout: () => get().setUser(null),
}))

export function checkAccountChanged() {
  const current = useAuthStore.getState().user
  const active = localStorage.getItem('diid-active-account')
  if (current && active !== null && active !== current.id) {
    queryClient.clear()
    selectAccountState(null)
    useAuthStore.setState({ user: null, loading: false })
  }
}

window.addEventListener('storage', event => {
  if (event.key === 'diid-active-account') checkAccountChanged()
})
