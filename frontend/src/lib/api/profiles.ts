import { api } from '../api'
import type { Profile, ProfileListItem } from '../types'

export const profilesApi = {
  list: (q?: string, tags?: string[]): Promise<ProfileListItem[]> =>
    api.get('/profiles', { params: { q, tags } }).then(r => r.data),

  get: (id: string): Promise<Profile> =>
    api.get(`/profiles/${id}`).then(r => r.data),

  create: (data: Partial<Profile>): Promise<Profile> =>
    api.post('/profiles', data).then(r => r.data),

  update: (id: string, data: Partial<Profile>): Promise<Profile> =>
    api.put(`/profiles/${id}`, data).then(r => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/profiles/${id}`),
}
