# DIID-003 — Add Kazakh language (kk)

## Status
Ready

## Branch
feature/DIID-003-kazakh-lang

## Goal
Добавить казахский язык (kk) как третий вариант локализации. Все строки интерфейса должны быть переведены на казахский.

## Scope
- Добавить полный словарь `kk` в `i18n.ts` — перевод всех секций (auth, nav, common, dashboard, profiles, documents, cards, passwords, keys, stashes, notes, pin, settings, visibility, change_pwd, sessions, users, reveal, search)
- Тип `Lang` расширить: `'en' | 'ru'` → `'en' | 'ru' | 'kk'`
- `translations` объект — добавить `kk`
- Переключатель языка на LoginPage (`pages/login/index.tsx`) — добавить третью кнопку `KK`
- Если есть другие места с хардкод-списком языков — обновить

## Out of scope
- Бэкенд — не трогать, локализация только на фронте
- RTL — казахский LTR, ничего менять не нужно
- Автоопределение языка по браузеру
- Шрифты — стандартные покрывают казахский

## Working set
- `frontend/src/lib/i18n.ts` — основной файл, словари + тип Lang
- `frontend/src/pages/login/index.tsx` — переключатель языков

## Search keys
- `"Lang"`
- `"useLangStore"`
- `"translations"`
- `"setLang"`
- `"(['en', 'ru']"`

## Technical notes
- Словарь `kk` должен иметь тип `typeof en` (как `ru`) — TypeScript не даст забыть ключ
- Казахский пишется на кириллице (қазақ тілі). Специфические буквы: ә, ғ, қ, ң, ө, ұ, ү, і, һ
- Функциональные значения (showQ, show_label) тоже нужно перевести — это лямбды, не строки
- Переключатель на LoginPage — сейчас массив `['en', 'ru']`, расширить до `['en', 'ru', 'kk']`

## Tests / Checks
- Переключить на KK → все тексты на казахском, без fallback на EN/RU
- TypeScript компилируется без ошибок (kk : typeof en)
- Переключатель показывает три кнопки на странице логина
- Выбор языка сохраняется в localStorage (`diid-lang`)

## Acceptance
- [ ] scope выполнен
- [ ] out of scope не тронут
- [ ] все ключи переведены (TypeScript гарантирует полноту)
- [ ] переключатель языков показывает EN / RU / KK
- [ ] казахские символы (ә, ғ, қ, ң, ө, ұ, ү, і) отображаются корректно

## Done
Казахский язык доступен как третий вариант локализации.

## Not done
- Автоопределение языка
- Проверка нативным носителем (рекомендуется)
