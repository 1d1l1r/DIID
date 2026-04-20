import { FileText } from 'lucide-react'
import type { Document } from '../../lib/types'
import { CopyButton } from '../common/CopyButton'
import { FieldReveal } from '../common/FieldReveal'
import { useVisibilityStore } from '../../features/visibility/visibilityStore'
import { formatDate } from '../../lib/utils'
import { useT, getDocTypeLabel } from '../../lib/i18n'

const TYPE_STYLES: Record<string, string> = {
  id_card: 'border-l-blue-500 bg-blue-500/5',
  passport: 'border-l-red-500 bg-red-500/5',
  foreign_passport: 'border-l-purple-500 bg-purple-500/5',
  driver_license: 'border-l-green-500 bg-green-500/5',
}

const TYPE_BADGE: Record<string, string> = {
  id_card: 'bg-blue-500/15 text-blue-400',
  passport: 'bg-red-500/15 text-red-400',
  foreign_passport: 'bg-purple-500/15 text-purple-400',
  driver_license: 'bg-green-500/15 text-green-400',
}

interface DocumentCardProps {
  doc: Document
  onClick?: () => void
}

export function DocumentCard({ doc, onClick }: DocumentCardProps) {
  const t = useT()
  const { getMode } = useVisibilityStore()
  const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date()
  const isSoonExpiring =
    doc.expiry_date &&
    !isExpired &&
    new Date(doc.expiry_date) < new Date(Date.now() + 90 * 86400_000)

  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border border-zinc-800 border-l-2 cursor-pointer
        hover:border-zinc-700 transition-colors
        ${TYPE_STYLES[doc.type] ?? 'border-l-zinc-600 bg-zinc-900'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[doc.type] ?? 'bg-zinc-800 text-zinc-400'}`}>
          {getDocTypeLabel(t, doc.type)}
        </span>
        {doc.country && (
          <span className="text-xs text-zinc-500">{doc.country}</span>
        )}
      </div>

      {/* Document number */}
      <div className="flex items-center gap-1.5 mb-2" onClick={e => e.stopPropagation()}>
        <FileText size={13} className="text-zinc-500 flex-shrink-0" />
        <FieldReveal
          value={doc.document_number}
          mode={getMode('documents.document_number')}
          label={t.documents.doc_number}
          copyKey={`doc-num-${doc.id}`}
        />
      </div>

      {/* IIN */}
      {doc.iin && (
        <div className="flex items-center gap-1.5 mb-2" onClick={e => e.stopPropagation()}>
          <span className="text-xs text-zinc-500 flex-shrink-0">{t.profiles.iin}:</span>
          <FieldReveal
            value={doc.iin}
            mode={getMode('profiles.iin')}
            label={t.profiles.iin}
            copyKey={`doc-iin-${doc.id}`}
          />
        </div>
      )}

      {/* Dates */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500" onClick={e => e.stopPropagation()}>
        {doc.issue_date && (
          <span className="flex items-center gap-1">
            {t.documents.issued_label} <span className="text-zinc-400">{formatDate(doc.issue_date)}</span>
            <CopyButton value={formatDate(doc.issue_date)} label={t.documents.issued_label} copyKey={`id-${doc.id}`} size={11} />
          </span>
        )}
        {doc.expiry_date && (
          <span className={`flex items-center gap-1 ${isExpired ? 'text-red-400' : isSoonExpiring ? 'text-amber-400' : ''}`}>
            {t.documents.expires_label} <span className="font-medium">{formatDate(doc.expiry_date)}</span>
            {isExpired && ` ${t.documents.expired}`}
            {isSoonExpiring && !isExpired && ` ${t.documents.expiring_soon}`}
            <CopyButton value={formatDate(doc.expiry_date)} label={t.documents.expires_label} copyKey={`ed-${doc.id}`} size={11} />
          </span>
        )}
      </div>

      {doc.issued_by && (
        <div className="mt-2 flex items-start gap-1" onClick={e => e.stopPropagation()}>
          <p className="text-xs text-zinc-500 leading-relaxed break-words min-w-0">{doc.issued_by}</p>
          <CopyButton value={doc.issued_by} label={t.documents.issued_label} copyKey={`isb-${doc.id}`} size={11} className="flex-shrink-0 mt-0.5" />
        </div>
      )}
    </div>
  )
}
