import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, User, FileText, CreditCard, KeyRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../../lib/api/search'
import { useDebounce } from '../../hooks/useDebounce'
import { useT, getDocTypeLabel } from '../../lib/i18n'

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const t = useT()
  const [q, setQ] = useState('')
  const debounced = useDebounce(q, 280)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchApi.search(debounced),
    enabled: debounced.length >= 2,
  })

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 40) }
    else { setQ('') }
  }, [open])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); open ? onClose() : null }
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, onClose])

  if (!open) return null

  const go = (path: string) => { navigate(path); onClose() }

  const total = data
    ? data.profiles.length + data.documents.length + data.cards.length + data.passwords.length
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800">
          <Search size={16} className="text-zinc-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t.search.placeholder}
            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 outline-none text-sm"
          />
          {q && (
            <button onClick={() => setQ('')} className="text-zinc-500 hover:text-zinc-300 p-0.5">
              <X size={14} />
            </button>
          )}
          <kbd className="text-zinc-600 text-xs border border-zinc-700 rounded px-1.5 py-0.5 leading-none">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">
          {debounced.length < 2 && (
            <p className="text-zinc-600 text-sm text-center py-10">{t.search.hint}</p>
          )}
          {debounced.length >= 2 && total === 0 && (
            <p className="text-zinc-600 text-sm text-center py-10">{t.search.empty}</p>
          )}

          <div className="p-2 space-y-1">
            {data?.profiles.map(p => (
              <button
                key={p.id}
                onClick={() => go(`/profiles/${p.id}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-left"
              >
                <User size={15} className="text-indigo-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{p.full_name}</p>
                  {(p.iin || p.phone) && (
                    <p className="text-xs text-zinc-500 font-mono truncate">{p.iin || p.phone}</p>
                  )}
                </div>
                <span className="ml-auto text-xs text-zinc-600 flex-shrink-0">{t.search.tag_profile}</span>
              </button>
            ))}

            {data?.documents.map(d => (
              <button
                key={d.id}
                onClick={() => go(`/documents/${d.id}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-left"
              >
                <FileText size={15} className="text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{getDocTypeLabel(t, d.type)}</p>
                  {d.document_number && (
                    <p className="text-xs text-zinc-500 font-mono">{d.document_number}</p>
                  )}
                </div>
                <span className="ml-auto text-xs text-zinc-600 flex-shrink-0">{t.search.tag_document}</span>
              </button>
            ))}

            {data?.cards.map(c => (
              <button
                key={c.id}
                onClick={() => go(`/cards/${c.id}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-left"
              >
                <CreditCard size={15} className="text-emerald-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{c.bank_name}</p>
                  {c.card_last_four && (
                    <p className="text-xs text-zinc-500 font-mono">•••• {c.card_last_four}</p>
                  )}
                </div>
                <span className="ml-auto text-xs text-zinc-600 flex-shrink-0">{t.search.tag_card}</span>
              </button>
            ))}

            {data?.passwords.map(p => (
              <button
                key={p.id}
                onClick={() => go(`/passwords/${p.id}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-left"
              >
                <KeyRound size={15} className="text-amber-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{p.title}</p>
                  {p.login && <p className="text-xs text-zinc-500 font-mono truncate">{p.login}</p>}
                </div>
                <span className="ml-auto text-xs text-zinc-600 flex-shrink-0">{t.search.tag_password}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
