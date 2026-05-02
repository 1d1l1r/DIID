import { openUrl } from '@tauri-apps/plugin-opener'

interface Props {
  onClose: () => void
}

export function AboutModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 w-72 text-center space-y-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">DIID</h1>
          <p className="text-zinc-500 text-xs mt-1">Version 1.0.1</p>
        </div>

        <p className="text-zinc-300 text-sm italic">Define Hence Confine Δ</p>

        <div className="space-y-1 text-sm">
          <button
            onClick={() => openUrl('https://36.dorozhk.in')}
            className="block w-full text-blue-400 hover:text-blue-300 transition-colors"
          >
            36.dorozhk.in
          </button>
          <p className="text-zinc-400">ilya@dorozhk.in</p>
        </div>

        <p className="text-zinc-600 text-xs">DOROZHK.IN WAS NOW(HERE)</p>

        <button
          onClick={onClose}
          className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}
