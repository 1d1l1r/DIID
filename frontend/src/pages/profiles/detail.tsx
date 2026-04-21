import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FileText, CreditCard, KeyRound, KeySquare, Trash2, Pencil, Check, X, Plus, Eye, EyeOff } from 'lucide-react'
import { profilesApi } from '../../lib/api/profiles'
import { documentsApi } from '../../lib/api/documents'
import { cardsApi } from '../../lib/api/cards'
import { passwordsApi } from '../../lib/api/passwords'
import { keysApi } from '../../lib/api/keys'
import { DocumentCard } from '../../components/documents/DocumentCard'
import { BankCard, getCardColorOptions } from '../../components/cards/BankCard'
import { PasswordItem } from '../../components/passwords/PasswordItem'
import { KeyItem } from '../../components/passwords/KeyItem'
import { CopyButton } from '../../components/common/CopyButton'
import { FieldReveal } from '../../components/common/FieldReveal'
import { useVisibilityStore } from '../../features/visibility/visibilityStore'
import { fullName, initials, type Profile, type DocumentType } from '../../lib/types'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'
import { useT, getT, getDocTypeLabel } from '../../lib/i18n'

const DOC_TYPES: DocumentType[] = ['id_card', 'passport', 'foreign_passport', 'driver_license']

// ─── edit profile form ───────────────────────────────────────────────────────
type ProfileEditForm = {
  last_name: string; first_name: string; middle_name: string
  iin: string; phone: string; birth_date: string; address: string; note: string; tags: string
}
function profileToForm(p: Profile): ProfileEditForm {
  return {
    last_name: p.last_name, first_name: p.first_name, middle_name: p.middle_name ?? '',
    iin: p.iin ?? '', phone: p.phone ?? '', birth_date: p.birth_date ?? '',
    address: p.address ?? '', note: p.note ?? '', tags: p.tags.join(', '),
  }
}

// ─── create forms ────────────────────────────────────────────────────────────
const initDocForm = () => ({ type: 'id_card' as DocumentType, country: '', document_number: '', iin: '', issued_by: '', issue_date: '', expiry_date: '', note: '' })
const initCardForm = () => ({ bank_name: '', card_number: '', expiry_date: '', cardholder_name: '', cvv: '', color_theme: 'blue', note: '' })
const initPwdForm = () => ({ title: '', login: '', password: '', url: '', category: '', note: '' })
const initKeyForm = () => ({ name: '', password: '' })

const inputCls = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors'
const btnPrimary = 'flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-white text-sm font-medium transition-colors'
const btnSecondary = 'flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-sm transition-colors'

export function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const t = useT()
  const cardColorOptions = getCardColorOptions(t)

  const [tab, setTab] = useState('documents')
  const [showCreate, setShowCreate] = useState(false)

  // profile edit
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<ProfileEditForm | null>(null)

  // create forms
  const [docForm, setDocForm] = useState(initDocForm)
  const [cardForm, setCardForm] = useState(initCardForm)
  const [pwdForm, setPwdForm] = useState(initPwdForm)
  const [keyForm, setKeyForm] = useState(initKeyForm)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showNewKeyPwd, setShowNewKeyPwd] = useState(false)

  // ── queries ──────────────────────────────────────────────────────────────
  const { data: profile } = useQuery({ queryKey: ['profile', id], queryFn: () => profilesApi.get(id!) })
  const { getMode } = useVisibilityStore()
  const { data: documents = [] } = useQuery({ queryKey: ['documents', id], queryFn: () => documentsApi.listByProfile(id!) })
  const { data: cards = [] } = useQuery({ queryKey: ['cards', id], queryFn: () => cardsApi.listByProfile(id!) })
  const { data: passwords = [] } = useQuery({ queryKey: ['passwords', id], queryFn: () => passwordsApi.list({ profile_id: id }) })
  const { data: profileKeys = [] } = useQuery({ queryKey: ['keys', id], queryFn: () => keysApi.listByProfile(id!) })

  // ── profile mutations ─────────────────────────────────────────────────────
  const deleteProfile = useMutation({
    mutationFn: () => profilesApi.delete(id!),
    onSuccess: () => { const t = getT(); qc.invalidateQueries({ queryKey: ['profiles'] }); navigate('/profiles'); toast.success(t.profiles.ok_deleted) },
  })
  const updateProfile = useMutation({
    mutationFn: (data: Partial<Profile>) => profilesApi.update(id!, data),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['profile', id] })
      qc.invalidateQueries({ queryKey: ['profiles'] })
      setEditing(false); toast.success(t.profiles.ok_saved)
    },
  })

  // ── create mutations ──────────────────────────────────────────────────────
  const createDoc = useMutation({
    mutationFn: () => documentsApi.create(id!, {
      type: docForm.type,
      country: docForm.country || null,
      document_number: docForm.document_number || null,
      iin: docForm.iin || null,
      issued_by: docForm.issued_by || null,
      issue_date: docForm.issue_date || null,
      expiry_date: docForm.expiry_date || null,
      note: docForm.note || null,
    }),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['documents', id] })
      qc.invalidateQueries({ queryKey: ['profiles'] })
      setShowCreate(false); setDocForm(initDocForm()); toast.success(t.documents.ok_added)
    },
  })

  const createCard = useMutation({
    mutationFn: () => {
      const cardNum = cardForm.card_number.replace(/\s/g, '')
      return cardsApi.create(id!, {
        bank_name: cardForm.bank_name,
        card_number: cardNum || null,
        card_last_four: cardNum ? cardNum.slice(-4) : null,
        expiry_date: cardForm.expiry_date || null,
        cardholder_name: cardForm.cardholder_name || null,
        cvv: cardForm.cvv || null,
        color_theme: cardForm.color_theme,
        note: cardForm.note || null,
      })
    },
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['cards', id] })
      qc.invalidateQueries({ queryKey: ['profiles'] })
      setShowCreate(false); setCardForm(initCardForm()); toast.success(t.cards.ok_added)
    },
  })

  const createPwd = useMutation({
    mutationFn: () => passwordsApi.create({
      profile_id: id,
      title: pwdForm.title,
      login: pwdForm.login || null,
      password: pwdForm.password || null,
      url: pwdForm.url || null,
      category: pwdForm.category || null,
      note: pwdForm.note || null,
      is_shared: false,
    }),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['passwords', id] })
      qc.invalidateQueries({ queryKey: ['profiles'] })
      setShowCreate(false); setPwdForm(initPwdForm()); setShowNewPwd(false); toast.success(t.passwords.ok_added)
    },
  })

  const createKey = useMutation({
    mutationFn: () => keysApi.create({
      profile_id: id,
      name: keyForm.name,
      password: keyForm.password || null,
    }),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['keys', id] })
      setShowCreate(false); setKeyForm(initKeyForm()); setShowNewKeyPwd(false); toast.success(t.keys.ok_added)
    },
  })

  // ─────────────────────────────────────────────────────────────────────────
  if (!profile) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 rounded-full border-2 border-zinc-700 border-t-indigo-500 animate-spin" />
    </div>
  )

  const name = fullName(profile)
  const ini = initials(profile)

  function startEdit() { setEditForm(profileToForm(profile!)); setEditing(true) }
  function cancelEdit() { setEditing(false); setEditForm(null) }
  function saveEdit() {
    if (!editForm) return
    const tags = editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    updateProfile.mutate({
      last_name: editForm.last_name, first_name: editForm.first_name,
      middle_name: editForm.middle_name || null, iin: editForm.iin || null,
      phone: editForm.phone || null, birth_date: editForm.birth_date || null,
      address: editForm.address || null, note: editForm.note || null, tags,
    })
  }
  function field(key: keyof ProfileEditForm) {
    return {
      value: editForm?.[key] ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setEditForm(f => f ? { ...f, [key]: e.target.value } : f),
    }
  }

  function switchTab(key: string) { setTab(key); setShowCreate(false) }

  const TABS = [
    { key: 'documents', label: t.profiles.tab_docs, icon: FileText },
    { key: 'cards', label: t.profiles.tab_cards, icon: CreditCard },
    { key: 'passwords', label: t.profiles.tab_passwords, icon: KeyRound },
    { key: 'keys', label: t.profiles.tab_keys, icon: KeySquare },
  ]

  // ── create form content per tab ───────────────────────────────────────────
  const isPendingCreate = createDoc.isPending || createCard.isPending || createPwd.isPending || createKey.isPending

  const docCreateForm = (
    <div className="mb-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
      <p className="text-sm font-medium text-zinc-300">{t.documents.new_doc}</p>
      <select value={docForm.type} onChange={e => setDocForm(f => ({ ...f, type: e.target.value as DocumentType }))} className={inputCls}>
        {DOC_TYPES.map(dt => <option key={dt} value={dt}>{getDocTypeLabel(t, dt)}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input value={docForm.country} onChange={e => setDocForm(f => ({ ...f, country: e.target.value }))} placeholder={t.common.country} className={inputCls} />
        <input value={docForm.document_number} onChange={e => setDocForm(f => ({ ...f, document_number: e.target.value }))} placeholder={t.documents.doc_number} className={inputCls + ' font-mono'} />
        <input value={docForm.iin} onChange={e => setDocForm(f => ({ ...f, iin: e.target.value }))} placeholder={t.profiles.iin} className={inputCls + ' font-mono'} />
        <input value={docForm.issued_by} onChange={e => setDocForm(f => ({ ...f, issued_by: e.target.value }))} placeholder={t.documents.issued_by} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-zinc-500 mb-1 block">{t.documents.issue_date}</label>
          <input type="date" value={docForm.issue_date} onChange={e => setDocForm(f => ({ ...f, issue_date: e.target.value }))} className={inputCls} /></div>
        <div><label className="text-xs text-zinc-500 mb-1 block">{t.documents.expiry_date}</label>
          <input type="date" value={docForm.expiry_date} onChange={e => setDocForm(f => ({ ...f, expiry_date: e.target.value }))} className={inputCls} /></div>
      </div>
      <textarea value={docForm.note} onChange={e => setDocForm(f => ({ ...f, note: e.target.value }))} placeholder={t.common.note} rows={2} className={inputCls + ' resize-none'} />
      <div className="flex gap-2">
        <button onClick={() => createDoc.mutate()} disabled={isPendingCreate} className={btnPrimary}><Check size={14} />{createDoc.isPending ? t.common.adding : t.common.add}</button>
        <button onClick={() => setShowCreate(false)} className={btnSecondary}><X size={14} />{t.common.cancel}</button>
      </div>
    </div>
  )

  const cardCreateForm = (
    <div className="mb-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
      <p className="text-sm font-medium text-zinc-300">{t.cards.new_card}</p>
      <input value={cardForm.bank_name} onChange={e => setCardForm(f => ({ ...f, bank_name: e.target.value }))} placeholder={t.cards.bank_name + ' *'} className={inputCls} />
      <input value={cardForm.card_number} onChange={e => setCardForm(f => ({ ...f, card_number: e.target.value }))} placeholder={t.cards.card_number} className={inputCls + ' font-mono'} />
      <div className="grid grid-cols-2 gap-3">
        <input value={cardForm.expiry_date} onChange={e => setCardForm(f => ({ ...f, expiry_date: e.target.value }))} placeholder={t.cards.expiry} className={inputCls + ' font-mono'} />
        <input value={cardForm.cvv} onChange={e => setCardForm(f => ({ ...f, cvv: e.target.value }))} placeholder={t.cards.cvv} className={inputCls + ' font-mono'} />
      </div>
      <input value={cardForm.cardholder_name} onChange={e => setCardForm(f => ({ ...f, cardholder_name: e.target.value }))} placeholder={t.cards.holder} className={inputCls} />
      <div>
        <p className="text-xs text-zinc-500 mb-2">{t.cards.color}</p>
        <div className="flex gap-2 flex-wrap">
          {cardColorOptions.map(({ value, label }) => (
            <button key={value} type="button" onClick={() => setCardForm(f => ({ ...f, color_theme: value }))}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${cardForm.color_theme === value ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <textarea value={cardForm.note} onChange={e => setCardForm(f => ({ ...f, note: e.target.value }))} placeholder={t.common.note} rows={2} className={inputCls + ' resize-none'} />
      <div className="flex gap-2">
        <button onClick={() => createCard.mutate()} disabled={!cardForm.bank_name || isPendingCreate} className={btnPrimary}><Check size={14} />{createCard.isPending ? t.common.adding : t.common.add}</button>
        <button onClick={() => setShowCreate(false)} className={btnSecondary}><X size={14} />{t.common.cancel}</button>
      </div>
    </div>
  )

  const pwdCreateForm = (
    <div className="mb-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
      <p className="text-sm font-medium text-zinc-300">{t.passwords.new_pwd}</p>
      <input value={pwdForm.title} onChange={e => setPwdForm(f => ({ ...f, title: e.target.value }))} placeholder={t.passwords.service + ' *'} className={inputCls} />
      <input value={pwdForm.login} onChange={e => setPwdForm(f => ({ ...f, login: e.target.value }))} placeholder={t.passwords.login} className={inputCls} />
      <div className="relative">
        <input type={showNewPwd ? 'text' : 'password'} value={pwdForm.password} onChange={e => setPwdForm(f => ({ ...f, password: e.target.value }))} placeholder={t.passwords.password} className={inputCls + ' pr-10 font-mono'} />
        <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
          {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input value={pwdForm.url} onChange={e => setPwdForm(f => ({ ...f, url: e.target.value }))} placeholder={t.passwords.url} className={inputCls} />
        <input value={pwdForm.category} onChange={e => setPwdForm(f => ({ ...f, category: e.target.value }))} placeholder={t.passwords.category} className={inputCls} />
      </div>
      <textarea value={pwdForm.note} onChange={e => setPwdForm(f => ({ ...f, note: e.target.value }))} placeholder={t.common.note} rows={2} className={inputCls + ' resize-none'} />
      <div className="flex gap-2">
        <button onClick={() => createPwd.mutate()} disabled={!pwdForm.title || isPendingCreate} className={btnPrimary}><Check size={14} />{createPwd.isPending ? t.common.adding : t.common.add}</button>
        <button onClick={() => setShowCreate(false)} className={btnSecondary}><X size={14} />{t.common.cancel}</button>
      </div>
    </div>
  )

  const keyCreateForm = (
    <div className="mb-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
      <p className="text-sm font-medium text-zinc-300">{t.keys.new_key}</p>
      <input value={keyForm.name} onChange={e => setKeyForm(f => ({ ...f, name: e.target.value }))} placeholder={t.keys.name} className={inputCls} />
      <div className="relative">
        <input type={showNewKeyPwd ? 'text' : 'password'} value={keyForm.password} onChange={e => setKeyForm(f => ({ ...f, password: e.target.value }))} placeholder={t.keys.password} className={inputCls + ' pr-10 font-mono'} />
        <button type="button" onClick={() => setShowNewKeyPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
          {showNewKeyPwd ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={() => createKey.mutate()} disabled={!keyForm.name || isPendingCreate} className={btnPrimary}><Check size={14} />{createKey.isPending ? t.common.adding : t.common.add}</button>
        <button onClick={() => setShowCreate(false)} className={btnSecondary}><X size={14} />{t.common.cancel}</button>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl">
      {/* Back */}
      <button onClick={() => navigate('/profiles')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 text-sm mb-4 transition-colors">
        <ArrowLeft size={15} /> {t.profiles.title}
      </button>

      {/* Profile header */}
      <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
        {editing && editForm ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input {...field('last_name')} placeholder={t.profiles.last_name + ' *'} className={inputCls} />
              <input {...field('first_name')} placeholder={t.profiles.first_name + ' *'} className={inputCls} />
              <input {...field('middle_name')} placeholder={t.profiles.middle_name} className={inputCls} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input {...field('iin')} placeholder={t.profiles.iin} className={inputCls} />
              <input {...field('phone')} placeholder={t.profiles.phone} className={inputCls} />
              <input {...field('birth_date')} type="date" className={inputCls} />
              <input {...field('address')} placeholder={t.profiles.address} className={inputCls} />
            </div>
            <textarea {...field('note')} placeholder={t.common.note} rows={2} className={inputCls + ' resize-none'} />
            <input {...field('tags')} placeholder={t.common.tags} className={inputCls} />
            <div className="flex gap-2 pt-1">
              <button onClick={saveEdit} disabled={!editForm.last_name || !editForm.first_name || updateProfile.isPending} className={btnPrimary}>
                <Check size={14} />{updateProfile.isPending ? t.common.saving : t.common.save}
              </button>
              <button onClick={cancelEdit} className={btnSecondary}><X size={14} />{t.common.cancel}</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-semibold">{ini}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <h1 className="text-xl font-semibold text-zinc-100">{name}</h1>
                <CopyButton value={name} label={t.common.profile} copyKey={`name-${id}`} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {profile.iin && (
                  <span className="flex items-center gap-1 text-zinc-400">
                    {t.profiles.iin}:
                    <FieldReveal
                      value={profile.iin}
                      mode={getMode('profiles.iin')}
                      label={t.profiles.iin}
                      copyKey={`iin-${id}`}
                    />
                  </span>
                )}
                {profile.phone && (
                  <span className="flex items-center gap-1 text-zinc-400">
                    <span className="font-mono">{profile.phone}</span>
                    <CopyButton value={profile.phone} label={t.profiles.phone} copyKey={`phone-${id}`} />
                  </span>
                )}
                {profile.birth_date && <span className="text-zinc-500">{formatDate(profile.birth_date)}</span>}
              </div>
              {profile.address && <p className="text-xs text-zinc-600 mt-1 truncate">{profile.address}</p>}
              {profile.note && <p className="text-xs text-zinc-500 mt-1 italic">{profile.note}</p>}
              {profile.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {profile.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={startEdit} className="p-2 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                <Pencil size={15} />
              </button>
              <button onClick={() => { if (confirm(t.profiles.confirm_delete)) deleteProfile.mutate() }}
                className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-zinc-800 pb-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
            <span className="text-xs">
              {key === 'documents' ? documents.length : key === 'cards' ? cards.length : key === 'passwords' ? passwords.length : profileKeys.length}
            </span>
          </button>
        ))}
        <button
          onClick={() => setShowCreate(v => !v)}
          className={`ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showCreate
              ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {showCreate ? <X size={13} /> : <Plus size={13} />}
          <span className="hidden sm:inline">{showCreate ? t.common.cancel : t.common.add}</span>
        </button>
      </div>

      {/* Tab content */}
      {tab === 'documents' && (
        <div>
          {showCreate && docCreateForm}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents.map(d => <DocumentCard key={d.id} doc={d} onClick={() => navigate(`/documents/${d.id}`)} />)}
            {documents.length === 0 && !showCreate && <p className="text-zinc-600 text-sm">{t.profiles.tab_docs}</p>}
          </div>
        </div>
      )}
      {tab === 'cards' && (
        <div>
          {showCreate && cardCreateForm}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            {cards.map(c => <BankCard key={c.id} card={c} onClick={() => navigate(`/cards/${c.id}`)} />)}
            {cards.length === 0 && !showCreate && <p className="text-zinc-600 text-sm">{t.profiles.tab_cards}</p>}
          </div>
        </div>
      )}
      {tab === 'passwords' && (
        <div>
          {showCreate && pwdCreateForm}
          <div className="space-y-2">
            {passwords.map(p => <PasswordItem key={p.id} entry={p} onClick={() => navigate(`/passwords/${p.id}`)} />)}
            {passwords.length === 0 && !showCreate && <p className="text-zinc-600 text-sm">{t.profiles.tab_passwords}</p>}
          </div>
        </div>
      )}
      {tab === 'keys' && (
        <div>
          {showCreate && keyCreateForm}
          <div className="space-y-2">
            {profileKeys.map(k => <KeyItem key={k.id} entry={k} onClick={() => navigate(`/keys/${k.id}`)} />)}
            {profileKeys.length === 0 && !showCreate && <p className="text-zinc-600 text-sm">{t.profiles.tab_keys}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
