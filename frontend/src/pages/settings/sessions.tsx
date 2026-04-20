import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Monitor, Trash2 } from 'lucide-react'
import { authApi } from '../../lib/api/auth'
import { PageHeader } from '../../components/common/PageHeader'
import { useT } from '../../lib/i18n'
import toast from 'react-hot-toast'

export function SessionsPage() {
  const t = useT()
  const qc = useQueryClient()
  const { data: sessions = [] } = useQuery({ queryKey: ['sessions'], queryFn: authApi.sessions })

  const revoke = useMutation({
    mutationFn: (id: string) => authApi.revokeSession(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sessions'] }); toast.success(t.sessions.ok_revoked) },
  })

  return (
    <div className="max-w-lg">
      <PageHeader title={t.sessions.title} subtitle={`${sessions.length}`} />
      <div className="space-y-2">
        {sessions.map(s => (
          <div key={s.id} className={`flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border ${s.is_current ? 'border-indigo-500/40' : 'border-zinc-800'}`}>
            <Monitor size={18} className="text-zinc-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-200 truncate">
                {s.device_name || t.common.unknown_device}
                {s.is_current && <span className="ml-2 text-xs text-indigo-400 font-medium">{t.common.current_session}</span>}
              </p>
              <p className="text-xs text-zinc-600">{s.ip || '—'} · {new Date(s.last_seen_at).toLocaleString()}</p>
            </div>
            {!s.is_current && (
              <button
                onClick={() => revoke.mutate(s.id)}
                className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
