import { api } from '../api'
import type { UserSettings, VisibilityConfig } from '../types'

export const settingsApi = {
  get: (): Promise<UserSettings> =>
    api.get('/settings').then(r => r.data),

  updateVisibility: (config: VisibilityConfig): Promise<VisibilityConfig> =>
    api.put('/settings/visibility', config).then(r => r.data),

  updateAutoLock: (minutes: number | null): Promise<void> =>
    api.put('/settings/auto-lock', { minutes }),
}
