# DIID-013 — Tray menu: Add "About" dialog

## Status
Ready

## Branch
feature/DIID-013-tray-about

## Goal
Добавить пункт "About" в контекстное меню трея. При клике — показать окно/диалог с информацией о приложении.

## Scope
- Добавить пункт "About" в tray menu (`desktop/src-tauri/src/lib.rs`)
- При клике — открыть маленькое окно (или системный диалог) с:
  - Название: DIID
  - Версия: из Cargo.toml (1.0.1)
  - Слоган: "Define Hence Confine Δ"
  - Сайт: https://36.dorozhk.in (кликабельная ссылка)
  - Почта: ilya@dorozhk.in
  - "DOROZHK.IN WAS NOW(HERE)"
- Порядок пунктов в tray: Open DIID → About → Quit

## Out of scope
- Автообновление
- Лицензия

## Working set
- `desktop/src-tauri/src/lib.rs`

## Search keys
- `"MenuItem"`
- `"tray"`
- `"quit"`
- `"show"`

## Technical notes
- Tauri v2: можно использовать `tauri::api::dialog::message` для простого диалога
- Или создать отдельное маленькое webview-окно с HTML
- Версию можно читать через `app.config().version`

## Acceptance
- [ ] Пункт "About" в tray menu
- [ ] Показывает версию, сайт, почту
- [ ] Ссылка на сайт кликабельна
