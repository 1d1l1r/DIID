import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trash2, Pencil, Check, X } from 'lucide-react'
import { documentsApi } from '../../lib/api/documents'
import { type Document, type DocumentType } from '../../lib/types'
import { CopyButton } from '../../components/common/CopyButton'
import { formatDate } from '../../lib/utils'
import { useT, getT, getDocTypeLabel } from '../../lib/i18n'
import toast from 'react-hot-toast'

const DOC_TYPES: DocumentType[] = ['id_card', 'passport', 'foreign_passport', 'driver_license']

type EditForm = {
  type: DocumentType
  country: string
  document_number: string
  iin: string
  issued_by: string
  issue_date: string
  expiry_date: string
  note: string
}

function docToForm(d: Document): EditForm {
  return {
    type: d.type,
    country: d.country ?? '',
    document_number: d.document_number ?? '',
    iin: d.iin ?? '',
    issued_by: d.issued_by ?? '',
    issue_date: d.issue_date ?? '',
    expiry_date: d.expiry_date ?? '',
    note: d.note ?? '',
  }
}

const inputCls = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors'

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const t = useT()
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)

  const { data: doc } = useQuery({ queryKey: ['document', id], queryFn: () => documentsApi.get(id!) })

  const del = useMutation({
    mutationFn: () => documentsApi.delete(id!),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['documents'] })
      navigate('/documents')
      toast.success(t.documents.ok_deleted)
    },
  })

  const update = useMutation({
    mutationFn: (data: Partial<Document>) => documentsApi.update(id!, data),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['document', id] })
      qc.invalidateQueries({ queryKey: ['documents'] })
      setEditing(false)
      toast.success(t.documents.ok_saved)
    },
  })

  if (!doc) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 rounded-full border-2 border-zinc-700 border-t-indigo-500 animate-spin" />
    </div>
  )

  function startEdit() {
    setEditForm(docToForm(doc!))
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setEditForm(null)
  }

  function saveEdit() {
    if (!editForm) return
    update.mutate({
      type: editForm.type,
      country: editForm.country || null,
      document_number: editForm.document_number || null,
      iin: editForm.iin || null,
      issued_by: editForm.issued_by || null,
      issue_date: editForm.issue_date || null,
      expiry_date: editForm.expiry_date || null,
      note: editForm.note || null,
    })
  }

  return (
    <div className="max-w-md">
      <button onClick={() => navigate('/documents')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 text-sm mb-4 transition-colors">
        <ArrowLeft size={15} /> {t.documents.title}
      </button>

      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 mb-4">
        {editing && editForm ? (
          <div className="space-y-3">
            <select
              value={editForm.type}
              onChange={e => setEditForm(f => f ? { ...f, type: e.target.value as DocumentType } : f)}
              className={inputCls}
            >
              {DOC_TYPES.map(dt => (
                <option key={dt} value={dt}>{getDocTypeLabel(t, dt)}</option>
              ))}
            </select>
            <input
              value={editForm.country}
              onChange={e => setEditForm(f => f ? { ...f, country: e.target.value } : f)}
              placeholder={t.common.country}
              className={inputCls}
            />
            <input
              value={editForm.document_number}
              onChange={e => setEditForm(f => f ? { ...f, document_number: e.target.value } : f)}
              placeholder={t.documents.doc_number}
              className={inputCls + ' font-mono'}
            />
            <input
              value={editForm.iin}
              onChange={e => setEditForm(f => f ? { ...f, iin: e.target.value } : f)}
              placeholder={t.profiles.iin}
              className={inputCls + ' font-mono'}
            />
            <input
              value={editForm.issued_by}
              onChange={e => setEditForm(f => f ? { ...f, issued_by: e.target.value } : f)}
              placeholder={t.documents.issued_by}
              className={inputCls}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">{t.documents.issued_label}</label>
                <input
                  type="date"
                  value={editForm.issue_date}
                  onChange={e => setEditForm(f => f ? { ...f, issue_date: e.target.value } : f)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">{t.documents.expires_label}</label>
                <input
                  type="date"
                  value={editForm.expiry_date}
                  onChange={e => setEditForm(f => f ? { ...f, expiry_date: e.target.value } : f)}
                  className={inputCls}
                />
              </div>
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
                disabled={update.isPending}
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
            <div className="flex items-center gap-2 mb-5">
              <span className="text-sm font-semibold text-zinc-100">{getDocTypeLabel(t, doc.type)}</span>
              {doc.country && <span className="text-xs text-zinc-500">{doc.country}</span>}
              <button onClick={startEdit} className="ml-auto p-1.5 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                <Pencil size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {doc.document_number && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{t.documents.doc_number}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-zinc-100 text-sm">{doc.document_number}</span>
                    <CopyButton value={doc.document_number} label={t.documents.doc_number} copyKey={`dn-${id}`} />
                  </div>
                </div>
              )}
              {doc.iin && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">ИИН</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-zinc-100 text-sm">{doc.iin}</span>
                    <CopyButton value={doc.iin} label="ИИН" copyKey={`iin-${id}`} />
                  </div>
                </div>
              )}
              {doc.issued_by && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs text-zinc-500 flex-shrink-0">{t.documents.issued_by}</span>
                  <div className="flex items-start gap-1 text-right min-w-0">
                    <span className="text-sm text-zinc-300 break-words">{doc.issued_by}</span>
                    <CopyButton value={doc.issued_by} label={t.documents.issued_by} copyKey={`isb-${id}`} className="flex-shrink-0 mt-0.5" />
                  </div>
                </div>
              )}
              {doc.issue_date && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{t.documents.issued_label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-zinc-300">{formatDate(doc.issue_date)}</span>
                    <CopyButton value={formatDate(doc.issue_date)} label={t.documents.issued_label} copyKey={`isd-${id}`} />
                  </div>
                </div>
              )}
              {doc.expiry_date && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{t.documents.expires_label}</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-medium ${new Date(doc.expiry_date) < new Date() ? 'text-red-400' : 'text-zinc-200'}`}>
                      {formatDate(doc.expiry_date)}
                    </span>
                    <CopyButton value={formatDate(doc.expiry_date)} label={t.documents.expires_label} copyKey={`expd-${id}`} />
                  </div>
                </div>
              )}
              {doc.note && (
                <div className="pt-2 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">{t.common.note}</p>
                  <p className="text-sm text-zinc-400">{doc.note}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {!editing && (
        <button
          onClick={() => { if (confirm(t.documents.confirm_delete)) del.mutate() }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={15} /> {t.documents.confirm_delete}
        </button>
      )}
    </div>
  )
}
