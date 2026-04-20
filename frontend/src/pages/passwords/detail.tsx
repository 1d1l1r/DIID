import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trash2, Globe, Pencil, Check, X, Eye, EyeOff } from 'lucide-react'
import { passwordsApi } from '../../lib/api/passwords'
import { CopyButton } from '../../components/common/CopyButton'
import { FieldReveal } from '../../components/common/FieldReveal'
import type { PasswordEntry } from '../../lib/types'
import { useVisibilityStore } from '../../features/visibility/visibilityStore'
import { useT, getT } from '../../lib/i18n'
import toast from 'react-hot-toast'

type EditForm = {
  title: string
  login: string
  password: string
  url: string
  category: string
  note: string
}

function entryToForm(e: PasswordEntry): EditForm {
  return {
    title: e.title,
    login: e.login ?? '',
    password: e.password ?? '',
    url: e.url ?? '',
    category: e.category ?? '',
    note: e.note ?? '',
  }
}

const inputCls = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors'

export function PasswordDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const t = useT()
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [showPwd, setShowPwd] = useState(false)

  const { data: entry } = useQuery({ queryKey: ['password', id], queryFn: () => passwordsApi.get(id!) })
  const { getMode } = useVisibilityStore()

  const del = useMutation({
    mutationFn: () => passwordsApi.delete(id!),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['passwords'] })
      navigate('/passwords')
      toast.success(t.passwords.ok_deleted)
    },
  })

  const update = useMutation({
    mutationFn: (data: Partial<PasswordEntry>) => passwordsApi.update(id!, data),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['password', id] })
      qc.invalidateQueries({ queryKey: ['passwords'] })
      setEditing(false)
      toast.success(t.passwords.ok_saved)
    },
  })

  if (!entry) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 rounded-full border-2 border-zinc-700 border-t-indigo-500 animate-spin" />
    </div>
  )

  function startEdit() {
    setEditForm(entryToForm(entry!))
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setEditForm(null)
    setShowPwd(false)
  }

  function saveEdit() {
    if (!editForm) return
    update.mutate({
      title: editForm.title,
      login: editForm.login || null,
      password: editForm.password || null,
      url: editForm.url || null,
      category: editForm.category || null,
      note: editForm.note || null,
    })
  }

  return (
    <div className="max-w-md">
      <button onClick={() => navigate('/passwords')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 text-sm mb-4 transition-colors">
        <ArrowLeft size={15} /> {t.passwords.title}
      </button>

      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 mb-4">
        {editing && editForm ? (
          <div className="space-y-3">
            <input
              value={editForm.title}
              onChange={e => setEditForm(f => f ? { ...f, title: e.target.value } : f)}
              placeholder={`${t.passwords.service} *`}
              className={inputCls}
            />
            <input
              value={editForm.login}
              onChange={e => setEditForm(f => f ? { ...f, login: e.target.value } : f)}
              placeholder={t.passwords.login}
              className={inputCls}
            />
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={editForm.password}
                onChange={e => setEditForm(f => f ? { ...f, password: e.target.value } : f)}
                placeholder={t.passwords.password}
                className={inputCls + ' pr-10 font-mono'}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <input
              value={editForm.url}
              onChange={e => setEditForm(f => f ? { ...f, url: e.target.value } : f)}
              placeholder={t.passwords.url}
              className={inputCls}
            />
            <input
              value={editForm.category}
              onChange={e => setEditForm(f => f ? { ...f, category: e.target.value } : f)}
              placeholder={t.passwords.category}
              className={inputCls}
            />
            <textarea
              value={editForm.note}
              onChange={e => setEditForm(f => f ? { ...f, note: e.target.value } : f)}
              placeholder={t.common.note}
              rows={2}
              className={inputCls + ' resize-none'}
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={saveEdit}
                disabled={!editForm.title || update.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <Check size={14} />
                {update.isPending ? t.common.saving : t.common.save}
              </button>
              <button onClick={cancelEdit} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-sm transition-colors">
                <X size={14} /> {t.common.cancel}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                <Globe size={18} className="text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-100">{entry.title}</p>
                {entry.category && <p className="text-xs text-zinc-500">{entry.category}</p>}
              </div>
              <button onClick={startEdit} className="p-1.5 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors flex-shrink-0">
                <Pencil size={14} />
              </button>
            </div>

            <div className="space-y-3.5">
              {entry.login && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500 flex-shrink-0 w-20">{t.passwords.login}</span>
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="font-mono text-sm text-zinc-200 truncate">{entry.login}</span>
                    <CopyButton value={entry.login} label={t.passwords.login} copyKey={`login-${id}`} />
                  </div>
                </div>
              )}
              {entry.password && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500 flex-shrink-0 w-20">{t.passwords.password}</span>
                  <FieldReveal value={entry.password} mode={getMode('passwords.password')} label={t.passwords.password} copyKey={`pw-${id}`} />
                </div>
              )}
              {entry.url && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500 flex-shrink-0 w-20">{t.passwords.url}</span>
                  <div className="flex items-center gap-1 min-w-0">
                    <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline truncate">
                      {entry.url}
                    </a>
                    <CopyButton value={entry.url} label={t.passwords.url} copyKey={`url-${id}`} />
                  </div>
                </div>
              )}
              {entry.note && (
                <div className="pt-3 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">{t.common.note}</p>
                  <p className="text-sm text-zinc-400">{entry.note}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {!editing && (
        <button
          onClick={() => { if (confirm(t.passwords.confirm_delete)) del.mutate() }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={15} /> {t.passwords.confirm_delete}
        </button>
      )}
    </div>
  )
}
