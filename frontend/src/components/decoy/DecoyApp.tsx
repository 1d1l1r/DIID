import { useState } from 'react'
import { Plus, Lock, Trash2, X, Check } from 'lucide-react'
import { useNotesStore, type Note } from '../../features/pin/notesStore'
import { usePinStore } from '../../features/pin/pinStore'
import { useT } from '../../lib/i18n'

const inputCls = 'w-full bg-transparent outline-none text-zinc-100 placeholder-zinc-600 resize-none'

function NoteCard({ note, onDelete }: { note: Note; onDelete: (id: string) => void }) {
  const { update } = useNotesStore()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const t = useT()

  function save() {
    if (!title.trim() && !content.trim()) { onDelete(note.id); return }
    update(note.id, title, content)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 space-y-2">
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={t.notes.placeholder_title}
          className={inputCls + ' font-medium text-sm'}
        />
        <div className="border-t border-zinc-800" />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={t.notes.placeholder_content}
          rows={4}
          className={inputCls + ' text-sm text-zinc-400'}
        />
        <div className="flex gap-2 pt-1">
          <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-zinc-200 transition-colors">
            <Check size={12} /> {t.common.save}
          </button>
          <button onClick={() => { setTitle(note.title); setContent(note.content); setEditing(false) }}
            className="flex items-center gap-1 px-3 py-1.5 bg-transparent hover:bg-zinc-800 rounded-lg text-xs text-zinc-500 transition-colors">
            <X size={12} /> {t.common.cancel}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="group p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors relative"
    >
      {note.title && <p className="text-sm font-medium text-zinc-200 mb-1 pr-6">{note.title}</p>}
      {note.content && <p className="text-sm text-zinc-500 line-clamp-3 whitespace-pre-wrap">{note.content}</p>}
      <button
        onClick={e => { e.stopPropagation(); onDelete(note.id) }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 rounded transition-all"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function NewNoteCard({ onDone }: { onDone: () => void }) {
  const { add } = useNotesStore()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const t = useT()

  function save() {
    if (!title.trim() && !content.trim()) { onDone(); return }
    add(title, content)
    onDone()
  }

  return (
    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 space-y-2">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={t.notes.placeholder_title}
        className={inputCls + ' font-medium text-sm'}
      />
      <div className="border-t border-zinc-800" />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={t.notes.placeholder_content}
        rows={4}
        className={inputCls + ' text-sm text-zinc-400'}
      />
      <div className="flex gap-2 pt-1">
        <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-zinc-200 transition-colors">
          <Check size={12} /> {t.common.save}
        </button>
        <button onClick={onDone} className="flex items-center gap-1 px-3 py-1.5 bg-transparent hover:bg-zinc-800 rounded-lg text-xs text-zinc-500 transition-colors">
          <X size={12} /> {t.common.cancel}
        </button>
      </div>
    </div>
  )
}

export function DecoyApp() {
  const { notes, remove } = useNotesStore()
  const { lock } = usePinStore()
  const t = useT()
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-5 h-14 border-b border-zinc-800 flex-shrink-0">
        <h1 className="text-base font-semibold text-zinc-100">{t.notes.title}</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
          >
            <Plus size={14} /> {t.notes.new_note}
          </button>
          <button
            onClick={lock}
            className="p-2 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-colors ml-1"
          >
            <Lock size={16} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="max-w-lg mx-auto space-y-3">
          {adding && <NewNoteCard onDone={() => setAdding(false)} />}

          {notes.length === 0 && !adding && (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-700">
              <p className="text-sm">{t.notes.empty}</p>
            </div>
          )}

          {notes.map(note => (
            <NoteCard key={note.id} note={note} onDelete={remove} />
          ))}
        </div>
      </main>
    </div>
  )
}
