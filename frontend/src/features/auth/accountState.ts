import type { User } from '../../lib/types'
import { usePinStore } from '../pin/pinStore'
import { useNotesStore } from '../pin/notesStore'
import { useVisibilityStore } from '../visibility/visibilityStore'

function readState(name: string, user: User | null) {
  if (!user) return {}
  const key = `${name}:${user.id}`
  // Only the master may inherit the old browser-wide PIN / decoy notes.
  const saved = localStorage.getItem(key) ?? (user.role === 'master' ? localStorage.getItem(name) : null)
  try { return saved ? JSON.parse(saved).state ?? {} : {} } catch { return {} }
}

export function selectAccountState(user: User | null) {
  const pin = readState('diid-pin', user)
  const notes = readState('diid-notes', user)
  // Invalidate any PIN check that was started for the previous identity.
  usePinStore.getState().lock()
  usePinStore.persist.setOptions({ name: `diid-pin:${user?.id ?? 'anonymous'}` })
  usePinStore.setState({ pinHash: pin.pinHash ?? null, decoyPinHash: pin.decoyPinHash ?? null, isLocked: Boolean(pin.pinHash), isDecoy: false })
  useNotesStore.persist.setOptions({ name: `diid-notes:${user?.id ?? 'anonymous'}` })
  useNotesStore.setState({ notes: Array.isArray(notes.notes) ? notes.notes : [] })
  useVisibilityStore.getState().setConfig({ preset: 'all_hidden', fields: {} })
  if (user?.role === 'master') {
    localStorage.removeItem('diid-pin')
    localStorage.removeItem('diid-notes')
  }
}
