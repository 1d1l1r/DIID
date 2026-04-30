import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, UserMinus, UserPlus } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { useT } from '../../lib/i18n'
import { authApi } from '../../lib/api/auth'
import { useAuthStore } from '../../features/auth/authStore'
import toast from 'react-hot-toast'
import type { UserListItem } from '../../lib/types'

export function UsersPage() {
  const t = useT()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore(s => s.user)
  const isMaster = currentUser?.role === 'master'

  const [password, setPassword] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const { data: users = [] } = useQuery<UserListItem[]>({
    queryKey: ['users'],
    queryFn: authApi.listUsers,
    enabled: isMaster,
  })

  const addMutation = useMutation({
    mutationFn: () => authApi.createUser(password),
    onSuccess: () => {
      setPassword('')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(t.users.ok_added)
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail ?? ''
      if (detail.includes('limit')) toast.error(t.users.limit)
      else toast.error(t.users.err_add)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: authApi.deleteMe,
    onSuccess: () => {
      toast.success(t.users.ok_deleted)
      useAuthStore.getState().logout()
      navigate('/login', { replace: true })
    },
    onError: () => toast.error(t.users.err_delete),
  })

  return (
    <div className="max-w-lg">
      <PageHeader title={t.users.title} />

      {isMaster && (
        <>
          {/* User list */}
          <div className="space-y-2 mb-8">
            {users.map(u => (
              <div
                key={u.id}
                className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  {u.role === 'master'
                    ? <ShieldCheck size={15} className="text-amber-400" />
                    : <UserPlus size={15} className="text-zinc-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{u.username}</p>
                  <p className="text-xs text-zinc-500">
                    {u.role === 'master' ? t.users.role_master : t.users.role_member}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 text-zinc-600">({t.common.current_session})</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Add user form */}
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            {t.users.add_title}
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t.users.password_placeholder}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
            <button
              onClick={() => addMutation.mutate()}
              disabled={password.length < 8 || addMutation.isPending}
              className="px-4 py-2 rounded-lg bg-zinc-200 text-zinc-900 text-sm font-medium disabled:opacity-40 hover:bg-white transition-colors"
            >
              {addMutation.isPending ? t.users.adding : t.users.btn_add}
            </button>
          </div>
        </>
      )}

      {/* Delete own account (members only) */}
      {!isMaster && (
        <div className="mt-8 pt-6 border-t border-zinc-800">
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <UserMinus size={15} />
              {t.users.delete_account}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">{t.users.confirm_delete}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium disabled:opacity-40 hover:bg-red-400 transition-colors"
                >
                  {t.common.delete}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
                >
                  {t.common.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
