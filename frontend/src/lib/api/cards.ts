import { api } from '../api'
import type { Card } from '../types'

export const cardsApi = {
  listByProfile: (profileId: string): Promise<Card[]> =>
    api.get(`/profiles/${profileId}/cards`).then(r => r.data),

  get: (id: string): Promise<Card> =>
    api.get(`/cards/${id}`).then(r => r.data),

  create: (profileId: string, data: Partial<Card>): Promise<Card> =>
    api.post(`/profiles/${profileId}/cards`, data).then(r => r.data),

  update: (id: string, data: Partial<Card>): Promise<Card> =>
    api.put(`/cards/${id}`, data).then(r => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/cards/${id}`),
}
