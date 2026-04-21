import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { KeyRound, KeySquare, Plus, X, Check, Eye, EyeOff } from 'lucide-react'
import { profilesApi } from '../../lib/api/profiles'
import { passwordsApi } from '../../lib/api/passwords'
import { keysApi } from '../../lib/api/keys'
import { PasswordItem } from '../../components/passwords/PasswordItem'
import { KeyItem } from '../../components/passwords/KeyItem'
import { PageHeader } from '../../components/common/PageHeader'
import { EmptyState } from '../../components/common/EmptyState'
import { useT, getT } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

const inputCls = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors'

const initPwdForm = () => ({ profile_id: '', title: '', login: '', password: '', url: '', category: '' })
const initKeyForm = () => ({ profile_id: '', name: '', password: '' })

type Tab = 'passwords' | 'keys'

export function PasswordsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const t = useT()

  const [tab, setTab] = useState<Tab>('passwords')
  const [showForm, setShowForm] = useState(false)
  const [pwdForm, setPwdForm] = useState(initPwdForm)
  const [keyForm, setKeyForm] = useState(initKeyForm)
  const [showKeyPwd, setShowKeyPwd] = useState(false)

  const { data: profiles = [] } = useQuery({ queryKey: ['profiles'], queryFn: () => profilesApi.list() })

  // Passwords query
  const { data: entries = [], isLoading: pwdLoading } = useQuery({
    queryKey: ['passwords'],
    queryFn: () => passwordsApi.list(),
  })

  // Keys query
  const { data: keys = [], isLoading: keysLoading } = useQuery({
    queryKey: ['keys'],
    queryFn: () => keysApi.list(),
  })

  const createPwd = useMutation({
    mutationFn: () => passwordsApi.create({
      profile_id: pwdForm.profile_id || null,
      title: pwdForm.title,
      login: pwdForm.login || null,
      password: pwdForm.password || null,
      url: pwdForm.url || null,
      category: pwdForm.category || null,
      is_shared: !pwdForm.profile_id,
    }),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['passwords'] })
      qc.invalidateQueries({ queryKey: ['profiles'] })
      setShowForm(false)
      setPwdForm(initPwdForm())
      toast.success(t.passwords.ok_added)
    },
  })

  const createKey = useMutation({
    mutationFn: () => keysApi.create({
      profile_id: keyForm.profile_id || null,
      name: keyForm.name,
      password: keyForm.password || null,
    }),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['keys'] })
      setShowForm(false)
      setKeyForm(initKeyForm())
      toast.success(t.keys.ok_added)
    },
  })

  // Group passwords by category
  const grouped = entries.reduce<Record<string, typeof entries>>((acc, e) => {
    const cat = e.category || t.passwords.no_profile
    ;(acc[cat] ??= []).push(e)
    return acc
  }, {})

  function toggleForm() {
    setShowForm(v => !v)
    setPwdForm(initPwdForm())
    setKeyForm(initKeyForm())
  }

  return (
    <div>
      <PageHeader
        title={t.passwords.title}
        subtitle={(tab === 'passwords' ? entries.length : keys.length) > 0
          ? `${tab === 'passwords' ? entries.length : keys.length}`
          : undefined}
        action={
          <button
            onClick={toggleForm}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? t.common.cancel : t.common.add}
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-zinc-900 rounded-lg border border-zinc-800 w-fit">
        {(['passwords', 'keys'] as Tab[]).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => { setTab(tabKey); setShowForm(false) }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              tab === tabKey
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            {tabKey === 'passwords'
              ? <><KeyRound size={12} /> {t.keys.tab_passwords}</>
              : <><KeySquare size={12} /> {t.keys.title}</>
            }
          </button>
        ))}
      </div>

      {/* ── PASSWORDS TAB ── */}
      {tab === 'passwords' && (
        <>
          {showForm && (
            <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <p className="text-sm font-medium text-zinc-300">{t.passwords.new_pwd}</p>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">
                  {t.common.profile} <span className="text-zinc-600">({t.passwords.no_profile})</span>
                </label>
                <select
                  value={pwdForm.profile_id}
                  onChange={e => setPwdForm(f => ({ ...f, profile_id: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">{t.passwords.no_profile}</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {[p.last_name, p.first_name, p.middle_name].filter(Boolean).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'title', placeholder: `${t.passwords.service}`, type: 'text' },
                  { key: 'login', placeholder: t.passwords.login, type: 'text' },
                  { key: 'password', placeholder: t.passwords.password, type: 'password' },
                  { key: 'url', placeholder: t.passwords.url, type: 'url' },
                  { key: 'category', placeholder: t.passwords.category, type: 'text' },
                ].map(({ key, placeholder, type }) => (
                  <input
                    key={key}
                    type={type}
                    placeholder={placeholder}
                    value={(pwdForm as never)[key]}
                    onChange={e => setPwdForm(f => ({ ...f, [key]: e.target.value }))}
                    className={inputCls}
                  />
                ))}
              </div>

              <button
                onClick={() => createPwd.mutate()}
                disabled={!pwdForm.title || createPwd.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <Check size={14} />
                {createPwd.isPending ? t.common.adding : t.common.add}
              </button>
            </div>
          )}

          {pwdLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
              ))}
            </div>
          )}

          {!pwdLoading && entries.length === 0 && !showForm && (
            <EmptyState icon={KeyRound} title={t.passwords.empty_title} description={t.passwords.empty_desc} />
          )}

          {!pwdLoading && entries.length > 0 && (
            <div className="space-y-5">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2 px-1">{cat}</p>
                  <div className="space-y-2">
                    {items.map(e => (
                      <PasswordItem key={e.id} entry={e} onClick={() => navigate(`/passwords/${e.id}`)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── KEYS TAB ── */}
      {tab === 'keys' && (
        <>
          {showForm && (
            <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <p className="text-sm font-medium text-zinc-300">{t.keys.new_key}</p>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">
                  {t.common.profile} <span className="text-zinc-600">({t.passwords.no_profile})</span>
                </label>
                <select
                  value={keyForm.profile_id}
                  onChange={e => setKeyForm(f => ({ ...f, profile_id: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">{t.passwords.no_profile}</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {[p.last_name, p.first_name, p.middle_name].filter(Boolean).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              <input
                value={keyForm.name}
                onChange={e => setKeyForm(f => ({ ...f, name: e.target.value }))}
                placeholder={t.keys.name}
                className={inputCls}
              />

              <div className="relative">
                <input
                  type={showKeyPwd ? 'text' : 'password'}
                  value={keyForm.password}
                  onChange={e => setKeyForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={t.keys.password}
                  className={inputCls + ' pr-10 font-mono'}
                />
                <button
                  type="button"
                  onClick={() => setShowKeyPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showKeyPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <button
                onClick={() => createKey.mutate()}
                disabled={!keyForm.name || createKey.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <Check size={14} />
                {createKey.isPending ? t.common.adding : t.common.add}
              </button>
            </div>
          )}

          {keysLoading && (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
              ))}
            </div>
          )}

          {!keysLoading && keys.length === 0 && !showForm && (
            <EmptyState icon={KeySquare} title={t.keys.empty_title} description={t.keys.empty_desc} />
          )}

          {!keysLoading && keys.length > 0 && (
            <div className="space-y-2">
              {keys.map(k => (
                <KeyItem key={k.id} entry={k} onClick={() => navigate(`/keys/${k.id}`)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
