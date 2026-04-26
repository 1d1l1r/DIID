import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Plus, X, ChevronRight } from 'lucide-react'
import { stashesApi } from '../../lib/api/stashes'
import { parseCoords, formatCoords } from '../../lib/coordUtils'
import { useT, getT } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import type { Stash } from '../../lib/types'
import toast from 'react-hot-toast'

const inputCls = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors'

function StashCard({ stash }: { stash: Stash }) {
  const navigate = useNavigate()
  const hasCoords = stash.latitude !== null && stash.longitude !== null

  return (
    <div
      onClick={() => navigate(`/stashes/${stash.id}`)}
      className="group p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MapPin size={16} className="text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-zinc-100 truncate">{stash.name}</p>
            <ChevronRight size={15} className="text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
          </div>
          {hasCoords && (
            <p className="text-xs text-emerald-500/70 font-mono mt-0.5">
              {formatCoords(stash.latitude!, stash.longitude!)}
            </p>
          )}
          {stash.description && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{stash.description}</p>
          )}
        </div>
      </div>

      {stash.images.length > 0 && (
        <div className="flex gap-1.5 mt-3 pl-12">
          {stash.images.map(img => (
            <div
              key={img.id}
              className="w-10 h-10 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0"
            >
              <img
                src={stashesApi.getImageUrl(stash.id, img.id)}
                alt={img.file_name}
                className="w-full h-full object-cover"
                onClick={e => e.stopPropagation()}
              />
            </div>
          ))}
          {stash.images.length > 0 && (
            <div className="w-10 h-10 rounded-md bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-zinc-500">{stash.images.length}/5</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function StashesPage() {
  const t = useT()
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [coords, setCoords] = useState('')
  const [coordsError, setCoordsError] = useState('')

  const { data: stashes = [], isLoading } = useQuery({
    queryKey: ['stashes'],
    queryFn: stashesApi.list,
  })

  const create = useMutation({
    mutationFn: (data: Parameters<typeof stashesApi.create>[0]) => stashesApi.create(data),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['stashes'] })
      toast.success(t.stashes.ok_added)
      setAdding(false)
      setName('')
      setCoords('')
      setCoordsError('')
    },
  })

  function handleCoordsBlur() {
    if (!coords.trim()) { setCoordsError(''); return }
    const parsed = parseCoords(coords)
    if (parsed) {
      setCoords(formatCoords(parsed.lat, parsed.lon))
      setCoordsError('')
    } else {
      setCoordsError(t.stashes.coords_invalid)
    }
  }

  function handleSubmit() {
    if (!name.trim()) return
    let lat: number | null = null
    let lon: number | null = null
    if (coords.trim()) {
      const parsed = parseCoords(coords)
      if (!parsed) { setCoordsError(t.stashes.coords_invalid); return }
      lat = parsed.lat
      lon = parsed.lon
    }
    create.mutate({ name: name.trim(), latitude: lat, longitude: lon })
  }

  function cancelAdd() {
    setAdding(false)
    setName('')
    setCoords('')
    setCoordsError('')
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-zinc-100">{t.stashes.title}</h1>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          >
            <Plus size={15} /> {t.stashes.new_stash}
          </button>
        )}
      </div>

      {adding && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 mb-4 space-y-3">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t.stashes.name}
            className={inputCls}
          />
          <div>
            <input
              value={coords}
              onChange={e => { setCoords(e.target.value); setCoordsError('') }}
              onBlur={handleCoordsBlur}
              placeholder={t.stashes.coords_placeholder}
              className={cn(inputCls, coordsError && 'border-red-500/60')}
            />
            {coordsError && <p className="text-xs text-red-400 mt-1">{coordsError}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || create.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-lg text-white text-sm font-medium transition-colors"
            >
              {create.isPending ? t.common.adding : t.common.add}
            </button>
            <button
              onClick={cancelAdd}
              className="p-2 text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
        </div>
      ) : stashes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-3">
            <MapPin size={22} className="text-zinc-600" />
          </div>
          <p className="text-sm font-medium text-zinc-400">{t.stashes.empty_title}</p>
          <p className="text-xs text-zinc-600 mt-1">{t.stashes.empty_desc}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {stashes.map(stash => (
            <StashCard key={stash.id} stash={stash} />
          ))}
        </div>
      )}
    </div>
  )
}
