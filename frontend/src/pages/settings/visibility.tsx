import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { settingsApi } from '../../lib/api/settings'
import { PageHeader } from '../../components/common/PageHeader'
import type { VisibilityMode, VisibilityPreset } from '../../lib/types'
import { useVisibilityStore } from '../../features/visibility/visibilityStore'
import { useT } from '../../lib/i18n'
import toast from 'react-hot-toast'

const PRESET_FIELDS: Record<string, Record<string, VisibilityMode>> = {
  all_open: {
    'cards.card_number': 'visible',
    'cards.cvv': 'visible',
    'passwords.password': 'visible',
    'passwords.login': 'visible',
    'documents.document_number': 'visible',
    'profiles.iin': 'visible',
  },
  balanced: {
    'cards.card_number': 'hidden_quick_reveal',
    'cards.cvv': 'hidden_confirmed',
    'passwords.password': 'hidden_quick_reveal',
    'passwords.login': 'visible',
    'documents.document_number': 'visible',
    'profiles.iin': 'hidden_quick_reveal',
  },
  all_hidden: {
    'cards.card_number': 'hidden_confirmed',
    'cards.cvv': 'hidden_confirmed',
    'passwords.password': 'hidden_confirmed',
    'passwords.login': 'hidden_confirmed',
    'documents.document_number': 'hidden_confirmed',
    'profiles.iin': 'hidden_confirmed',
  },
}

export function VisibilityPage() {
  const t = useT()
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get })
  const { setConfig } = useVisibilityStore()
  const [preset, setPreset] = useState<VisibilityPreset>('balanced')
  const [fields, setFields] = useState<Record<string, VisibilityMode>>({})

  const PRESETS: { value: VisibilityPreset; label: string; desc: string }[] = [
    { value: 'all_open', label: t.visibility.all_open, desc: t.visibility.all_open_desc },
    { value: 'balanced', label: t.visibility.balanced, desc: t.visibility.balanced_desc },
    { value: 'all_hidden', label: t.visibility.all_hidden, desc: t.visibility.all_hidden_desc },
  ]

  const FIELDS: { key: string; label: string }[] = [
    { key: 'cards.card_number', label: t.visibility.field_card_number },
    { key: 'cards.cvv', label: t.visibility.field_cvv },
    { key: 'passwords.password', label: t.visibility.field_password },
    { key: 'passwords.login', label: t.visibility.field_login },
    { key: 'documents.document_number', label: t.visibility.field_doc_number },
    { key: 'profiles.iin', label: t.visibility.field_iin },
  ]

  const MODES: { value: VisibilityMode; label: string }[] = [
    { value: 'visible', label: t.visibility.mode_visible },
    { value: 'hidden_quick_reveal', label: t.visibility.mode_quick },
    { value: 'hidden_confirmed', label: t.visibility.mode_confirm },
  ]

  useEffect(() => {
    if (settings) {
      setPreset(settings.visibility.preset)
      setFields(settings.visibility.fields)
    }
  }, [settings])

  const save = useMutation({
    mutationFn: () => settingsApi.updateVisibility({ preset, fields }),
    onSuccess: (data) => { setConfig(data); toast.success(t.visibility.ok_saved) },
  })

  return (
    <div className="max-w-lg">
      <PageHeader title={t.visibility.title} />

      <div className="space-y-6">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">{t.visibility.section_preset}</p>
          <div className="space-y-2">
            {PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => {
                  setPreset(p.value)
                  if (PRESET_FIELDS[p.value]) setFields(PRESET_FIELDS[p.value])
                }}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors ${
                  preset === p.value ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${preset === p.value ? 'border-indigo-500' : 'border-zinc-600'}`}>
                  {preset === p.value && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{p.label}</p>
                  <p className="text-xs text-zinc-500">{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">{t.visibility.section_fields}</p>
          <div className="space-y-2">
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-sm text-zinc-300">{label}</span>
                <select
                  value={fields[key] ?? 'visible'}
                  onChange={e => {
                    setFields(f => ({ ...f, [key]: e.target.value as VisibilityMode }))
                    setPreset('custom')
                  }}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500"
                >
                  {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl text-white text-sm font-medium transition-colors"
        >
          {save.isPending ? t.common.saving : t.visibility.btn_save}
        </button>
      </div>
    </div>
  )
}
