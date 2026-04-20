import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, X } from 'lucide-react'
import { profilesApi } from '../../lib/api/profiles'
import { ProfileCard } from '../../components/profiles/ProfileCard'
import { PageHeader } from '../../components/common/PageHeader'
import { EmptyState } from '../../components/common/EmptyState'
import toast from 'react-hot-toast'
import { useT, getT } from '../../lib/i18n'

export function ProfilesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const t = useT()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ last_name: '', first_name: '', middle_name: '', iin: '', phone: '' })

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profilesApi.list(),
  })

  const create = useMutation({
    mutationFn: () => profilesApi.create(form),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['profiles'] })
      setShowForm(false)
      setForm({ last_name: '', first_name: '', middle_name: '', iin: '', phone: '' })
      toast.success(t.profiles.ok_saved)
    },
  })

  return (
    <div>
      <PageHeader
        title={t.profiles.title}
        subtitle={profiles.length > 0 ? `${profiles.length}` : undefined}
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

      {/* Create form */}
      {showForm && (
        <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
          <p className="text-sm font-medium text-zinc-300 mb-3">{t.profiles.new_profile}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { key: 'last_name', placeholder: t.profiles.last_name },
              { key: 'first_name', placeholder: t.profiles.first_name },
              { key: 'middle_name', placeholder: t.profiles.middle_name },
              { key: 'iin', placeholder: t.profiles.iin },
              { key: 'phone', placeholder: t.profiles.phone },
            ].map(({ key, placeholder }) => (
              <input
                key={key}
                placeholder={placeholder}
                value={(form as never)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors"
              />
            ))}
          </div>
          <button
            onClick={() => create.mutate()}
            disabled={!form.last_name || !form.first_name || create.isPending}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-white text-sm font-medium transition-colors"
          >
            {create.isPending ? t.common.adding : t.common.add}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && profiles.length === 0 && !showForm && (
        <EmptyState icon={Users} title={t.profiles.empty_title} description={t.profiles.empty_desc} />
      )}

      {!isLoading && profiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {profiles.map(p => (
            <ProfileCard key={p.id} profile={p} onClick={() => navigate(`/profiles/${p.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
