import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Delete, CheckCircle2, ShieldCheck, ShieldOff, AlertTriangle } from 'lucide-react'
import { usePinStore } from '../../features/pin/pinStore'
import { useT } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

const NUMPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
]

type Step = 'idle' | 'enter' | 'confirm' | 'enter_decoy' | 'confirm_decoy'

function MiniPad({ onComplete, title, error }: {
  onComplete: (pin: string) => void
  title: string
  error?: string
}) {
  // Visual state — for rendering dots only
  const [digits, setDigitsState] = useState<string[]>([])
  const [shake, setShake] = useState(false)

  // Refs — always current, never stale in closures
  const digitsRef = useRef<string[]>([])
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  // Keep ref and visual state in sync
  const setDigits = useCallback((next: string[]) => {
    digitsRef.current = next
    setDigitsState(next)
  }, [])

  useEffect(() => {
    if (error) {
      setShake(true)
      setDigits([])
      setTimeout(() => setShake(false), 500)
    }
  }, [error, setDigits])

  // press has NO dependency on digits or onComplete —
  // it reads from refs so it's immune to stale closures on rapid taps
  const press = useCallback((key: string) => {
    if (key === '⌫') {
      setDigits(digitsRef.current.slice(0, -1))
      return
    }
    const current = digitsRef.current
    if (current.length >= 4) return
    const next = [...current, key]
    if (next.length === 4) {
      setDigits([])                        // clear dots immediately
      onCompleteRef.current(next.join('')) // fire with correct value
    } else {
      setDigits(next)
    }
  }, [setDigits])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') press(e.key)
      else if (e.key === 'Backspace') press('⌫')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm font-medium text-zinc-300 mb-5">{title}</p>
      <div className={cn('flex gap-4 mb-3', shake && 'animate-shake')}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(
            'w-3 h-3 rounded-full border-2 transition-all duration-150',
            i < digits.length ? 'bg-indigo-400 border-indigo-400 scale-110' : 'bg-transparent border-zinc-600',
          )} />
        ))}
      </div>
      <div className="h-4 mb-4">
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
      </div>
      <div className="flex flex-col gap-2.5">
        {NUMPAD.map((row, ri) => (
          <div key={ri} className="flex gap-2.5 justify-center">
            {row.map((key, ki) => {
              if (key === '') return <div key={ki} className="w-16 h-16" />
              return (
                <button key={ki} onClick={() => press(key)}
                  className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95',
                    key === '⌫' ? 'bg-transparent text-zinc-400 hover:text-zinc-200' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100',
                  )}
                >
                  {key === '⌫' ? <Delete size={18} /> : <span className="text-xl font-light">{key}</span>}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export function PinSettingsPage() {
  const t = useT()
  const navigate = useNavigate()
  const { pinHash, decoyPinHash, setPin, removePin, setDecoyPin, removeDecoyPin } = usePinStore()

  const [step, setStep] = useState<Step>('idle')
  const [firstPin, setFirstPin] = useState('')
  const [error, setError] = useState('')

  function reset() { setStep('idle'); setFirstPin(''); setError('') }

  // ── Main PIN flow ──
  function handleFirstPin(pin: string) { setFirstPin(pin); setError(''); setStep('confirm') }

  async function handleConfirmPin(pin: string) {
    if (pin !== firstPin) {
      setError(t.pin.pins_mismatch)
      setStep('enter')
      setFirstPin('')
      return
    }
    try {
      await setPin(pin)
      reset()
      toast.success(t.pin.ok_set)
    } catch {
      setError(t.pin.pins_mismatch)
      setStep('enter')
      setFirstPin('')
    }
  }

  // ── Decoy PIN flow ──
  function handleFirstDecoy(pin: string) { setFirstPin(pin); setError(''); setStep('confirm_decoy') }

  async function handleConfirmDecoy(pin: string) {
    if (pin !== firstPin) {
      setError(t.pin.pins_mismatch)
      setStep('enter_decoy')
      setFirstPin('')
      return
    }
    try {
      const result = await setDecoyPin(pin)
      if (result === 'same_as_real') {
        setError(t.pin.decoy_same_error)
        setStep('enter_decoy')
        setFirstPin('')
        return
      }
      reset()
      toast.success(t.pin.ok_decoy_set)
    } catch {
      setError(t.pin.pins_mismatch)
      setStep('enter_decoy')
      setFirstPin('')
    }
  }

  const backLabel = step !== 'idle' ? t.common.back : t.settings.title

  return (
    <div className="max-w-sm mx-auto">
      <button
        onClick={() => step !== 'idle' ? reset() : navigate('/settings')}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> {backLabel}
      </button>

      {/* ── IDLE ── */}
      {step === 'idle' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 mb-2">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
              pinHash ? 'bg-indigo-500/15 border border-indigo-500/30' : 'bg-zinc-800')}>
              {pinHash ? <ShieldCheck size={17} className="text-indigo-400" /> : <ShieldOff size={17} className="text-zinc-500" />}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">{t.pin.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{pinHash ? t.pin.status_set : t.pin.status_none}</p>
            </div>
            {pinHash && (
              <div className="ml-auto flex gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-indigo-400" />)}
              </div>
            )}
          </div>

          {pinHash ? (
            <>
              <button onClick={() => { setStep('enter'); setError('') }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors text-left">
                <CheckCircle2 size={16} className="text-zinc-400" />
                <span className="text-sm text-zinc-200">{t.pin.change_pin}</span>
              </button>
              <button onClick={() => { removePin(); toast.success(t.pin.ok_removed) }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-500/30 transition-colors text-left">
                <ShieldOff size={16} className="text-red-500/70" />
                <span className="text-sm text-red-400/80">{t.pin.remove_pin}</span>
              </button>
            </>
          ) : (
            <button onClick={() => { setStep('enter'); setError('') }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-left">
              <ShieldCheck size={16} className="text-white" />
              <span className="text-sm font-medium text-white">{t.pin.set_pin}</span>
            </button>
          )}

          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                decoyPinHash ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-zinc-800')}>
                <AlertTriangle size={17} className={decoyPinHash ? 'text-amber-400' : 'text-zinc-600'} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">{t.pin.decoy_title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {!pinHash ? t.pin.decoy_requires_pin : decoyPinHash ? t.pin.decoy_status_set : t.pin.decoy_status_none}
                </p>
              </div>
              {decoyPinHash && (
                <div className="ml-auto flex gap-1.5">
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-amber-400" />)}
                </div>
              )}
            </div>

            {pinHash && (
              decoyPinHash ? (
                <>
                  <button onClick={() => { setStep('enter_decoy'); setError('') }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors text-left">
                    <CheckCircle2 size={16} className="text-zinc-400" />
                    <span className="text-sm text-zinc-200">{t.pin.change_decoy}</span>
                  </button>
                  <button onClick={() => { removeDecoyPin(); toast.success(t.pin.ok_decoy_removed) }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-500/30 transition-colors text-left">
                    <ShieldOff size={16} className="text-red-500/70" />
                    <span className="text-sm text-red-400/80">{t.pin.remove_decoy}</span>
                  </button>
                </>
              ) : (
                <button onClick={() => { setStep('enter_decoy'); setError('') }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-amber-600/20 border border-amber-500/30 hover:bg-amber-600/30 transition-colors text-left">
                  <AlertTriangle size={16} className="text-amber-400" />
                  <span className="text-sm font-medium text-amber-300">{t.pin.set_decoy}</span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {step === 'enter' && <MiniPad title={t.pin.enter_new} onComplete={handleFirstPin} error={error} />}
      {step === 'confirm' && <MiniPad title={t.pin.confirm_pin} onComplete={handleConfirmPin} error={error} />}
      {step === 'enter_decoy' && <MiniPad title={t.pin.enter_new} onComplete={handleFirstDecoy} error={error} />}
      {step === 'confirm_decoy' && <MiniPad title={t.pin.confirm_pin} onComplete={handleConfirmDecoy} error={error} />}
    </div>
  )
}
