import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Delete } from 'lucide-react'
import { usePinStore } from '../../features/pin/pinStore'
import { useAuthStore } from '../../features/auth/authStore'
import { authApi } from '../../lib/api/auth'
import { queryClient } from '../../lib/query-client'
import { useT } from '../../lib/i18n'
import { cn } from '../../lib/utils'

const MAX_ATTEMPTS = 5

const NUMPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
]

export function PinLockScreen() {
  const t = useT()
  const { pinHash, isLocked, unlock } = usePinStore()
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const [digits, setDigitsState] = useState<string[]>([])
  const [shake, setShake] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState('')

  // Refs — always current, immune to stale closures on rapid mobile taps
  const digitsRef = useRef<string[]>([])
  const attemptsRef = useRef(0)

  const setDigits = useCallback((next: string[]) => {
    digitsRef.current = next
    setDigitsState(next)
  }, [])

  const handleLogout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    // Do NOT call removePin() — that would erase the PIN from localStorage
    // and sync the removal to every other open tab in the same browser.
    logout()
    queryClient.clear()
    navigate('/login')
  }, [logout, navigate])

  const tryUnlock = useCallback(async (pin: string) => {
    const ok = await unlock(pin)
    if (ok) {
      setDigits([])
      setError('')
      setAttempts(0)
      attemptsRef.current = 0
    } else {
      const next = attemptsRef.current + 1
      attemptsRef.current = next
      setAttempts(next)
      setShake(true)
      setDigits([])
      setTimeout(() => setShake(false), 500)
      if (next >= MAX_ATTEMPTS) {
        await handleLogout()
      } else {
        setError(t.pin.wrong_pin)
      }
    }
  }, [unlock, handleLogout, t, setDigits])

  // press reads from refs — no stale closures regardless of tap speed
  const press = useCallback((key: string) => {
    if (key === '⌫') {
      setDigits(digitsRef.current.slice(0, -1))
      setError('')
      return
    }
    const current = digitsRef.current
    if (current.length >= 4) return
    const next = [...current, key]
    setDigits(next)
    if (next.length === 4) {
      tryUnlock(next.join(''))
    }
  }, [setDigits, tryUnlock])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') press(e.key)
      else if (e.key === 'Backspace') press('⌫')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  if (!pinHash || !isLocked) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950">
      {/* Icon + title */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-4">
          <Lock size={28} className="text-indigo-400" />
        </div>
        <p className="text-zinc-100 text-xl font-semibold">{t.pin.locked_title}</p>
      </div>

      {/* Dot indicators */}
      <div className={cn('flex gap-4 mb-3', shake && 'animate-shake')}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-3.5 h-3.5 rounded-full border-2 transition-all duration-150',
              i < digits.length
                ? 'bg-indigo-400 border-indigo-400 scale-110'
                : 'bg-transparent border-zinc-600',
            )}
          />
        ))}
      </div>

      {/* Error */}
      <div className="h-5 mb-6">
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      {/* Numpad */}
      <div className="flex flex-col gap-3">
        {NUMPAD.map((row, ri) => (
          <div key={ri} className="flex gap-3 justify-center">
            {row.map((key, ki) => {
              if (key === '') return <div key={ki} className="w-20 h-20" />
              return (
                <button
                  key={ki}
                  onClick={() => press(key)}
                  className={cn(
                    'w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95',
                    key === '⌫'
                      ? 'bg-transparent text-zinc-400 hover:text-zinc-200'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100',
                  )}
                >
                  {key === '⌫'
                    ? <Delete size={22} />
                    : <span className="text-2xl font-light">{key}</span>
                  }
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Logout link */}
      <button
        onClick={handleLogout}
        className="mt-10 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        {t.pin.logout_link}
      </button>
    </div>
  )
}
