import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Translation dictionaries ──────────────────────────────────────────────────

const en = {
  // Auth
  auth: {
    subtitle_login: 'Enter master password to sign in',
    subtitle_setup: 'Create a master password for your vault',
    placeholder_password: 'Master password',
    placeholder_confirm: 'Confirm password',
    btn_signin: 'Sign In',
    btn_signing: 'Signing in...',
    btn_create: 'Create Vault',
    btn_creating: 'Creating...',
    err_wrong: 'Wrong password',
    err_create: 'Failed to create vault',
    ok_created: 'Vault created! Sign in with your new password.',
    val_min8: 'Minimum 8 characters',
    val_mismatch: 'Passwords do not match',
  },

  // Navigation
  nav: {
    home: 'Home',
    profiles: 'Profiles',
    documents: 'Documents',
    cards: 'Cards',
    passwords: 'Passwords',
    settings: 'Settings',
  },

  // Common actions / labels
  common: {
    add: 'Add',
    adding: 'Adding...',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    note: 'Note',
    country: 'Country',
    show: 'Show',
    showQ: (label: string) => `Show ${label}?`,
    yes: 'Yes',
    profile: 'Profile',
    noProfile: 'No profile binding',
    tags: 'Tags (comma separated)',
    copy_ok: 'Copied',
    copy_err: 'Failed to copy',
    search_placeholder: 'Search...',
    unknown_device: 'Unknown device',
    current_session: 'current',
  },

  // Dashboard
  dashboard: {
    empty_title: 'No profiles',
    empty_desc: 'Add your first profile on the Profiles page',
    no_data: 'No data',
    open_profile: 'Open profile',
    section_docs: 'Documents',
    section_cards: 'Cards',
    section_passwords: 'Passwords',
    section_keys: 'Keys',
  },

  // Profiles
  profiles: {
    title: 'Profiles',
    new_profile: 'New Profile',
    empty_title: 'No profiles',
    empty_desc: 'Click "Add" to create a profile',
    last_name: 'Last name *',
    first_name: 'First name *',
    middle_name: 'Middle name',
    iin: 'IIN',
    phone: 'Phone',
    birth_date: 'Date of birth',
    address: 'Address',
    ok_deleted: 'Profile deleted',
    ok_saved: 'Profile saved',
    confirm_delete: 'Delete profile?',
    tab_docs: 'Documents',
    tab_cards: 'Cards',
    tab_passwords: 'Passwords',
    tab_keys: 'Keys',
  },

  // Documents
  documents: {
    title: 'Documents',
    new_doc: 'New Document',
    empty_title: 'No documents',
    empty_desc: 'Click "Add" to add a document',
    ok_added: 'Document added',
    ok_deleted: 'Document deleted',
    ok_saved: 'Document saved',
    doc_number: 'Document number',
    issued_by: 'Issued by',
    issue_date: 'Issue date',
    expiry_date: 'Expiry date',
    issued_label: 'Issued',
    expires_label: 'Expires',
    expired: 'expired',
    expiring_soon: 'expiring soon',
    card_holder: 'Card Holder',
    confirm_delete: 'Delete document?',
    select_profile: '— Select profile —',
    select_type: 'Document type',
    type_id_card: 'Identity Card',
    type_passport: 'Passport',
    type_foreign_passport: 'Foreign Passport',
    type_driver: 'Driver\'s License',
    file_section: 'Document Scan',
    file_upload: 'Attach PDF',
    file_download: 'Download',
    file_delete: 'Remove file',
    file_uploading: 'Uploading...',
    file_none: 'No scan attached',
    file_only_pdf: 'Only PDF, JPG or PNG files are supported',
    type_diploma: 'Diploma',
    type_birth_certificate: 'Birth Certificate',
    type_power_of_attorney: 'Power of Attorney',
    type_scan: 'Scan / Copy',
    type_photo: 'Photo',
    file_title: 'Title',
    file_accepted_scan: 'PDF only',
    file_accepted_photo: 'JPG or PNG',
    field_institution: 'Institution',
  },

  // Cards
  cards: {
    title: 'Cards',
    new_card: 'New Card',
    empty_title: 'No cards',
    empty_desc: 'Click "Add" to add a card',
    ok_added: 'Card added',
    ok_deleted: 'Card deleted',
    ok_saved: 'Card saved',
    bank_name: 'Bank name *',
    card_number: 'Card number',
    expiry: 'MM/YY',
    cvv: 'CVV',
    holder: 'Cardholder name',
    color: 'Card color',
    confirm_delete: 'Delete card?',
    select_profile: '— Select profile —',
    color_blue: 'Blue',
    color_black: 'Black',
    color_gold: 'Gold',
    color_green: 'Green',
    color_purple: 'Purple',
    color_red: 'Red',
    color_silver: 'Silver',
  },

  // Passwords
  passwords: {
    title: 'Passwords',
    new_pwd: 'New Password',
    empty_title: 'No passwords',
    empty_desc: 'Click "Add" to add a password',
    ok_added: 'Password added',
    ok_deleted: 'Entry deleted',
    ok_saved: 'Entry saved',
    service: 'Service name *',
    login: 'Login',
    password: 'Password',
    url: 'URL',
    category: 'Category',
    confirm_delete: 'Delete entry?',
    no_profile: '— No profile —',
  },

  // Keys
  keys: {
    title: 'Keys',
    tab_passwords: 'Passwords',
    new_key: 'New Key',
    empty_title: 'No keys',
    empty_desc: 'Add a .p12 / .pfx certificate',
    ok_added: 'Key added',
    ok_deleted: 'Key deleted',
    ok_saved: 'Key saved',
    name: 'Key name *',
    password: 'Key password',
    file_section: 'Certificate File',
    file_upload: 'Attach .p12 / .pfx',
    file_download: 'Download',
    file_delete: 'Remove file',
    file_uploading: 'Uploading...',
    file_none: 'No certificate attached',
    file_only_p12: 'Only .p12 and .pfx files are supported',
    confirm_delete: 'Delete key?',
  },

  // Settings
  settings: {
    title: 'Settings',
    visibility_label: 'Field Visibility',
    visibility_desc: 'Configure display of sensitive data',
    password_label: 'Master Password',
    password_desc: 'Change the vault entry password',
    sessions_label: 'Active Sessions',
    sessions_desc: 'Manage sign-ins',
  },

  // Visibility settings
  visibility: {
    title: 'Field Visibility',
    section_preset: 'Preset',
    section_fields: 'Fields',
    all_open: 'All visible',
    all_open_desc: 'Data is always visible',
    balanced: 'Balanced',
    balanced_desc: 'Sensitive fields are hidden',
    all_hidden: 'Maximum security',
    all_hidden_desc: 'All fields require confirmation',
    mode_visible: 'Visible',
    mode_quick: 'Hidden (tap)',
    mode_confirm: 'Hidden (confirm)',
    field_card_number: 'Card number',
    field_cvv: 'CVV',
    field_password: 'Password',
    field_login: 'Login',
    field_doc_number: 'Document number',
    field_iin: 'IIN',
    btn_save: 'Save',
    ok_saved: 'Settings saved',
  },

  // Change password
  change_pwd: {
    title: 'Master Password',
    current_label: 'Current password',
    new_label: 'New password',
    current_placeholder: 'Current master password',
    new_placeholder: 'New master password',
    confirm_placeholder: 'Confirm new password',
    btn: 'Change Password',
    saving: 'Saving...',
    ok: 'Password changed',
    err_wrong: 'Current password is incorrect',
    err_fail: 'Failed to change password',
    val_min8: 'Minimum 8 characters',
    val_mismatch: 'Passwords do not match',
  },

  // Sessions
  sessions: {
    title: 'Active Sessions',
    ok_revoked: 'Session revoked',
  },

  // Field reveal
  reveal: {
    show_label: (label?: string) => `Show ${label ?? 'data'}?`,
  },

  // Search overlay
  search: {
    placeholder: 'Search profiles, cards, passwords...',
    hint: 'Type 2+ characters to search',
    empty: 'Nothing found',
    tag_profile: 'profile',
    tag_document: 'document',
    tag_card: 'card',
    tag_password: 'password',
  },
}

const ru: typeof en = {
  auth: {
    subtitle_login: 'Введите мастер-пароль для входа',
    subtitle_setup: 'Создайте мастер-пароль для хранилища',
    placeholder_password: 'Мастер-пароль',
    placeholder_confirm: 'Подтвердите пароль',
    btn_signin: 'Войти',
    btn_signing: 'Вход...',
    btn_create: 'Создать хранилище',
    btn_creating: 'Создаём...',
    err_wrong: 'Неверный пароль',
    err_create: 'Не удалось создать хранилище',
    ok_created: 'Хранилище создано! Войдите с новым паролем.',
    val_min8: 'Минимум 8 символов',
    val_mismatch: 'Пароли не совпадают',
  },

  nav: {
    home: 'Главная',
    profiles: 'Профили',
    documents: 'Документы',
    cards: 'Карты',
    passwords: 'Пароли',
    settings: 'Настройки',
  },

  common: {
    add: 'Добавить',
    adding: 'Добавляем...',
    save: 'Сохранить',
    saving: 'Сохраняем...',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    back: 'Назад',
    note: 'Заметка',
    country: 'Страна',
    show: 'Показать',
    showQ: (label: string) => `Показать ${label}?`,
    yes: 'Да',
    profile: 'Профиль',
    noProfile: 'Без привязки к профилю',
    tags: 'Теги через запятую',
    copy_ok: 'Скопировано',
    copy_err: 'Не удалось скопировать',
    search_placeholder: 'Поиск...',
    unknown_device: 'Неизвестное устройство',
    current_session: 'текущая',
  },

  dashboard: {
    empty_title: 'Нет профилей',
    empty_desc: 'Добавьте первый профиль на странице «Профили»',
    no_data: 'Нет данных',
    open_profile: 'Открыть профиль',
    section_docs: 'Документы',
    section_cards: 'Карты',
    section_passwords: 'Пароли',
    section_keys: 'Ключи',
  },

  profiles: {
    title: 'Профили',
    new_profile: 'Новый профиль',
    empty_title: 'Нет профилей',
    empty_desc: 'Нажмите «Добавить», чтобы создать профиль',
    last_name: 'Фамилия *',
    first_name: 'Имя *',
    middle_name: 'Отчество',
    iin: 'ИИН',
    phone: 'Телефон',
    birth_date: 'Дата рождения',
    address: 'Адрес',
    ok_deleted: 'Профиль удалён',
    ok_saved: 'Профиль сохранён',
    confirm_delete: 'Удалить профиль?',
    tab_docs: 'Документы',
    tab_cards: 'Карты',
    tab_passwords: 'Пароли',
    tab_keys: 'Ключи',
  },

  documents: {
    title: 'Документы',
    new_doc: 'Новый документ',
    empty_title: 'Нет документов',
    empty_desc: 'Нажмите «Добавить», чтобы добавить документ',
    ok_added: 'Документ добавлен',
    ok_deleted: 'Документ удалён',
    ok_saved: 'Документ сохранён',
    doc_number: 'Номер документа',
    issued_by: 'Кем выдан',
    issue_date: 'Дата выдачи',
    expiry_date: 'Действует до',
    issued_label: 'Выдан',
    expires_label: 'До',
    expired: 'просрочен',
    expiring_soon: 'скоро',
    card_holder: 'Card Holder',
    confirm_delete: 'Удалить документ?',
    select_profile: '— Выберите профиль —',
    select_type: 'Тип документа',
    type_id_card: 'Удостоверение личности',
    type_passport: 'Паспорт',
    type_foreign_passport: 'Загранпаспорт',
    type_driver: 'Водительское удостоверение',
    file_section: 'Скан документа',
    file_upload: 'Прикрепить PDF',
    file_download: 'Скачать',
    file_delete: 'Удалить файл',
    file_uploading: 'Загружаем...',
    file_none: 'Скан не прикреплён',
    file_only_pdf: 'Поддерживаются PDF, JPG и PNG файлы',
    type_diploma: 'Диплом',
    type_birth_certificate: 'Свидетельство о рождении',
    type_power_of_attorney: 'Доверенность',
    type_scan: 'Скан / Копия',
    type_photo: 'Фото',
    file_title: 'Название',
    file_accepted_scan: 'Только PDF',
    file_accepted_photo: 'JPG или PNG',
    field_institution: 'Учебное заведение',
  },

  cards: {
    title: 'Карты',
    new_card: 'Новая карта',
    empty_title: 'Нет карт',
    empty_desc: 'Нажмите «Добавить», чтобы добавить карту',
    ok_added: 'Карта добавлена',
    ok_deleted: 'Карта удалена',
    ok_saved: 'Карта сохранена',
    bank_name: 'Название банка *',
    card_number: 'Номер карты',
    expiry: 'MM/YY',
    cvv: 'CVV',
    holder: 'Имя держателя карты',
    color: 'Цвет карты',
    confirm_delete: 'Удалить карту?',
    select_profile: '— Выберите профиль —',
    color_blue: 'Синяя',
    color_black: 'Чёрная',
    color_gold: 'Золотая',
    color_green: 'Зелёная',
    color_purple: 'Фиолетовая',
    color_red: 'Красная',
    color_silver: 'Серебряная',
  },

  passwords: {
    title: 'Пароли',
    new_pwd: 'Новый пароль',
    empty_title: 'Нет паролей',
    empty_desc: 'Нажмите «Добавить», чтобы добавить пароль',
    ok_added: 'Пароль добавлен',
    ok_deleted: 'Запись удалена',
    ok_saved: 'Запись сохранена',
    service: 'Название сервиса *',
    login: 'Логин',
    password: 'Пароль',
    url: 'URL',
    category: 'Категория',
    confirm_delete: 'Удалить запись?',
    no_profile: '— Без профиля —',
  },

  keys: {
    title: 'Ключи',
    tab_passwords: 'Пароли',
    new_key: 'Новый ключ',
    empty_title: 'Нет ключей',
    empty_desc: 'Добавьте сертификат .p12 / .pfx',
    ok_added: 'Ключ добавлен',
    ok_deleted: 'Ключ удалён',
    ok_saved: 'Ключ сохранён',
    name: 'Название ключа *',
    password: 'Пароль ключа',
    file_section: 'Файл сертификата',
    file_upload: 'Прикрепить .p12 / .pfx',
    file_download: 'Скачать',
    file_delete: 'Удалить файл',
    file_uploading: 'Загружаем...',
    file_none: 'Сертификат не прикреплён',
    file_only_p12: 'Поддерживаются только .p12 и .pfx файлы',
    confirm_delete: 'Удалить ключ?',
  },

  settings: {
    title: 'Настройки',
    visibility_label: 'Видимость полей',
    visibility_desc: 'Настройка отображения чувствительных данных',
    password_label: 'Мастер-пароль',
    password_desc: 'Изменить пароль для входа в хранилище',
    sessions_label: 'Активные сессии',
    sessions_desc: 'Управление входами в систему',
  },

  visibility: {
    title: 'Видимость полей',
    section_preset: 'Пресет',
    section_fields: 'Поля',
    all_open: 'Всё открыто',
    all_open_desc: 'Данные всегда видны',
    balanced: 'Сбалансировано',
    balanced_desc: 'Чувствительные поля скрыты',
    all_hidden: 'Максимум защиты',
    all_hidden_desc: 'Все поля требуют раскрытия',
    mode_visible: 'Видно',
    mode_quick: 'Скрыто (тап)',
    mode_confirm: 'Скрыто (подтверждение)',
    field_card_number: 'Номер карты',
    field_cvv: 'CVV',
    field_password: 'Пароль',
    field_login: 'Логин',
    field_doc_number: 'Номер документа',
    field_iin: 'ИИН',
    btn_save: 'Сохранить',
    ok_saved: 'Настройки сохранены',
  },

  change_pwd: {
    title: 'Мастер-пароль',
    current_label: 'Текущий пароль',
    new_label: 'Новый пароль',
    current_placeholder: 'Текущий мастер-пароль',
    new_placeholder: 'Новый мастер-пароль',
    confirm_placeholder: 'Подтвердите новый пароль',
    btn: 'Изменить пароль',
    saving: 'Сохраняем...',
    ok: 'Пароль изменён',
    err_wrong: 'Текущий пароль неверный',
    err_fail: 'Не удалось изменить пароль',
    val_min8: 'Минимум 8 символов',
    val_mismatch: 'Пароли не совпадают',
  },

  sessions: {
    title: 'Активные сессии',
    ok_revoked: 'Сессия отозвана',
  },

  reveal: {
    show_label: (label?: string) => `Показать ${label ?? 'данные'}?`,
  },

  search: {
    placeholder: 'Поиск по профилям, картам, паролям...',
    hint: 'Введите 2+ символа для поиска',
    empty: 'Ничего не найдено',
    tag_profile: 'профиль',
    tag_document: 'документ',
    tag_card: 'карта',
    tag_password: 'пароль',
  },
}

// ── Language store ────────────────────────────────────────────────────────────

type Lang = 'en' | 'ru'

interface LangState {
  lang: Lang
  setLang: (l: Lang) => void
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'diid-lang' },
  ),
)

// ── Hook ──────────────────────────────────────────────────────────────────────

const translations = { en, ru }

/** Use inside React components */
export function useT() {
  const { lang } = useLangStore()
  return translations[lang]
}

/** Use outside React (toast callbacks, mutation handlers, etc.) */
export function getT() {
  return translations[useLangStore.getState().lang]
}

/** Localized document-type label — use instead of DOCUMENT_TYPE_LABELS */
export function getDocTypeLabel(t: ReturnType<typeof useT>, type: string): string {
  const map: Record<string, string> = {
    id_card: t.documents.type_id_card,
    passport: t.documents.type_passport,
    foreign_passport: t.documents.type_foreign_passport,
    driver_license: t.documents.type_driver,
    diploma: t.documents.type_diploma,
    birth_certificate: t.documents.type_birth_certificate,
    power_of_attorney: t.documents.type_power_of_attorney,
    scan: t.documents.type_scan,
    photo: t.documents.type_photo,
  }
  return map[type] ?? type
}
