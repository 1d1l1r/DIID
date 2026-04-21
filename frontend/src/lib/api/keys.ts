import { api } from '../api'
import type { KeyEntry } from '../types'

export const keysApi = {
  list: (): Promise<KeyEntry[]> =>
    api.get('/keys').then(r => r.data),

  get: (id: string): Promise<KeyEntry> =>
    api.get(`/keys/${id}`).then(r => r.data),

  create: (data: Partial<KeyEntry>): Promise<KeyEntry> =>
    api.post('/keys', data).then(r => r.data),

  update: (id: string, data: Partial<KeyEntry>): Promise<KeyEntry> =>
    api.put(`/keys/${id}`, data).then(r => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/keys/${id}`),

  uploadFile: (keyId: string, file: File): Promise<KeyEntry> => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post(`/keys/${keyId}/file`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  getFileUrl: (keyId: string): string =>
    `${api.defaults.baseURL}/keys/${keyId}/file`,

  deleteFile: (keyId: string): Promise<KeyEntry> =>
    api.delete(`/keys/${keyId}/file`).then(r => r.data),
}
