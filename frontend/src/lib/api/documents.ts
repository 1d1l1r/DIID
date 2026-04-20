import { api } from '../api'
import type { Document } from '../types'

export const documentsApi = {
  listByProfile: (profileId: string): Promise<Document[]> =>
    api.get(`/profiles/${profileId}/documents`).then(r => r.data),

  get: (id: string): Promise<Document> =>
    api.get(`/documents/${id}`).then(r => r.data),

  create: (profileId: string, data: Partial<Document>): Promise<Document> =>
    api.post(`/profiles/${profileId}/documents`, data).then(r => r.data),

  update: (id: string, data: Partial<Document>): Promise<Document> =>
    api.put(`/documents/${id}`, data).then(r => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/documents/${id}`),

  uploadFile: (documentId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/documents/${documentId}/file`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getFileUrl: (documentId: string) =>
    `${api.defaults.baseURL}/documents/${documentId}/file`,

  deleteFile: (documentId: string) =>
    api.delete(`/documents/${documentId}/file`),
}
