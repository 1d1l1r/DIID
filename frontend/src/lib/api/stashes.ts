import { api } from '../api'
import type { Stash } from '../types'

export const stashesApi = {
  list: (): Promise<Stash[]> =>
    api.get('/stashes').then(r => r.data),

  get: (id: string): Promise<Stash> =>
    api.get(`/stashes/${id}`).then(r => r.data),

  create: (data: { name: string; latitude?: number | null; longitude?: number | null; description?: string | null; note?: string | null }): Promise<Stash> =>
    api.post('/stashes', data).then(r => r.data),

  update: (id: string, data: Partial<Omit<Stash, 'id' | 'images' | 'created_at' | 'updated_at'>>): Promise<Stash> =>
    api.put(`/stashes/${id}`, data).then(r => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/stashes/${id}`),

  uploadImage: (stashId: string, file: File): Promise<Stash> => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post(`/stashes/${stashId}/images`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  getImageUrl: (stashId: string, imageId: string): string =>
    `${api.defaults.baseURL}/stashes/${stashId}/images/${imageId}`,

  deleteImage: (stashId: string, imageId: string): Promise<Stash> =>
    api.delete(`/stashes/${stashId}/images/${imageId}`).then(r => r.data),
}
