import { useT } from '../../lib/i18n'

export interface AddressValues {
  address: string
  addresses_match: boolean
  residential_address: string
}

export function AddressFields({ value, onChange }: {
  value: AddressValues
  onChange: (changes: Partial<AddressValues>) => void
}) {
  const t = useT()
  const inputCls = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500'
  return <div className="space-y-3">
    <label className="block text-xs text-zinc-400 space-y-1">
      <span>{t.profiles.address}</span>
      <input value={value.address} onChange={e => onChange({ address: e.target.value })} className={inputCls} />
    </label>
    <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
      <input type="checkbox" checked={value.addresses_match} onChange={e => onChange({ addresses_match: e.target.checked })} className="w-4 h-4 shrink-0 accent-indigo-500" />
      {t.profiles.addresses_match}
    </label>
    {!value.addresses_match && <label className="block text-xs text-zinc-400 space-y-1">
      <span>{t.profiles.residential_address}</span>
      <input value={value.residential_address} onChange={e => onChange({ residential_address: e.target.value })} className={inputCls} />
    </label>}
  </div>
}
