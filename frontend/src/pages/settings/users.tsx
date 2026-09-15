import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, UserPlus } from 'lucide-react'
import { isAxiosError } from 'axios'
import { PageHeader } from '../../components/common/PageHeader'
import { useT } from '../../lib/i18n'
import { authApi } from '../../lib/api/auth'
import { useAuthStore } from '../../features/auth/authStore'
import toast from 'react-hot-toast'
import type { UserListItem } from '../../lib/types'

const inputCls = 'w-full min-w-0 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500'
const buttonCls = 'px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-200 disabled:opacity-40'

function UserRow({ user }: { user: UserListItem }) {
  const t = useT()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [name, setName] = useState(user.username)
  const [password, setPassword] = useState('')
  const save = useMutation({
    mutationFn: () => authApi.updateUser(user.id, { username: name.trim(), ...(password ? { password } : {}) }),
    onSuccess: () => { setEditing(false); setPassword(''); void qc.invalidateQueries({ queryKey: ['users'] }); toast.success(t.users.ok_saved) },
    onError: error => toast.error(isAxiosError(error) && error.response?.status === 409 ? t.users.conflict : t.users.err_save),
  })
  const remove = useMutation({
    mutationFn: () => authApi.deleteUser(user.id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['users'] }); toast.success(t.users.ok_deleted) },
    onError: () => toast.error(t.users.err_delete),
  })
  return <article className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3" aria-label={user.username}>
    <div className="flex items-center gap-3">
      {user.role === 'master' ? <ShieldCheck size={18} className="text-amber-400 shrink-0" /> : <UserPlus size={18} className="text-zinc-400 shrink-0" />}
      <div className="min-w-0 flex-1"><p className="text-sm text-zinc-200 break-words">{user.username}</p><p className="text-xs text-zinc-500">{user.role === 'master' ? t.users.role_master : t.users.role_member}</p></div>
    </div>
    {user.role !== 'master' && !editing && !deleting && <div className="flex flex-wrap gap-2">
      <button className={buttonCls} onClick={() => { setName(user.username); setPassword(''); setEditing(true) }}>{t.users.edit}</button>
      <button className={buttonCls + ' text-red-400'} onClick={() => setDeleting(true)}>{t.common.delete}</button>
    </div>}
    {editing && <form className="space-y-3" onSubmit={e => { e.preventDefault(); save.mutate() }}>
      <label className="block text-xs text-zinc-400 space-y-1"><span>{t.users.name}</span><input className={inputCls} value={name} onChange={e => setName(e.target.value)} maxLength={64} required /></label>
      <label className="block text-xs text-zinc-400 space-y-1"><span>{t.users.reset_password}</span><input className={inputCls} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} /></label>
      <p className="text-xs text-zinc-500">{t.users.password_hint}</p>
      <div className="flex flex-wrap gap-2"><button className={buttonCls} disabled={save.isPending || !name.trim() || (password.length > 0 && password.length < 8)}>{t.common.save}</button><button className={buttonCls} type="button" disabled={save.isPending} onClick={() => { setEditing(false); setPassword('') }}>{t.common.cancel}</button></div>
    </form>}
    {deleting && <div className="space-y-3"><p className="text-sm text-zinc-300">{t.users.delete_member} <strong>{user.username}</strong></p><div className="flex flex-wrap gap-2"><button className={buttonCls + ' text-red-400'} disabled={remove.isPending} onClick={() => remove.mutate()}>{t.common.delete}</button><button className={buttonCls} disabled={remove.isPending} onClick={() => setDeleting(false)}>{t.common.cancel}</button></div></div>}
  </article>
}

export function UsersPage() {
  const t = useT()
  const qc = useQueryClient()
  const current = useAuthStore(s => s.user)
  const isMaster = current?.role === 'master'
  const [password, setPassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const { data: users = [], isLoading, isError } = useQuery({ queryKey: ['users'], queryFn: authApi.listUsers, enabled: isMaster })
  const add = useMutation({
    mutationFn: () => authApi.createUser(password),
    onSuccess: () => { setPassword(''); void qc.invalidateQueries({ queryKey: ['users'] }); toast.success(t.users.ok_added) },
    onError: error => {
      const detail = isAxiosError(error) ? error.response?.data?.detail : ''
      toast.error(typeof detail === 'string' && detail.includes('limit') ? t.users.limit : typeof detail === 'string' && detail.includes('already') ? t.users.conflict : t.users.err_add)
    },
  })
  const deleteSelf = useMutation({
    mutationFn: authApi.deleteMe,
    onSuccess: () => { useAuthStore.getState().logout(); toast.success(t.users.ok_deleted) },
    onError: () => toast.error(t.users.err_delete),
  })
  return <div className="max-w-lg">
    <PageHeader title={t.users.title} />
    {isMaster ? <>
      <p className="text-sm text-zinc-400 mb-4">{t.users.private_vaults}</p>
      {isLoading && <p className="text-sm text-zinc-500">…</p>}
      {isError && <p role="alert" className="text-sm text-red-400">{t.users.err_load}</p>}
      <div className="space-y-3 mb-6">{users.map(user => <UserRow key={user.id} user={user} />)}</div>
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); add.mutate() }}>
        <label className="block text-sm text-zinc-300 space-y-2"><span>{t.users.add_title}</span><input className={inputCls} type="password" autoComplete="new-password" placeholder={t.users.password_placeholder} value={password} onChange={e => setPassword(e.target.value)} minLength={8} required /></label>
        <button className={buttonCls} disabled={password.length < 8 || add.isPending}>{add.isPending ? t.users.adding : t.users.btn_add}</button>
      </form>
    </> : <div className="space-y-3">
      <p className="text-sm text-zinc-400">{t.users.private_vaults}</p>
      {!deleting ? <button className={buttonCls + ' text-red-400'} onClick={() => setDeleting(true)}>{t.users.delete_account}</button> : <>
        <p className="text-sm text-zinc-400">{t.users.confirm_delete}</p>
        <div className="flex gap-2"><button className={buttonCls + ' text-red-400'} disabled={deleteSelf.isPending} onClick={() => deleteSelf.mutate()}>{t.common.delete}</button><button className={buttonCls} disabled={deleteSelf.isPending} onClick={() => setDeleting(false)}>{t.common.cancel}</button></div>
      </>}
    </div>}
  </div>
}
