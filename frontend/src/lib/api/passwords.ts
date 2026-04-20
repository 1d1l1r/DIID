import { api } from '../api'
import type { PasswordEntry } from '../types'

export const passwordsApi = {
  list: (params?: { profile_id?: string; shared?: boolean; category?: string }): Promise<PasswordEntry[]> =>
    api.get('/passwords', { params }).then(r => r.data),

  get: (id: string): Promise<PasswordEntry> =>
    api.get(`/passwords/${id}`).then(r => r.data),

  create: (data: Partial<PasswordEntry>): Promise<PasswordEntry> =>
    api.post('/passwords', data).then(r => r.data),

  update: (id: string, data: Partial<PasswordEntry>): Promise<PasswordEntry> =>
    api.put(`/passwords/${id}`, data).then(r => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/passwords/${id}`),
}
