import { NavLink } from 'react-router-dom'
import { Eye, Monitor, KeyRound, ShieldCheck, ChevronRight } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { useT } from '../../lib/i18n'
import { usePinStore } from '../../features/pin/pinStore'

export function SettingsPage() {
  const t = useT()
  const { pinHash } = usePinStore()

  const LINKS = [
    { to: '/settings/visibility', icon: Eye, label: t.settings.visibility_label, desc: t.settings.visibility_desc },
    { to: '/settings/password', icon: KeyRound, label: t.settings.password_label, desc: t.settings.password_desc },
    { to: '/settings/pin', icon: ShieldCheck, label: t.settings.pin_label, desc: pinHash ? t.pin.status_set : t.pin.status_none },
    { to: '/settings/sessions', icon: Monitor, label: t.settings.sessions_label, desc: t.settings.sessions_desc },
  ]

  return (
    <div className="max-w-lg">
      <PageHeader title={t.settings.title} />
      <div className="space-y-2">
        {LINKS.map(({ to, icon: Icon, label, desc }) => (
          <NavLink
            key={to}
            to={to}
            className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Icon size={17} className="text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200">{label}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
            </div>
            <ChevronRight size={16} className="text-zinc-600 flex-shrink-0" />
          </NavLink>
        ))}
      </div>
    </div>
  )
}
