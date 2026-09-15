import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { authApi } from '../../lib/api/auth'
import { useAuthStore } from './authStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, setUser } = useAuthStore()

  useEffect(() => {
    let active = true
    const finish = (next: Parameters<typeof setUser>[0]) => {
      if (active && useAuthStore.getState().loading) setUser(next)
    }
    if (loading) {
      authApi.me().then(finish).catch(() => finish(null))
    }
    return () => { active = false }
  }, [loading, setUser])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-indigo-500 animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
