import { useState } from 'react'
import toast from 'react-hot-toast'
import { getT } from '../../lib/i18n'

/**
 * Fallback for non-secure contexts (HTTP on local network, iOS Safari).
 * navigator.clipboard requires HTTPS — this uses the deprecated execCommand
 * which still works on iOS when called from a user-gesture handler.
 */
function legacyCopy(text: string): boolean {
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')
  el.style.cssText = 'position:fixed;top:-200px;left:0;opacity:0;pointer-events:none;'
  document.body.appendChild(el)

  // iOS Safari needs Range + Selection API, not just .select()
  if (/ipad|iphone/i.test(navigator.userAgent)) {
    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    el.setSelectionRange(0, 999999)
  } else {
    el.select()
  }

  const ok = document.execCommand('copy')
  document.body.removeChild(el)
  return ok
}

export function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copy = async (value: string, label?: string, key?: string) => {
    const t = getT()
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value)
      } else {
        const ok = legacyCopy(value)
        if (!ok) throw new Error('execCommand returned false')
      }
      const k = key ?? value
      setCopiedKey(k)
      toast.success(label ? `${label} — ${t.common.copy_ok}` : t.common.copy_ok, { duration: 1800 })
      setTimeout(() => setCopiedKey(null), 1800)
    } catch {
      toast.error(t.common.copy_err)
    }
  }

  return { copy, copiedKey }
}
