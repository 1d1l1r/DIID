import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Trash2, Pencil, Check, X, Plus, Loader2, MapPin,
} from 'lucide-react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import { stashesApi } from '../../lib/api/stashes'
import { parseCoords, formatCoords } from '../../lib/coordUtils'
import { useT, getT } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

const inputCls = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors'

type EditForm = { name: string; coords: string; description: string; note: string }

export function StashDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const t = useT()
  const fileRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [coordsError, setCoordsError] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [uploading, setUploading] = useState(false)

  const { data: stash } = useQuery({
    queryKey: ['stash', id],
    queryFn: () => stashesApi.get(id!),
  })

  const del = useMutation({
    mutationFn: () => stashesApi.delete(id!),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['stashes'] })
      navigate('/stashes')
      toast.success(t.stashes.ok_deleted)
    },
  })

  const update = useMutation({
    mutationFn: (data: Parameters<typeof stashesApi.update>[1]) => stashesApi.update(id!, data),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['stash', id] })
      qc.invalidateQueries({ queryKey: ['stashes'] })
      setEditing(false)
      setEditForm(null)
      toast.success(t.stashes.ok_saved)
    },
  })

  const delImage = useMutation({
    mutationFn: (imageId: string) => stashesApi.deleteImage(id!, imageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stash', id] })
      qc.invalidateQueries({ queryKey: ['stashes'] })
    },
  })

  if (!stash) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
    </div>
  )

  const hasCoords = stash.latitude !== null && stash.longitude !== null
  const coordStr = hasCoords ? formatCoords(stash.latitude!, stash.longitude!) : ''

  function startEdit() {
    setEditForm({
      name: stash!.name,
      coords: coordStr,
      description: stash!.description ?? '',
      note: stash!.note ?? '',
    })
    setCoordsError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setEditForm(null)
    setCoordsError('')
  }

  function handleCoordsBlur() {
    if (!editForm?.coords.trim()) { setCoordsError(''); return }
    const parsed = parseCoords(editForm.coords)
    if (parsed) {
      setEditForm(f => f ? { ...f, coords: formatCoords(parsed.lat, parsed.lon) } : f)
      setCoordsError('')
    } else {
      setCoordsError(t.stashes.coords_invalid)
    }
  }

  function saveEdit() {
    if (!editForm || !editForm.name.trim()) return
    let lat: number | null = null
    let lon: number | null = null
    if (editForm.coords.trim()) {
      const parsed = parseCoords(editForm.coords)
      if (!parsed) { setCoordsError(t.stashes.coords_invalid); return }
      lat = parsed.lat
      lon = parsed.lon
    }
    update.mutate({
      name: editForm.name.trim(),
      latitude: lat,
      longitude: lon,
      description: editForm.description.trim() || null,
      note: editForm.note.trim() || null,
    })
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t.stashes.image_only_img)
      return
    }
    setUploading(true)
    try {
      await stashesApi.uploadImage(id!, file)
      qc.invalidateQueries({ queryKey: ['stash', id] })
      qc.invalidateQueries({ queryKey: ['stashes'] })
    } catch {
      toast.error(t.stashes.image_only_img)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const slides = stash.images.map(img => ({
    src: stashesApi.getImageUrl(stash.id, img.id),
  }))

  return (
    <div className="max-w-lg">
      <button
        onClick={() => navigate('/stashes')}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 text-sm mb-4 transition-colors"
      >
        <ArrowLeft size={15} /> {t.stashes.title}
      </button>

      {/* Main info card */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 mb-4">
        {editing && editForm ? (
          <div className="space-y-3">
            <input
              autoFocus
              value={editForm.name}
              onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)}
              placeholder={t.stashes.name}
              className={inputCls}
            />
            <div>
              <input
                value={editForm.coords}
                onChange={e => { setEditForm(f => f ? { ...f, coords: e.target.value } : f); setCoordsError('') }}
                onBlur={handleCoordsBlur}
                placeholder={t.stashes.coords_placeholder}
                className={cn(inputCls, 'font-mono', coordsError && 'border-red-500/60')}
              />
              {coordsError && <p className="text-xs text-red-400 mt-1">{coordsError}</p>}
            </div>
            <textarea
              value={editForm.description}
              onChange={e => setEditForm(f => f ? { ...f, description: e.target.value } : f)}
              placeholder={t.stashes.description}
              rows={2}
              className={inputCls + ' resize-none'}
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
                disabled={!editForm.name.trim() || update.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <Check size={14} />
                {update.isPending ? t.common.saving : t.common.save}
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-sm transition-colors"
              >
                <X size={14} /> {t.common.cancel}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-100">{stash.name}</p>
                {hasCoords && (
                  <p className="text-xs text-emerald-500/80 font-mono mt-0.5">{coordStr}</p>
                )}
              </div>
              <button
                onClick={startEdit}
                className="p-1.5 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors flex-shrink-0"
              >
                <Pencil size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {stash.description && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">{t.stashes.description}</p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{stash.description}</p>
                </div>
              )}
              {stash.note && (
                <div className={cn(stash.description && 'pt-3 border-t border-zinc-800')}>
                  <p className="text-xs text-zinc-500 mb-1">{t.common.note}</p>
                  <p className="text-sm text-zinc-400 whitespace-pre-wrap">{stash.note}</p>
                </div>
              )}
              {!stash.description && !stash.note && !hasCoords && (
                <p className="text-xs text-zinc-600">{t.stashes.empty_desc}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Images section */}
      {!editing && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {t.stashes.images_section}
            </p>
            <span className="text-xs text-zinc-600">{stash.images.length}/{5}</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {stash.images.map((img, i) => (
              <div key={img.id} className="relative group aspect-square">
                <button
                  className="w-full h-full rounded-lg overflow-hidden bg-zinc-800 block"
                  onClick={() => setLightboxIndex(i)}
                >
                  <img
                    src={stashesApi.getImageUrl(stash.id, img.id)}
                    alt={img.file_name}
                    className="w-full h-full object-cover"
                  />
                </button>
                <button
                  onClick={() => {
                    if (confirm(t.stashes.image_delete)) delImage.mutate(img.id)
                  }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center bg-zinc-900/80 hover:bg-red-500/80 rounded-md text-zinc-300 hover:text-white transition-all"
                >
                  <X size={10} />
                </button>
              </div>
            ))}

            {stash.images.length < 5 && (
              <label className="aspect-square rounded-lg bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-zinc-500 flex items-center justify-center cursor-pointer transition-colors">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={uploading}
                />
                {uploading
                  ? <Loader2 size={18} className="text-zinc-500 animate-spin" />
                  : <Plus size={18} className="text-zinc-500" />
                }
              </label>
            )}
          </div>

          {stash.images.length === 0 && (
            <p className="text-xs text-zinc-600 mt-2">{t.stashes.image_max}</p>
          )}
        </div>
      )}

      {!editing && (
        <button
          onClick={() => { if (confirm(t.stashes.confirm_delete)) del.mutate() }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={15} /> {t.stashes.confirm_delete}
        </button>
      )}

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={slides}
        plugins={[Zoom]}
        zoom={{ maxZoomPixelRatio: 4 }}
        styles={{ container: { backgroundColor: 'rgba(0,0,0,0.92)' } }}
      />
    </div>
  )
}
