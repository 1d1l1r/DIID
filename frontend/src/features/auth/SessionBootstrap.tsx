import { useEffect, useState } from 'react'
import axios from 'axios'
import { authApi } from '../../lib/api/auth'
import { useT } from '../../lib/i18n'
import { useAuthStore } from './authStore'

/** Restore the server session before mounting any route, including /login. */
export function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const { loading, setUser } = useAuthStore()
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const t = useT()

  useEffect(() => {
    if (!loading) return
    let active = true
    const controller = new AbortController()
    const retry = () => { setFailed(false); setAttempt(value => value + 1) }
    window.addEventListener('online', retry)
    authApi.me(undefined, controller.signal).then(user => {
      if (active && useAuthStore.getState().loading) setUser(user)
    }).catch(error => {
      if (!active || !useAuthStore.getState().loading) return
      if (axios.isAxiosError(error) && error.response?.status === 401) setUser(null)
      else setFailed(true)
    })
    return () => {
      active = false
      controller.abort()
      window.removeEventListener('online', retry)
    }
  }, [loading, attempt, setUser])

  if (!loading) return <>{children}</>
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
      {failed ? <>
        <p role="alert" className="text-zinc-400">{t.auth.session_unavailable}</p>
        <button className="rounded-xl bg-indigo-600 px-5 py-3 text-white" onClick={() => {
          setFailed(false)
          setAttempt(value => value + 1)
        }}>{t.auth.retry_session}</button>
      </> : <div role="status" aria-label={t.auth.restoring_session} className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-indigo-500 animate-spin" />}
    </div>
  )
}
