# DIID-015 — Uninstall script: kill processes + delete data

## Status
Ready

## Branch
feature/DIID-015-uninstall-cleanup

## Goal
При удалении приложения через инсталлер — завершать все процессы DIID и удалять пользовательские данные (БД, uploads, ключи).

## Scope
- NSIS: добавить custom uninstall script в `tauri.conf.json` → `bundle.windows.nsis`
  - Завершить процессы: `diid-desktop.exe`, `diid-backend.exe`
  - Удалить data directory: `%APPDATA%\DIID\` (diid.db, uploads/, .vault_key)
  - Спросить подтверждение перед удалением данных ("Delete all vault data? This cannot be undone.")
- MSI: аналогичная логика через WiX custom actions (или отдельный скрипт)
- Добавить кастомное изображение в MSI-инсталлер (banner/dialog) из `images/DIID_install.png`

## Out of scope
- macOS uninstaller
- Экспорт/бэкап данных перед удалением
- Linux

## Working set
- `desktop/src-tauri/tauri.conf.json`
- Новый файл: `desktop/src-tauri/installer/uninstall.nsi` (или inline в конфиге)
- `images/DIID_install.png` (исходник для MSI banner)
- Новые файлы: `desktop/src-tauri/installer/banner.bmp` (493×58), `desktop/src-tauri/installer/dialog.bmp` (493×312)

## Search keys
- `"nsis"`
- `"wix"`
- `"bundle.windows"`
- `"installerScript"`
- `"APPDATA"`

## Technical notes
- Tauri NSIS config поддерживает `installerScript` для кастомных скриптов
- Для завершения процессов в NSIS: `nsExec::ExecToLog 'taskkill /F /IM diid-backend.exe'`
- MSI banner: 493×58 BMP, dialog: 493×312 BMP
- Подтверждение удаления данных — MessageBox в NSIS uninstall section
- Keyring credentials (`DIID-Vault`) тоже стоит удалить, но это сложнее (нужен cmdkey или PowerShell)

## Tests / Checks
- Установить → запустить → удалить через "Установка и удаление программ"
- Процессы убиты, файлы удалены
- MSI-инсталлер показывает кастомное изображение

## Acceptance
- [ ] Удаление убивает процессы diid-desktop и diid-backend
- [ ] Данные удалены (после подтверждения пользователем)
- [ ] MSI показывает кастомное изображение
- [ ] Инсталлеры собираются без ошибок
