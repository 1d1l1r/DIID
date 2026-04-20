export interface User {
  id: string
  username: string
  created_at: string
}

export interface SessionInfo {
  id: string
  device_name: string | null
  ip: string | null
  last_seen_at: string
  expires_at: string
  is_current: boolean
}

export interface Profile {
  id: string
  last_name: string
  first_name: string
  middle_name: string | null
  iin: string | null
  birth_date: string | null
  phone: string | null
  address: string | null
  note: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface ProfileListItem {
  id: string
  last_name: string
  first_name: string
  middle_name: string | null
  iin: string | null
  phone: string | null
  tags: string[]
  documents_count: number
  cards_count: number
  passwords_count: number
}

export type DocumentType = 'id_card' | 'passport' | 'foreign_passport' | 'driver_license' | 'diploma' | 'birth_certificate' | 'power_of_attorney' | 'scan' | 'photo'

/** Static English fallback. Use getDocTypeLabel(t, type) from i18n for localized labels. */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  id_card: 'ID Card',
  passport: 'Passport',
  foreign_passport: 'Foreign Passport',
  driver_license: "Driver's License",
  diploma: 'Diploma',
  birth_certificate: 'Birth Certificate',
  power_of_attorney: 'Power of Attorney',
  scan: 'Scan / Copy',
  photo: 'Photo',
}

export interface Document {
  id: string
  profile_id: string
  type: DocumentType
  country: string | null
  document_number: string | null
  iin: string | null
  issued_by: string | null
  issue_date: string | null
  expiry_date: string | null
  note: string | null
  file_name: string | null
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  profile_id: string
  bank_name: string
  card_number: string | null
  card_last_four: string | null
  expiry_date: string | null
  cardholder_name: string | null
  cvv: string | null
  color_theme: string
  note: string | null
  created_at: string
  updated_at: string
}

export interface PasswordEntry {
  id: string
  profile_id: string | null
  title: string
  login: string | null
  password: string | null
  url: string | null
  category: string | null
  note: string | null
  is_shared: boolean
  created_at: string
  updated_at: string
}

export type VisibilityMode = 'visible' | 'hidden_quick_reveal' | 'hidden_confirmed'
export type VisibilityPreset = 'all_open' | 'balanced' | 'all_hidden' | 'custom'

export interface VisibilityConfig {
  preset: VisibilityPreset
  fields: Record<string, VisibilityMode>
}

export interface UserSettings {
  id: string
  visibility: VisibilityConfig
  auto_lock_minutes: number | null
  created_at: string
  updated_at: string
}

export interface SearchResults {
  query: string
  profiles: Array<{ id: string; full_name: string; iin: string | null; phone: string | null; matched_on: string }>
  documents: Array<{ id: string; profile_id: string; type: DocumentType; document_number: string | null; matched_on: string }>
  cards: Array<{ id: string; profile_id: string; bank_name: string; card_last_four: string | null; matched_on: string }>
  passwords: Array<{ id: string; profile_id: string | null; title: string; login: string | null; matched_on: string }>
}

export function fullName(p: Pick<Profile, 'last_name' | 'first_name' | 'middle_name'>): string {
  return [p.last_name, p.first_name, p.middle_name].filter(Boolean).join(' ')
}

export function initials(p: Pick<Profile, 'last_name' | 'first_name'>): string {
  return `${p.last_name[0] ?? ''}${p.first_name[0] ?? ''}`.toUpperCase()
}
