# DIID-004 — Fix language switcher to include Kazakh (kk)

## Status
Ready

## Branch
fix/DIID-004-lang-switcher

## Goal
Переключатель языка в Sidebar и Header не включает казахский — только EN/RU. На LoginPage уже исправлено. Нужно привести в соответствие остальные места.

## Scope
- `frontend/src/components/layout/Sidebar.tsx` строка ~70 — `['en', 'ru']` → `['en', 'ru', 'kk']`
- `frontend/src/components/layout/Header.tsx` строка ~68 — сейчас toggle `en↔ru`. Заменить на трёхязычный цикл: `en→ru→kk→en` или на три кнопки как на LoginPage
- Убедиться что нет других мест с хардкод-списком `['en', 'ru']`

## Out of scope
- Новые переводы
- LoginPage (уже исправлен)

## Working set
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/components/layout/Header.tsx`

## Search keys
- `"['en', 'ru']"`
- `"setLang"`
- `"lang ==="`

## Tests / Checks
- Sidebar показывает три кнопки: EN / RU / KK
- Header показывает три кнопки или трёхшаговый toggle
- Переключение работает, сохраняется в localStorage

## Acceptance
- [ ] KK доступен во всех переключателях языка
- [ ] Нет мест с хардкод `['en', 'ru']` без `'kk'`
