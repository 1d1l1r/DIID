import { FileText, CreditCard, KeyRound } from 'lucide-react'
import type { ProfileListItem } from '../../lib/types'
import { CopyButton } from '../common/CopyButton'
import { FieldReveal } from '../common/FieldReveal'
import { useVisibilityStore } from '../../features/visibility/visibilityStore'
import { cn } from '../../lib/utils'

const AVATAR_COLORS = [
  'from-indigo-500 to-violet-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
]

function avatarColor(name: string) {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

interface ProfileCardProps {
  profile: ProfileListItem
  onClick?: () => void
}

export function ProfileCard({ profile, onClick }: ProfileCardProps) {
  const { getMode } = useVisibilityStore()
  const initials = `${profile.last_name[0] ?? ''}${profile.first_name[0] ?? ''}`.toUpperCase()
  const fullName = [profile.last_name, profile.first_name, profile.middle_name].filter(Boolean).join(' ')
  const color = avatarColor(profile.last_name)

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer',
        'hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors',
      )}
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
          <span className="text-white text-sm font-semibold">{initials}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <p className="font-medium text-zinc-100 truncate">{fullName}</p>
            <CopyButton value={fullName} label="ФИО" copyKey={`name-${profile.id}`} size={11} />
          </div>
          {profile.iin && (
            <div onClick={e => e.stopPropagation()}>
              <FieldReveal
                value={profile.iin}
                mode={getMode('profiles.iin')}
                label="ИИН"
                copyKey={`iin-${profile.id}`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Phone */}
      {profile.phone && (
        <div className="flex items-center gap-1 mb-3">
          <span className="text-sm text-zinc-400 font-mono">{profile.phone}</span>
          <CopyButton value={profile.phone} label="Телефон" copyKey={`phone-${profile.id}`} size={11} />
        </div>
      )}

      {/* Tags */}
      {profile.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {profile.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Counts */}
      <div className="flex gap-3 text-xs text-zinc-600 border-t border-zinc-800 pt-3 mt-1">
        <span className="flex items-center gap-1">
          <FileText size={11} /> {profile.documents_count}
        </span>
        <span className="flex items-center gap-1">
          <CreditCard size={11} /> {profile.cards_count}
        </span>
        <span className="flex items-center gap-1">
          <KeyRound size={11} /> {profile.passwords_count}
        </span>
      </div>
    </div>
  )
}
