import { Globe } from 'lucide-react'
import type { PasswordEntry } from '../../lib/types'
import { CopyButton } from '../common/CopyButton'
import { FieldReveal } from '../common/FieldReveal'
import { useVisibilityStore } from '../../features/visibility/visibilityStore'
import { cn } from '../../lib/utils'

interface PasswordItemProps {
  entry: PasswordEntry
  onClick?: () => void
}

export function PasswordItem({ entry, onClick }: PasswordItemProps) {
  const { getMode } = useVisibilityStore()

  const favicon = entry.url
    ? `https://www.google.com/s2/favicons?sz=32&domain=${new URL(entry.url).hostname}`
    : null

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800',
        'hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors cursor-pointer',
      )}
    >
      {/* Icon / favicon */}
      <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {favicon ? (
          <img src={favicon} alt="" className="w-5 h-5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <Globe size={16} className="text-zinc-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-zinc-200 text-sm truncate">{entry.title}</p>
        {entry.login && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className={cn(
              'text-xs font-mono truncate',
              getMode('passwords.login') === 'visible' ? 'text-zinc-500' : 'text-zinc-600',
            )}>
              {getMode('passwords.login') === 'visible' ? entry.login : '••••••••'}
            </span>
            {getMode('passwords.login') === 'visible' && (
              <CopyButton value={entry.login} label="Логин" copyKey={`login-${entry.id}`} size={11} />
            )}
          </div>
        )}
      </div>

      {/* Password */}
      {entry.password && (
        <div onClick={e => e.stopPropagation()}>
          <FieldReveal
            value={entry.password}
            mode={getMode('passwords.password')}
            label="Пароль"
            copyKey={`pw-${entry.id}`}
          />
        </div>
      )}
    </div>
  )
}
