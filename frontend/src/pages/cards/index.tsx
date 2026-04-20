import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Plus, X, Check } from 'lucide-react'
import { profilesApi } from '../../lib/api/profiles'
import { cardsApi } from '../../lib/api/cards'
import { BankCard, getCardColorOptions } from '../../components/cards/BankCard'
import { PageHeader } from '../../components/common/PageHeader'
import { EmptyState } from '../../components/common/EmptyState'
import { useT, getT } from '../../lib/i18n'
import toast from 'react-hot-toast'

const inputCls = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors'

const initForm = () => ({
  profile_id: '',
  bank_name: '',
  card_number: '',
  expiry_date: '',
  cardholder_name: '',
  cvv: '',
  color_theme: 'blue',
  note: '',
})

export function CardsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const t = useT()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initForm)

  const { data: profiles = [] } = useQuery({ queryKey: ['profiles'], queryFn: () => profilesApi.list() })

  const cardQueries = useQueries({
    queries: profiles.map(p => ({
      queryKey: ['cards', p.id],
      queryFn: () => cardsApi.listByProfile(p.id),
      enabled: profiles.length > 0,
    })),
  })

  const allCards = cardQueries.flatMap(q => q.data ?? [])
  const isLoading = cardQueries.some(q => q.isLoading)

  const create = useMutation({
    mutationFn: () => {
      const cardNum = form.card_number.replace(/\s/g, '')
      return cardsApi.create(form.profile_id, {
        bank_name: form.bank_name,
        card_number: cardNum || null,
        card_last_four: cardNum ? cardNum.slice(-4) : null,
        expiry_date: form.expiry_date || null,
        cardholder_name: form.cardholder_name || null,
        cvv: form.cvv || null,
        color_theme: form.color_theme,
        note: form.note || null,
      })
    },
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['cards', form.profile_id] })
      qc.invalidateQueries({ queryKey: ['profiles'] })
      setShowForm(false)
      setForm(initForm())
      toast.success(t.cards.ok_added)
    },
  })

  const cardColorOptions = getCardColorOptions(t)

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={t.cards.title}
        subtitle={allCards.length > 0 ? `${allCards.length}` : undefined}
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
          <p className="text-sm font-medium text-zinc-300">{t.cards.new_card}</p>

          {/* Profile selector */}
          <select
            value={form.profile_id}
            onChange={e => setForm(f => ({ ...f, profile_id: e.target.value }))}
            className={inputCls}
          >
            <option value="">{t.cards.select_profile}</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {[p.last_name, p.first_name, p.middle_name].filter(Boolean).join(' ')}
              </option>
            ))}
          </select>

          <input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} placeholder={`${t.cards.bank_name} *`} className={inputCls} />
          <input value={form.card_number} onChange={e => setForm(f => ({ ...f, card_number: e.target.value }))} placeholder={t.cards.card_number} className={inputCls + ' font-mono'} />

          <div className="grid grid-cols-2 gap-3">
            <input value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} placeholder="MM/YY" className={inputCls + ' font-mono'} />
            <input value={form.cvv} onChange={e => setForm(f => ({ ...f, cvv: e.target.value }))} placeholder={t.cards.cvv} className={inputCls + ' font-mono'} />
          </div>

          <input value={form.cardholder_name} onChange={e => setForm(f => ({ ...f, cardholder_name: e.target.value }))} placeholder={t.cards.holder} className={inputCls} />

          {/* Color picker */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">{t.cards.color}</p>
            <div className="flex gap-2 flex-wrap">
              {cardColorOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color_theme: value }))}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    form.color_theme === value
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder={t.common.note} rows={2} className={inputCls + ' resize-none'} />

          <button
            onClick={() => create.mutate()}
            disabled={!form.profile_id || !form.bank_name || create.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <Check size={14} />
            {create.isPending ? t.common.adding : t.common.add}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse" style={{ aspectRatio: '1.586' }} />
          ))}
        </div>
      )}

      {!isLoading && allCards.length === 0 && !showForm && (
        <EmptyState icon={CreditCard} title={t.cards.empty_title} description={t.cards.empty_desc} />
      )}

      {!isLoading && allCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allCards.map(card => (
            <BankCard key={card.id} card={card} onClick={() => navigate(`/cards/${card.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
