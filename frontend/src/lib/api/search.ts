import { api } from '../api'
import type { SearchResults } from '../types'

export const searchApi = {
  search: (q: string): Promise<SearchResults> =>
    api.get('/search', { params: { q } }).then(r => r.data),
}
