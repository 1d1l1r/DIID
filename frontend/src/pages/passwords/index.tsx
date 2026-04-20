import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Plus, X } from 'lucide-react'
import { profilesApi } from '../../lib/api/profiles'
import { passwordsApi } from '../../lib/api/passwords'
import { PasswordItem } from '../../components/passwords/PasswordItem'
import { PageHeader } from '../../components/common/PageHeader'
import { EmptyState } from '../../components/common/EmptyState'
import { useT, getT } from '../../lib/i18n'
import toast from 'react-hot-toast'

const inputCls = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors'

const initForm = () => ({ profile_id: '', title: '', login: '', password: '', url: '', category: '' })

export function PasswordsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const t = useT()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initForm)

  const { data: profiles = [] } = useQuery({ queryKey: ['profiles'], queryFn: () => profilesApi.list() })
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['passwords'],
    queryFn: () => passwordsApi.list(),
  })

  const create = useMutation({
    mutationFn: () => passwordsApi.create({
      profile_id: form.profile_id || null,
      title: form.title,
      login: form.login || null,
      password: form.password || null,
      url: form.url || null,
      category: form.category || null,
      is_shared: !form.profile_id,
    }),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['passwords'] })
      qc.invalidateQueries({ queryKey: ['profiles'] })
      setShowForm(false)
      setForm(initForm())
      toast.success(t.passwords.ok_added)
    },
  })

  // Group by category
  const grouped = entries.reduce<Record<string, typeof entries>>((acc, e) => {
    const cat = e.category || t.passwords.no_profile
    ;(acc[cat] ??= []).push(e)
    return acc
  }, {})

  return (
    <div>
      <PageHeader
        title={t.passwords.title}
        subtitle={entries.length > 0 ? `${entries.length}` : undefined}
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? t.common.cancel : t.common.add}
          </button>
        }
      />

      {showForm && (
        <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
          <p className="text-sm font-medium text-zinc-300">{t.passwords.new_pwd}</p>

          {/* Optional profile selector */}
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">{t.common.profile} <span className="text-zinc-600">({t.passwords.no_profile})</span></label>
            <select
              value={form.profile_id}
              onChange={e => setForm(f => ({ ...f, profile_id: e.target.value }))}
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
              { key: 'title', placeholder: `${t.passwords.service} *`, type: 'text' },
              { key: 'login', placeholder: t.passwords.login, type: 'text' },
              { key: 'password', placeholder: t.passwords.password, type: 'password' },
              { key: 'url', placeholder: t.passwords.url, type: 'url' },
              { key: 'category', placeholder: t.passwords.category, type: 'text' },
            ].map(({ key, placeholder, type }) => (
              <input
                key={key}
                type={type}
                placeholder={placeholder}
                value={(form as never)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className={inputCls}
              />
            ))}
          </div>

          <button
            onClick={() => create.mutate()}
            disabled={!form.title || create.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-white text-sm font-medium transition-colors"
          >
            {create.isPending ? t.common.adding : t.common.add}
          </button>
        </div>
      )}

      {isLoading && <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-zinc-900 animate-pulse" />)}</div>}

      {!isLoading && entries.length === 0 && !showForm && (
        <EmptyState icon={KeyRound} title={t.passwords.empty_title} description={t.passwords.empty_desc} />
      )}

      {!isLoading && entries.length > 0 && (
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
    </div>
  )
}
