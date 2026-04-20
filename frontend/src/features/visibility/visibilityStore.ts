import { create } from 'zustand'
import type { VisibilityConfig, VisibilityMode } from '../../lib/types'

const DEFAULT: VisibilityConfig = {
  preset: 'balanced',
  fields: {
    'cards.card_number': 'hidden_quick_reveal',
    'cards.cvv': 'hidden_confirmed',
    'passwords.password': 'hidden_quick_reveal',
    'passwords.login': 'visible',
    'documents.document_number': 'visible',
    'profiles.iin': 'visible',
  },
}

interface VisibilityState {
  config: VisibilityConfig
  setConfig: (c: VisibilityConfig) => void
  getMode: (field: string) => VisibilityMode
}

export const useVisibilityStore = create<VisibilityState>((set, get) => ({
  config: DEFAULT,
  setConfig: (config) => set({ config }),
  getMode: (field) => get().config.fields[field] ?? 'visible',
}))
