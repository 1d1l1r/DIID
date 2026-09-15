import axios from 'axios'
import { useAuthStore, checkAccountChanged } from '../features/auth/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
})

api.interceptors.request.use(config => {
  const previous = useAuthStore.getState().user?.id
  checkAccountChanged()
  const user = useAuthStore.getState().user
  if ((previous && previous !== user?.id) || (!user && !config.url?.startsWith('/auth/'))) {
    throw new axios.CanceledError('Account changed')
  }
  if (user && !config.headers.has('X-Vault-User')) config.headers.set('X-Vault-User', user.id)
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
