import { api } from '../api'
import type { SessionInfo, User } from '../types'

export const authApi = {
  status: (): Promise<{ initialized: boolean }> => api.get('/auth/status').then(r => r.data),
  setup: (password: string) => api.post('/auth/setup', { password }).then(r => r.data),
  login: (password: string) => api.post('/auth/login', { password }).then(r => r.data),
  logout: () => api.post('/auth/logout'),
  me: (): Promise<User> => api.get('/auth/me').then(r => r.data),
  changePassword: (current_password: string, new_password: string) =>
    api.post('/auth/change-password', { current_password, new_password }),
  sessions: (): Promise<SessionInfo[]> => api.get('/auth/sessions').then(r => r.data),
  revokeSession: (id: string) => api.delete(`/auth/sessions/${id}`),
}
