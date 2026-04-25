import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Note {
  id: string
  title: string
  content: string
  updatedAt: string
}

interface NotesState {
  notes: Note[]
  add: (title: string, content: string) => void
  update: (id: string, title: string, content: string) => void
  remove: (id: string) => void
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],

      add: (title, content) => set(s => ({
        notes: [{
          id: crypto.randomUUID(),
          title,
          content,
          updatedAt: new Date().toISOString(),
        }, ...s.notes],
      })),

      update: (id, title, content) => set(s => ({
        notes: s.notes.map(n =>
          n.id === id ? { ...n, title, content, updatedAt: new Date().toISOString() } : n
        ),
      })),

      remove: (id) => set(s => ({ notes: s.notes.filter(n => n.id !== id) })),
    }),
    { name: 'diid-notes' },
  ),
)
