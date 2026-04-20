import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { authApi } from '../../lib/api/auth'
import { PageHeader } from '../../components/common/PageHeader'
import { useT } from '../../lib/i18n'
import toast from 'react-hot-toast'

const inputCls =
  'w-full pl-10 pr-10 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors text-sm'

function PasswordInput({ value, onChange, show, onToggle, placeholder, autoComplete }: {
  value: string; onChange: (v: string) => void
  show: boolean; onToggle: () => void
  placeholder: string; autoComplete?: string
}) {
  return (
    <div className="relative">
      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={inputCls}
      />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5">
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

export function ChangePasswordPage() {
  const t = useT()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const tooShort = next.length > 0 && next.length < 8
  const mismatch = confirm.length > 0 && next !== confirm
  const canSubmit = current.length > 0 && next.length >= 8 && next === confirm && !loading

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    try {
      await authApi.changePassword(current, next)
      toast.success(t.change_pwd.ok)
      setCurrent(''); setNext(''); setConfirm('')
    } catch (err: any) {
      const status = err?.response?.status
      const detail = err?.response?.data?.detail
      console.error('[change-password]', status, detail, err)
      if (status === 400 && detail === 'Current password is incorrect') {
        toast.error(t.change_pwd.err_wrong)
      } else if (status === 422) {
        const msg = Array.isArray(detail) ? detail[0]?.msg : detail
        toast.error(msg ?? t.change_pwd.err_fail)
      } else {
        toast.error(`${t.change_pwd.err_fail}${status ? ` (${status})` : ''}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm">
      <PageHeader title={t.change_pwd.title} />
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">{t.change_pwd.current_label}</label>
          <PasswordInput value={current} onChange={setCurrent} show={showCurrent} onToggle={() => setShowCurrent(v => !v)} placeholder={t.change_pwd.current_placeholder} autoComplete="current-password" />
        </div>
        <div className="pt-1">
          <label className="text-xs text-zinc-500 mb-1.5 block">{t.change_pwd.new_label}</label>
          <div className="space-y-2">
            <PasswordInput value={next} onChange={setNext} show={showNext} onToggle={() => setShowNext(v => !v)} placeholder={t.change_pwd.new_placeholder} autoComplete="new-password" />
            {tooShort && <p className="text-xs text-amber-400 pl-1">{t.change_pwd.val_min8}</p>}
            <PasswordInput value={confirm} onChange={setConfirm} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} placeholder={t.change_pwd.confirm_placeholder} autoComplete="new-password" />
            {mismatch && <p className="text-xs text-red-400 pl-1">{t.change_pwd.val_mismatch}</p>}
          </div>
        </div>
        <div className="pt-2">
          <button type="submit" disabled={!canSubmit} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-medium text-sm transition-colors">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                {t.change_pwd.saving}
              </span>
            ) : t.change_pwd.btn}
          </button>
        </div>
      </form>
    </div>
  )
}
