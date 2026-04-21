import { KeySquare, Paperclip } from 'lucide-react'
import type { KeyEntry } from '../../lib/types'
import { FieldReveal } from '../common/FieldReveal'
import { useVisibilityStore } from '../../features/visibility/visibilityStore'
import { useT } from '../../lib/i18n'
import { cn } from '../../lib/utils'

interface KeyItemProps {
  entry: KeyEntry
  onClick?: () => void
}

export function KeyItem({ entry, onClick }: KeyItemProps) {
  const t = useT()
  const { getMode } = useVisibilityStore()

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800',
        'hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors cursor-pointer',
      )}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
        <KeySquare size={16} className="text-amber-500" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-zinc-200 text-sm truncate">{entry.name}</p>
        {entry.file_name && (
          <div className="flex items-center gap-1 mt-0.5">
            <Paperclip size={10} className="text-zinc-600" />
            <span className="text-xs text-zinc-600 truncate">{entry.file_name}</span>
          </div>
        )}
      </div>

      {/* Password reveal */}
      {entry.password && (
        <div onClick={e => e.stopPropagation()}>
          <FieldReveal
            value={entry.password}
            mode={getMode('keys.password')}
            label={t.keys.password}
            copyKey={`key-pw-${entry.id}`}
          />
        </div>
      )}
    </div>
  )
}
