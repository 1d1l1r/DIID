import { create } from 'zustand'
import { persist } from 'zustand/middleware'

async function hashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

interface PinState {
  pinHash: string | null
  decoyPinHash: string | null
  isLocked: boolean
  isDecoy: boolean
  setPin: (pin: string) => Promise<void>
  removePin: () => void
  setDecoyPin: (pin: string) => Promise<'ok' | 'same_as_real'>
  removeDecoyPin: () => void
  lock: () => void
  unlock: (pin: string) => Promise<boolean>
}

export const usePinStore = create<PinState>()(
  persist(
    (set, get) => ({
      pinHash: null,
      decoyPinHash: null,
      isLocked: false,
      isDecoy: false,

      setPin: async (pin) => {
        const hash = await hashPin(pin)
        set({ pinHash: hash, isLocked: false, isDecoy: false })
      },

      removePin: () => set({ pinHash: null, decoyPinHash: null, isLocked: false, isDecoy: false }),

      setDecoyPin: async (pin) => {
        const hash = await hashPin(pin)
        if (hash === get().pinHash) return 'same_as_real'
        set({ decoyPinHash: hash })
        return 'ok'
      },

      removeDecoyPin: () => set({ decoyPinHash: null }),

      lock: () => set({ isLocked: true, isDecoy: false }),

      unlock: async (pin) => {
        const hash = await hashPin(pin)
        if (hash === get().pinHash) {
          set({ isLocked: false, isDecoy: false })
          return true
        }
        if (get().decoyPinHash && hash === get().decoyPinHash) {
          set({ isLocked: false, isDecoy: true })
          return true
        }
        return false
      },
    }),
    {
      name: 'diid-pin',
      partialize: (state) => ({ pinHash: state.pinHash, decoyPinHash: state.decoyPinHash }),
      onRehydrateStorage: () => (state) => {
        if (state?.pinHash) state.isLocked = true
      },
    },
  ),
)
