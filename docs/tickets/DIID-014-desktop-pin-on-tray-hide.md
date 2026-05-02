# DIID-014 — Activate PIN lock when app hides to tray

## Status
Ready

## Branch
feature/DIID-014-pin-on-tray

## Goal
Когда пользователь закрывает окно (оно уходит в трей), активировать PIN-блокировку (если PIN установлен). При обычном сворачивании (minimize) — не блокировать.

## Scope
- Определить событие "окно скрыто в трей" на фронтенде
- При hide to tray — вызвать блокировку PIN (тот же механизм что уже есть для auto-lock)
- При minimize — не трогать
- Если PIN не установлен — ничего не делать

## Out of scope
- Новый PIN-функционал
- PrivacyScreen (уже есть, работает по visibilitychange)
- Auto-lock по таймеру

## Working set
- `frontend/src/features/pin/pinStore.ts` (или где хранится PIN-состояние)
- `frontend/src/components/layout/AppLayout.tsx` или корневой компонент
- Возможно `desktop/src-tauri/src/lib.rs` — отправлять event на фронт при hide

## Search keys
- `"pinStore"`
- `"locked"`
- `"CloseRequested"`
- `"window.hide"`
- `"visibilitychange"`

## Technical notes
- Tauri `CloseRequested` уже перехвачен в lib.rs — окно скрывается вместо закрытия
- Два варианта детекции на фронте:
  1. Tauri event: из Rust отправлять `app-hidden` event, фронт слушает через `@tauri-apps/api`
  2. Чисто фронт: `visibilitychange` + проверка что это не простой minimize (ненадёжно)
- Вариант 1 надёжнее

## Acceptance
- [ ] Закрытие окна (→ трей) активирует PIN-lock
- [ ] Сворачивание (minimize) НЕ активирует PIN-lock
- [ ] Без установленного PIN — ничего не происходит
