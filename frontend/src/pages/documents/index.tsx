import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, X, Check } from 'lucide-react'
import { profilesApi } from '../../lib/api/profiles'
import { documentsApi } from '../../lib/api/documents'
import { DocumentCard } from '../../components/documents/DocumentCard'
import { PageHeader } from '../../components/common/PageHeader'
import { EmptyState } from '../../components/common/EmptyState'
import { type DocumentType } from '../../lib/types'
import { useT, getT, getDocTypeLabel } from '../../lib/i18n'
import toast from 'react-hot-toast'

const DOC_TYPES: DocumentType[] = ['id_card', 'passport', 'foreign_passport', 'driver_license']
const inputCls = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors'

const initForm = () => ({
  profile_id: '',
  type: 'id_card' as DocumentType,
  country: '',
  document_number: '',
  iin: '',
  issued_by: '',
  issue_date: '',
  expiry_date: '',
  note: '',
})

export function DocumentsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const t = useT()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initForm)

  const { data: profiles = [] } = useQuery({ queryKey: ['profiles'], queryFn: () => profilesApi.list() })

  const docQueries = useQueries({
    queries: profiles.map(p => ({
      queryKey: ['documents', p.id],
      queryFn: () => documentsApi.listByProfile(p.id),
      enabled: profiles.length > 0,
    })),
  })

  const allDocs = docQueries.flatMap(q => q.data ?? [])
  const isLoading = docQueries.some(q => q.isLoading)

  const create = useMutation({
    mutationFn: () => documentsApi.create(form.profile_id, {
      type: form.type,
      country: form.country || null,
      document_number: form.document_number || null,
      iin: form.iin || null,
      issued_by: form.issued_by || null,
      issue_date: form.issue_date || null,
      expiry_date: form.expiry_date || null,
      note: form.note || null,
    }),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['documents', form.profile_id] })
      qc.invalidateQueries({ queryKey: ['profiles'] })
      setShowForm(false)
      setForm(initForm())
      toast.success(t.documents.ok_added)
    },
  })

  return (
    <div>
      <PageHeader
        title={t.documents.title}
        subtitle={allDocs.length > 0 ? `${allDocs.length}` : undefined}
        action={
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? t.common.cancel : t.common.add}
          </button>
        }
      />

      {/* Create form */}
      {showForm && (
        <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
          <p className="text-sm font-medium text-zinc-300">{t.documents.new_doc}</p>

          {/* Profile selector */}
          <select
            value={form.profile_id}
            onChange={e => setForm(f => ({ ...f, profile_id: e.target.value }))}
            className={inputCls}
          >
            <option value="">{t.documents.select_profile}</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {[p.last_name, p.first_name, p.middle_name].filter(Boolean).join(' ')}
              </option>
            ))}
          </select>

          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value as DocumentType }))}
            className={inputCls}
          >
            {DOC_TYPES.map(dt => <option key={dt} value={dt}>{getDocTypeLabel(t, dt)}</option>)}
          </select>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder={t.common.country} className={inputCls} />
            <input value={form.document_number} onChange={e => setForm(f => ({ ...f, document_number: e.target.value }))} placeholder={t.documents.doc_number} className={inputCls + ' font-mono'} />
            <input value={form.iin} onChange={e => setForm(f => ({ ...f, iin: e.target.value }))} placeholder={t.profiles.iin} className={inputCls + ' font-mono'} />
            <input value={form.issued_by} onChange={e => setForm(f => ({ ...f, issued_by: e.target.value }))} placeholder={t.documents.issued_by} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">{t.documents.issued_label}</label>
              <input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">{t.documents.expires_label}</label>
              <input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder={t.common.note} rows={2} className={inputCls + ' resize-none'} />

          <button
            onClick={() => create.mutate()}
            disabled={!form.profile_id || create.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <Check size={14} />
            {create.isPending ? t.common.adding : t.common.add}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-zinc-900 animate-pulse" />)}
        </div>
      )}

      {!isLoading && allDocs.length === 0 && !showForm && (
        <EmptyState icon={FileText} title={t.documents.empty_title} description={t.documents.empty_desc} />
      )}

      {!isLoading && allDocs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {allDocs.map(doc => (
            <DocumentCard key={doc.id} doc={doc} onClick={() => navigate(`/documents/${doc.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
