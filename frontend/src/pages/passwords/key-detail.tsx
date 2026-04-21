import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Trash2, Pencil, Check, X, Eye, EyeOff,
  Paperclip, Download, Loader2,
} from 'lucide-react'
import { keysApi } from '../../lib/api/keys'
import { CopyButton } from '../../components/common/CopyButton'
import { FieldReveal } from '../../components/common/FieldReveal'
import type { KeyEntry } from '../../lib/types'
import { useVisibilityStore } from '../../features/visibility/visibilityStore'
import { useT, getT } from '../../lib/i18n'
import toast from 'react-hot-toast'

type EditForm = { name: string; password: string; note: string }

const inputCls = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors'

function entryToForm(e: KeyEntry): EditForm {
  return { name: e.name, password: e.password ?? '', note: e.note ?? '' }
}

export function KeyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const t = useT()
  const { getMode } = useVisibilityStore()

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: entry } = useQuery({ queryKey: ['key', id], queryFn: () => keysApi.get(id!) })

  const del = useMutation({
    mutationFn: () => keysApi.delete(id!),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['keys'] })
      navigate('/passwords')
      toast.success(t.keys.ok_deleted)
    },
  })

  const update = useMutation({
    mutationFn: (data: Partial<KeyEntry>) => keysApi.update(id!, data),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['key', id] })
      qc.invalidateQueries({ queryKey: ['keys'] })
      setEditing(false)
      toast.success(t.keys.ok_saved)
    },
  })

  const delFile = useMutation({
    mutationFn: () => keysApi.deleteFile(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['key', id] })
      qc.invalidateQueries({ queryKey: ['keys'] })
    },
  })

  if (!entry) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 rounded-full border-2 border-zinc-700 border-t-indigo-500 animate-spin" />
    </div>
  )

  function startEdit() { setEditForm(entryToForm(entry!)); setEditing(true) }
  function cancelEdit() { setEditing(false); setEditForm(null); setShowPwd(false) }
  function saveEdit() {
    if (!editForm) return
    update.mutate({
      name: editForm.name,
      password: editForm.password || null,
      note: editForm.note || null,
    })
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'p12' && ext !== 'pfx') {
      toast.error(t.keys.file_only_p12)
      return
    }
    setUploading(true)
    try {
      await keysApi.uploadFile(id!, file)
      qc.invalidateQueries({ queryKey: ['key', id] })
      qc.invalidateQueries({ queryKey: ['keys'] })
    } catch {
      toast.error(t.keys.file_only_p12)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="max-w-md">
      <button onClick={() => navigate('/passwords')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 text-sm mb-4 transition-colors">
        <ArrowLeft size={15} /> {t.keys.title}
      </button>

      {/* Main card */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 mb-4">
        {editing && editForm ? (
          <div className="space-y-3">
            <input
              value={editForm.name}
              onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)}
              placeholder={t.keys.name}
              className={inputCls}
            />
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={editForm.password}
                onChange={e => setEditForm(f => f ? { ...f, password: e.target.value } : f)}
                placeholder={t.keys.password}
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
                disabled={!editForm.name || update.isPending}
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
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-100">{entry.name}</p>
              </div>
              <button onClick={startEdit} className="p-1.5 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors flex-shrink-0">
                <Pencil size={14} />
              </button>
            </div>

            <div className="space-y-3.5">
              {entry.password && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500 flex-shrink-0 w-20">{t.keys.password}</span>
                  <FieldReveal value={entry.password} mode={getMode('keys.password')} label={t.keys.password} copyKey={`key-pw-${id}`} />
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

      {/* File section */}
      {!editing && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 mb-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">{t.keys.file_section}</p>

          {entry.file_name ? (
            <div className="flex items-center gap-3">
              <Paperclip size={14} className="text-amber-500 flex-shrink-0" />
              <span className="text-sm text-zinc-300 flex-1 truncate">{entry.file_name}</span>
              <a
                href={keysApi.getFileUrl(id!)}
                download={entry.file_name}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
              >
                <Download size={12} /> {t.keys.file_download}
              </a>
              <button
                onClick={() => { if (confirm(t.keys.file_delete)) delFile.mutate() }}
                className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-zinc-600">{t.keys.file_none}</span>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded-lg text-zinc-300 transition-colors"
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
                {uploading ? t.keys.file_uploading : t.keys.file_upload}
              </button>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept=".p12,.pfx"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {!editing && (
        <button
          onClick={() => { if (confirm(t.keys.confirm_delete)) del.mutate() }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={15} /> {t.keys.confirm_delete}
        </button>
      )}
    </div>
  )
}
