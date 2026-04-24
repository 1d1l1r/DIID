import { create } from 'zustand'
import { persist } from 'zustand/middleware'

async function hashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

interface PinState {
  pinHash: string | null
  isLocked: boolean
  setPin: (pin: string) => Promise<void>
  removePin: () => void
  lock: () => void
  unlock: (pin: string) => Promise<boolean>
}

export const usePinStore = create<PinState>()(
  persist(
    (set, get) => ({
      pinHash: null,
      isLocked: false,

      setPin: async (pin: string) => {
        const hash = await hashPin(pin)
        set({ pinHash: hash, isLocked: false })
      },

      removePin: () => set({ pinHash: null, isLocked: false }),

      lock: () => set({ isLocked: true }),

      unlock: async (pin: string) => {
        const hash = await hashPin(pin)
        if (hash === get().pinHash) {
          set({ isLocked: false })
          return true
        }
        return false
      },
    }),
    {
      name: 'diid-pin',
      // Only persist the hash — isLocked is computed on rehydration
      partialize: (state) => ({ pinHash: state.pinHash }),
      onRehydrateStorage: () => (state) => {
        // Lock on every fresh load if PIN is set
        if (state?.pinHash) state.isLocked = true
      },
    },
  ),
)
