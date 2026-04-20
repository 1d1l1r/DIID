import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, FileText, CreditCard, KeyRound, ChevronDown, ArrowRight } from 'lucide-react'
import { CopyButton } from '../../components/common/CopyButton'
import { FieldReveal } from '../../components/common/FieldReveal'
import { useVisibilityStore } from '../../features/visibility/visibilityStore'
import { profilesApi } from '../../lib/api/profiles'
import { documentsApi } from '../../lib/api/documents'
import { cardsApi } from '../../lib/api/cards'
import { passwordsApi } from '../../lib/api/passwords'
import { DocumentCard } from '../../components/documents/DocumentCard'
import { BankCard } from '../../components/cards/BankCard'
import { PasswordItem } from '../../components/passwords/PasswordItem'
import { EmptyState } from '../../components/common/EmptyState'
import { useT } from '../../lib/i18n'
import type { ProfileListItem } from '../../lib/types'

// ── avatar helpers (same palette as ProfileCard) ──────────────────────────────
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

// ── accordion item ────────────────────────────────────────────────────────────
function ProfileAccordionItem({ profile }: { profile: ProfileListItem }) {
  const t = useT()
  const navigate = useNavigate()
  const { getMode } = useVisibilityStore()
  const [open, setOpen] = useState(false)

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['documents', profile.id],
    queryFn: () => documentsApi.listByProfile(profile.id),
    enabled: open,
  })
  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['cards', profile.id],
    queryFn: () => cardsApi.listByProfile(profile.id),
    enabled: open,
  })
  const { data: passwords = [], isLoading: pwdsLoading } = useQuery({
    queryKey: ['passwords', profile.id],
    queryFn: () => passwordsApi.list({ profile_id: profile.id }),
    enabled: open,
  })

  const isLoadingData = docsLoading || cardsLoading || pwdsLoading
  const color = avatarColor(profile.last_name)
  const initials = `${profile.last_name[0] ?? ''}${profile.first_name[0] ?? ''}`.toUpperCase()
  const name = [profile.last_name, profile.first_name, profile.middle_name].filter(Boolean).join(' ')
  const hasContent = profile.documents_count > 0 || profile.cards_count > 0 || profile.passwords_count > 0

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden transition-colors">
      {/* Header row — div not button to allow copy buttons inside without nesting <button><button> */}
      <div
        onClick={() => setOpen(v => !v)}
        role="button"
        className="flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-800/60 transition-colors cursor-pointer select-none"
      >
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
          <span className="text-white text-xs font-semibold">{initials}</span>
        </div>

        {/* Name + IIN + phone */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-0.5">
            <p className="font-medium text-zinc-100 text-sm truncate">{name}</p>
            <CopyButton value={name} label={t.profiles.last_name} copyKey={`name-${profile.id}`} size={11} />
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {profile.iin && (
              <span onClick={e => e.stopPropagation()}>
                <FieldReveal
                  value={profile.iin}
                  mode={getMode('profiles.iin')}
                  label={t.profiles.iin}
                  copyKey={`iin-${profile.id}`}
                />
              </span>
            )}
            {profile.phone && (
              <span className="flex items-center gap-0.5">
                <span className="text-xs text-zinc-500 font-mono">{profile.phone}</span>
                <CopyButton value={profile.phone} label={t.profiles.phone} copyKey={`phone-${profile.id}`} size={11} />
              </span>
            )}
          </div>
        </div>

        {/* Counts */}
        <div className="flex items-center gap-3 text-xs text-zinc-600 flex-shrink-0">
          {profile.documents_count > 0 && (
            <span className="flex items-center gap-1"><FileText size={11} />{profile.documents_count}</span>
          )}
          {profile.cards_count > 0 && (
            <span className="flex items-center gap-1"><CreditCard size={11} />{profile.cards_count}</span>
          )}
          {profile.passwords_count > 0 && (
            <span className="flex items-center gap-1"><KeyRound size={11} />{profile.passwords_count}</span>
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          size={15}
          className={`text-zinc-600 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-zinc-800 px-4 py-4 space-y-5">
          {isLoadingData && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-indigo-500 animate-spin" />
            </div>
          )}

          {!isLoadingData && !hasContent && (
            <p className="text-sm text-zinc-600 text-center py-2">{t.dashboard.no_data}</p>
          )}

          {!isLoadingData && documents.length > 0 && (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2.5">{t.dashboard.section_docs}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {documents.map(d => (
                  <DocumentCard key={d.id} doc={d} onClick={() => navigate(`/documents/${d.id}`)} />
                ))}
              </div>
            </div>
          )}

          {!isLoadingData && cards.length > 0 && (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2.5">{t.dashboard.section_cards}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cards.map(c => (
                  <BankCard key={c.id} card={c} onClick={() => navigate(`/cards/${c.id}`)} />
                ))}
              </div>
            </div>
          )}

          {!isLoadingData && passwords.length > 0 && (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2.5">{t.dashboard.section_passwords}</p>
              <div className="space-y-1.5">
                {passwords.map(p => (
                  <PasswordItem key={p.id} entry={p} onClick={() => navigate(`/passwords/${p.id}`)} />
                ))}
              </div>
            </div>
          )}

          {/* Link to full profile */}
          {!isLoadingData && (
            <button
              onClick={() => navigate(`/profiles/${profile.id}`)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {t.dashboard.open_profile} <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const t = useT()
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profilesApi.list(),
  })

  return (
    <div className="max-w-3xl">
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && profiles.length === 0 && (
        <EmptyState icon={Users} title={t.dashboard.empty_title} description={t.dashboard.empty_desc} />
      )}

      {!isLoading && profiles.length > 0 && (
        <div className="space-y-2">
          {profiles.map(p => (
            <ProfileAccordionItem key={p.id} profile={p} />
          ))}
        </div>
      )}
    </div>
  )
}
