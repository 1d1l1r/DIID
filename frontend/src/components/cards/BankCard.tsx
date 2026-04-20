import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { Card } from '../../lib/types'
import { CopyButton } from '../common/CopyButton'
import { useVisibilityStore } from '../../features/visibility/visibilityStore'
import { cn } from '../../lib/utils'
import { useT } from '../../lib/i18n'

const THEMES: Record<string, string> = {
  blue: 'from-blue-600 via-blue-700 to-indigo-800',
  black: 'from-zinc-600 via-zinc-700 to-zinc-900',
  gold: 'from-yellow-500 via-amber-600 to-orange-700',
  green: 'from-emerald-500 via-green-600 to-teal-800',
  purple: 'from-purple-600 via-violet-700 to-indigo-900',
  red: 'from-rose-500 via-red-600 to-red-800',
  silver: 'from-slate-400 via-slate-500 to-slate-700',
}

// Static fallback / value-only list — used for the `value` field only.
// For translated labels use getCardColorOptions(t).
export const CARD_COLOR_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'black', label: 'Black' },
  { value: 'gold', label: 'Gold' },
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
  { value: 'red', label: 'Red' },
  { value: 'silver', label: 'Silver' },
]

export function getCardColorOptions(t: ReturnType<typeof useT>) {
  return [
    { value: 'blue', label: t.cards.color_blue },
    { value: 'black', label: t.cards.color_black },
    { value: 'gold', label: t.cards.color_gold },
    { value: 'green', label: t.cards.color_green },
    { value: 'purple', label: t.cards.color_purple },
    { value: 'red', label: t.cards.color_red },
    { value: 'silver', label: t.cards.color_silver },
  ]
}

interface BankCardProps {
  card: Card
  onClick?: () => void
  className?: string
}

export function BankCard({ card, onClick, className }: BankCardProps) {
  const t = useT()
  const { getMode } = useVisibilityStore()
  const cardNumMode = getMode('cards.card_number')
  const cvvMode = getMode('cards.cvv')

  const [showNum, setShowNum] = useState(false)
  const [showCvv, setShowCvv] = useState(false)
  const [confirmCvv, setConfirmCvv] = useState(false)

  const gradient = THEMES[card.color_theme] ?? THEMES.blue

  const isNumVisible = cardNumMode === 'visible'
  const displayNumber = (isNumVisible || showNum) && card.card_number
    ? card.card_number.replace(/(.{4})/g, '$1 ').trim()
    : `•••• •••• •••• ${card.card_last_four ?? '????'}`

  const isCvvVisible = cvvMode === 'visible'
  const displayCvv = (isCvvVisible || showCvv) && card.cvv ? card.cvv : '•••'

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative w-full rounded-2xl overflow-hidden select-none',
        'bg-gradient-to-br',
        gradient,
        onClick && 'cursor-pointer hover:scale-[1.02] transition-transform duration-200',
        className,
      )}
      style={{ aspectRatio: '1.586' }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-16 -right-4 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative h-full p-5 flex flex-col justify-between">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <span className="text-white font-bold text-base tracking-wide drop-shadow-sm leading-tight">
            {card.bank_name}
          </span>
          {/* Chip */}
          <div className="w-9 h-6 rounded-md bg-amber-300/80 flex items-center justify-center overflow-hidden">
            <div className="grid grid-cols-2 gap-px w-7 h-5 p-0.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-amber-600/40 rounded-sm" />
              ))}
            </div>
          </div>
        </div>

        {/* Card number */}
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <span className="font-mono text-white/90 tracking-[0.18em] text-sm">
            {displayNumber}
          </span>
          {!isNumVisible && (
            <button
              onClick={() => setShowNum(v => !v)}
              className="text-white/50 hover:text-white/90 transition-colors"
            >
              {showNum ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          )}
          {(isNumVisible || showNum) && card.card_number && (
            <CopyButton
              value={card.card_number}
              label={t.documents.doc_number}
              copyKey={`cn-${card.id}`}
              className="text-white/60 hover:text-white hover:bg-white/10"
            />
          )}
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between" onClick={e => e.stopPropagation()}>
          {/* Cardholder */}
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Card Holder</p>
            <div className="flex items-center gap-1">
              <p className="text-white font-medium text-sm leading-none">
                {card.cardholder_name || '—'}
              </p>
              {card.cardholder_name && (
                <CopyButton
                  value={card.cardholder_name}
                  label={card.cardholder_name}
                  copyKey={`ch-${card.id}`}
                  size={11}
                  className="text-white/40 hover:text-white/80 hover:bg-white/10"
                />
              )}
            </div>
          </div>

          {/* CVV */}
          {card.cvv && (
            <div className="text-center">
              <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">CVV</p>
              {confirmCvv && !showCvv ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setShowCvv(true); setConfirmCvv(false) }}
                    className="text-[10px] px-1.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
                  >
                    {t.common.show}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-mono text-white font-medium text-sm leading-none">{displayCvv}</span>
                  {!isCvvVisible && (
                    <button
                      onClick={() => {
                        if (cvvMode === 'hidden_confirmed') {
                          if (showCvv) { setShowCvv(false) } else { setConfirmCvv(true) }
                        } else {
                          setShowCvv(v => !v)
                        }
                      }}
                      className="text-white/50 hover:text-white/90 transition-colors"
                    >
                      {showCvv ? <EyeOff size={11} /> : <Eye size={11} />}
                    </button>
                  )}
                  {(isCvvVisible || showCvv) && (
                    <CopyButton
                      value={card.cvv}
                      label="CVV"
                      copyKey={`cvv-${card.id}`}
                      size={11}
                      className="text-white/40 hover:text-white/80 hover:bg-white/10"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Expiry */}
          <div className="text-right">
            <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Expires</p>
            <div className="flex items-center justify-end gap-1">
              {card.expiry_date && (
                <CopyButton
                  value={card.expiry_date}
                  label={t.documents.expires_label}
                  copyKey={`exp-${card.id}`}
                  size={11}
                  className="text-white/40 hover:text-white/80 hover:bg-white/10"
                />
              )}
              <p className="text-white font-medium text-sm leading-none">
                {card.expiry_date || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
