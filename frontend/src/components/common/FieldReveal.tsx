import { useState } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'
import { CopyButton } from './CopyButton'
import type { VisibilityMode } from '../../lib/types'
import { cn } from '../../lib/utils'
import { useT } from '../../lib/i18n'

interface FieldRevealProps {
  value: string | null | undefined
  mode: VisibilityMode
  label?: string
  copyKey?: string
  className?: string
  maskChar?: string
}

export function FieldReveal({
  value,
  mode,
  label,
  copyKey,
  className,
  maskChar = '•',
}: FieldRevealProps) {
  const [revealed, setRevealed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const t = useT()

  if (!value) return <span className="text-zinc-600">—</span>

  // ── visible ────────────────────────────────────────────────────────────────
  if (mode === 'visible') {
    return (
      <span className={cn('flex items-center gap-1.5', className)}>
        <span className="font-mono text-sm">{value}</span>
        <CopyButton value={value} label={label} copyKey={copyKey} />
      </span>
    )
  }

  const masked = maskChar.repeat(Math.min(value.length, 12))

  // ── hidden_confirmed: inline confirmation step ────────────────────────────
  if (mode === 'hidden_confirmed' && confirming && !revealed) {
    return (
      <span className={cn('flex items-center gap-1.5', className)}>
        <span className="text-xs text-zinc-400">{t.reveal.show_label(label)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); setRevealed(true); setConfirming(false) }}
          className="text-xs px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
        >
          {t.common.yes}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirming(false) }}
          className="p-0.5 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
        >
          <X size={12} />
        </button>
      </span>
    )
  }

  // ── hidden (both modes, after reveal state) ───────────────────────────────
  return (
    <span className={cn('flex items-center gap-1.5', className)}>
      <span className="font-mono text-sm text-zinc-400">
        {revealed ? value : masked}
      </span>

      {!revealed ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (mode === 'hidden_confirmed') {
              setConfirming(true)
            } else {
              setRevealed(true)
            }
          }}
          className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-800"
          title={t.common.show}
        >
          <Eye size={13} />
        </button>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setRevealed(false) }}
          className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-800"
        >
          <EyeOff size={13} />
        </button>
      )}

      {revealed && <CopyButton value={value} label={label} copyKey={copyKey} />}
    </span>
  )
}
