import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Hashing ───────────────────────────────────────────────────────────────────
//
// crypto.subtle requires a secure context (HTTPS or localhost).
// On plain HTTP (typical LAN / work server without TLS) it is undefined,
// which previously caused hashPin to throw — the catch block in pin.tsx
// then showed the misleading "PINs don't match" error.
//
// Fix: try crypto.subtle first; if unavailable or it throws, fall back to a
// pure-JS FNV-1a based hash.  Both paths are deterministic: same PIN always
// produces the same hash on the same device, which is all we need.

function hashPinFallback(pin: string): string {
  // Two independent FNV-1a 32-bit passes, then mix → 64-bit hex string
  let h1 = 2166136261
  let h2 = 0x84222325
  for (let i = 0; i < pin.length; i++) {
    const c = pin.charCodeAt(i)
    h1 = (Math.imul(h1 ^ c, 0x01000193)) >>> 0
    h2 = (Math.imul(h2 ^ (c + i + 1), 0x01000193)) >>> 0
  }
  h1 = (Math.imul(h1, 0x45d9f3b) ^ h2) >>> 0
  h2 = (Math.imul(h2, 0x45d9f3b) ^ h1) >>> 0
  return 'fb:' + h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

async function hashPin(pin: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    try {
      const buf = await window.crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(pin),
      )
      return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    } catch {
      // subtle threw (e.g. algorithm rejected) → fall through
    }
  }
  // Secure context unavailable (HTTP, non-localhost) — use JS fallback
  return hashPinFallback(pin)
}

// ── Store ─────────────────────────────────────────────────────────────────────

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
