import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trash2, Pencil, Check, X } from 'lucide-react'
import { cardsApi } from '../../lib/api/cards'
import { BankCard, getCardColorOptions } from '../../components/cards/BankCard'
import { CopyButton } from '../../components/common/CopyButton'
import { FieldReveal } from '../../components/common/FieldReveal'
import type { Card } from '../../lib/types'
import { useVisibilityStore } from '../../features/visibility/visibilityStore'
import { useT, getT } from '../../lib/i18n'
import toast from 'react-hot-toast'

type EditForm = {
  bank_name: string
  card_number: string
  expiry_date: string
  cardholder_name: string
  cvv: string
  color_theme: string
  note: string
}

function cardToForm(c: Card): EditForm {
  return {
    bank_name: c.bank_name,
    card_number: c.card_number ?? '',
    expiry_date: c.expiry_date ?? '',
    cardholder_name: c.cardholder_name ?? '',
    cvv: c.cvv ?? '',
    color_theme: c.color_theme,
    note: c.note ?? '',
  }
}

const inputCls = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors'

export function CardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const t = useT()
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)

  const { data: card } = useQuery({ queryKey: ['card', id], queryFn: () => cardsApi.get(id!) })
  const { getMode } = useVisibilityStore()

  const del = useMutation({
    mutationFn: () => cardsApi.delete(id!),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['cards'] })
      navigate('/cards')
      toast.success(t.cards.ok_deleted)
    },
  })

  const update = useMutation({
    mutationFn: (data: Partial<Card>) => cardsApi.update(id!, data),
    onSuccess: () => {
      const t = getT()
      qc.invalidateQueries({ queryKey: ['card', id] })
      qc.invalidateQueries({ queryKey: ['cards'] })
      setEditing(false)
      toast.success(t.cards.ok_saved)
    },
  })

  if (!card) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 rounded-full border-2 border-zinc-700 border-t-indigo-500 animate-spin" />
    </div>
  )

  const cardColorOptions = getCardColorOptions(t)

  function startEdit() {
    setEditForm(cardToForm(card!))
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setEditForm(null)
  }

  function saveEdit() {
    if (!editForm) return
    const cardNum = editForm.card_number.replace(/\s/g, '')
    update.mutate({
      bank_name: editForm.bank_name,
      card_number: cardNum || null,
      card_last_four: cardNum ? cardNum.slice(-4) : null,
      expiry_date: editForm.expiry_date || null,
      cardholder_name: editForm.cardholder_name || null,
      cvv: editForm.cvv || null,
      color_theme: editForm.color_theme,
      note: editForm.note || null,
    })
  }

  // Live preview card during edit
  const previewCard: Card = editing && editForm
    ? {
        ...card,
        bank_name: editForm.bank_name || card.bank_name,
        card_last_four: editForm.card_number
          ? editForm.card_number.replace(/\s/g, '').slice(-4) || card.card_last_four
          : card.card_last_four,
        card_number: editForm.card_number.replace(/\s/g, '') || card.card_number,
        expiry_date: editForm.expiry_date || card.expiry_date,
        cardholder_name: editForm.cardholder_name || card.cardholder_name,
        color_theme: editForm.color_theme,
      }
    : card

  return (
    <div className="max-w-md">
      <button onClick={() => navigate('/cards')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 text-sm mb-4 transition-colors">
        <ArrowLeft size={15} /> {t.cards.title}
      </button>

      <BankCard card={previewCard} className="mb-6" />

      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
        {editing && editForm ? (
          <div className="space-y-3">
            <input
              value={editForm.bank_name}
              onChange={e => setEditForm(f => f ? { ...f, bank_name: e.target.value } : f)}
              placeholder={`${t.cards.bank_name} *`}
              className={inputCls}
            />
            <input
              value={editForm.card_number}
              onChange={e => setEditForm(f => f ? { ...f, card_number: e.target.value } : f)}
              placeholder={t.cards.card_number}
              className={inputCls + ' font-mono'}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={editForm.expiry_date}
                onChange={e => setEditForm(f => f ? { ...f, expiry_date: e.target.value } : f)}
                placeholder="MM/YY"
                className={inputCls + ' font-mono'}
              />
              <input
                value={editForm.cvv}
                onChange={e => setEditForm(f => f ? { ...f, cvv: e.target.value } : f)}
                placeholder={t.cards.cvv}
                className={inputCls + ' font-mono'}
              />
            </div>
            <input
              value={editForm.cardholder_name}
              onChange={e => setEditForm(f => f ? { ...f, cardholder_name: e.target.value } : f)}
              placeholder={t.cards.holder}
              className={inputCls}
            />
            {/* Color theme picker */}
            <div>
              <p className="text-xs text-zinc-500 mb-2">{t.cards.color}</p>
              <div className="flex gap-2 flex-wrap">
                {cardColorOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setEditForm(f => f ? { ...f, color_theme: value } : f)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      editForm.color_theme === value
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
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
                disabled={!editForm.bank_name || update.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <Check size={14} />
                {update.isPending ? t.common.saving : t.common.save}
              </button>
              <button onClick={cancelEdit} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-sm transition-colors">
                <X size={14} /> {t.common.cancel}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-400">{t.cards.title}</span>
              <button onClick={startEdit} className="p-1.5 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                <Pencil size={14} />
              </button>
            </div>
            <div className="space-y-3">
              <Row label={t.cards.bank_name} value={card.bank_name} />
              <Row label={t.cards.card_number}>
                <FieldReveal value={card.card_number} mode={getMode('cards.card_number')} label={t.cards.card_number} copyKey={`cn-${id}`} />
              </Row>
              <Row label={t.cards.expiry}>
                <span className="font-mono text-zinc-200 text-sm">{card.expiry_date || '—'}</span>
                <CopyButton value={card.expiry_date} label={t.cards.expiry} copyKey={`exp-${id}`} />
              </Row>
              <Row label={t.cards.cvv}>
                <FieldReveal value={card.cvv} mode={getMode('cards.cvv')} label={t.cards.cvv} copyKey={`cvv-${id}`} />
              </Row>
              <Row label={t.cards.holder} value={card.cardholder_name} />
              {card.note && <Row label={t.common.note} value={card.note} />}
            </div>
          </>
        )}
      </div>

      {!editing && (
        <button
          onClick={() => { if (confirm(t.cards.confirm_delete)) del.mutate() }}
          className="mt-4 flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={15} /> {t.cards.confirm_delete}
        </button>
      )}
    </div>
  )
}

function Row({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-zinc-500 flex-shrink-0 w-28">{label}</span>
      <div className="flex items-center gap-1 min-w-0">
        {children ?? (
          <>
            <span className="text-sm text-zinc-200 truncate">{value || '—'}</span>
            {value && <CopyButton value={value} label={label} />}
          </>
        )}
      </div>
    </div>
  )
}
