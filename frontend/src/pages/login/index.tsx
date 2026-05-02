import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { authApi } from '../../lib/api/auth'
import { useAuthStore } from '../../features/auth/authStore'
import { useT, useLangStore } from '../../lib/i18n'
import toast from 'react-hot-toast'

const inputCls =
  'w-full pl-10 pr-10 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors text-sm'

export function LoginPage() {
  const [initialized, setInitialized] = useState<boolean | null>(null)
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const t = useT()
  const { lang, setLang } = useLangStore()

  useEffect(() => {
    authApi.status()
      .then(s => setInitialized(s.initialized))
      .catch(() => setInitialized(true))
  }, [])

  if (initialized === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      {/* Language toggle — top right */}
      <div className="absolute top-4 right-4 flex rounded-lg bg-zinc-800 border border-zinc-700 p-0.5 gap-0.5">
        {(['en', 'ru', 'kk'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              lang === l ? 'bg-zinc-600 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="DIID" className="w-20 h-20 drop-shadow-lg" />
          <span className="text-[8px] font-semibold text-zinc-700 tracking-[0.5em] uppercase mt-1 mb-2">v1.0.0</span>
          <p className="text-zinc-500 text-sm">
            {initialized ? t.auth.subtitle_login : t.auth.subtitle_setup}
          </p>
        </div>

        {initialized
          ? <LoginForm t={t} onSuccess={async () => {
              const user = await authApi.me()
              setUser(user)
              navigate('/')
            }} />
          : <SetupForm t={t} onSuccess={() => setInitialized(true)} />
        }

        {/* Tagline */}
        <p className="mt-8 text-center text-[11px] text-zinc-600 leading-relaxed">
          Define{' '}
          <span className="text-indigo-400 font-medium">Hence</span>
          {' '}Confine Δ{' '}
          <a
            href="https://36.dorozhk.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            DOROZHK.IN WAS NOW(HERE)
          </a>
        </p>
      </div>
    </div>
  )
}

// ── Login ────────────────────────────────────────────────────────────────────
function LoginForm({ t, onSuccess }: { t: ReturnType<typeof useT>; onSuccess: () => Promise<void> }) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    try {
      await authApi.login(password)
      await onSuccess()
    } catch {
      toast.error(t.auth.err_wrong)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <PasswordInput value={password} onChange={setPassword} show={show} onToggle={() => setShow(v => !v)} placeholder={t.auth.placeholder_password} />
      <button
        type="submit"
        disabled={loading || !password}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-medium text-sm transition-colors"
      >
        {loading ? <Spinner label={t.auth.btn_signing} /> : t.auth.btn_signin}
      </button>
    </form>
  )
}

// ── First-run Setup ──────────────────────────────────────────────────────────
function SetupForm({ t, onSuccess }: { t: ReturnType<typeof useT>; onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showCfm, setShowCfm] = useState(false)
  const [loading, setLoading] = useState(false)

  const mismatch = confirm.length > 0 && password !== confirm
  const tooShort = password.length > 0 && password.length < 8
  const canSubmit = password.length >= 8 && password === confirm && !loading

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    try {
      await authApi.setup(password)
      toast.success(t.auth.ok_created)
      onSuccess()
    } catch {
      toast.error(t.auth.err_create)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <PasswordInput value={password} onChange={setPassword} show={showPwd} onToggle={() => setShowPwd(v => !v)} placeholder={t.auth.placeholder_password} />
        {tooShort && <p className="text-xs text-amber-400 mt-1.5 pl-1">{t.auth.val_min8}</p>}
      </div>
      <div>
        <PasswordInput value={confirm} onChange={setConfirm} show={showCfm} onToggle={() => setShowCfm(v => !v)} placeholder={t.auth.placeholder_confirm} />
        {mismatch && <p className="text-xs text-red-400 mt-1.5 pl-1">{t.auth.val_mismatch}</p>}
      </div>
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-medium text-sm transition-colors"
      >
        {loading ? <Spinner label={t.auth.btn_creating} /> : t.auth.btn_create}
      </button>
    </form>
  )
}

// ── Shared primitives ────────────────────────────────────────────────────────
function PasswordInput({ value, onChange, show, onToggle, placeholder }: {
  value: string; onChange: (v: string) => void
  show: boolean; onToggle: () => void; placeholder: string
}) {
  return (
    <div className="relative">
      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="current-password"
        className={inputCls}
      />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

function Spinner({ label }: { label: string }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      {label}
    </span>
  )
}
