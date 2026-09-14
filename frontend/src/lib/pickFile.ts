let cancelPending: (() => void) | null = null

/** The OS picker can background/lock the app and unmount the calling page.
 * Keep its input and event listener outside that React tree until it completes.
 */
export function pickFile(accept: string): Promise<File | null> {
  cancelPending?.()
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.hidden = true
    input.dataset.vaultPicker = 'true'
    const finish = (file: File | null) => {
      input.remove()
      cancelPending = null
      resolve(file)
    }
    cancelPending = () => finish(null)
    input.addEventListener('change', () => finish(input.files?.[0] ?? null), { once: true })
    input.addEventListener('cancel', () => finish(null), { once: true })
    document.body.appendChild(input)
    input.click()
  })
}
