import { Copy, Check } from 'lucide-react'
import { useCopy } from '../../features/clipboard/useCopy'
import { cn } from '../../lib/utils'

interface CopyButtonProps {
  value: string | null | undefined
  label?: string
  copyKey?: string
  className?: string
  size?: number
}

export function CopyButton({ value, label, copyKey, className, size = 13 }: CopyButtonProps) {
  const { copy, copiedKey } = useCopy()
  if (!value) return null

  const key = copyKey ?? value
  const isCopied = copiedKey === key

  return (
    <button
      onClick={(e) => { e.stopPropagation(); copy(value, label, key) }}
      title={`Копировать${label ? ` ${label}` : ''}`}
      className={cn(
        'inline-flex items-center justify-center rounded p-1 transition-colors',
        isCopied
          ? 'text-green-400'
          : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800',
        className,
      )}
    >
      {isCopied ? <Check size={size} /> : <Copy size={size} />}
    </button>
  )
}
