# DIID-012 — Custom installer image for Windows

## Status
Ready

## Branch
feature/DIID-012-installer-image

## Goal
Заменить стандартное изображение Windows-инсталлера (NSIS/WiX через Tauri) на кастомное из `images/DIID_install.png`.

## Scope
- Определить какой бандлер используется (NSIS или WiX) — в `tauri.conf.json` targets="all"
- Для NSIS: добавить `installerIcon`, `headerImage`, `sidebarImage` в конфиг
- Для WiX: добавить `bannerPath`, `dialogImagePath`
- Подготовить изображение в нужных размерах/форматах:
  - NSIS sidebar: 164×314 BMP
  - NSIS header: 150×57 BMP
  - WiX banner: 493×58 BMP
  - WiX dialog: 493×312 BMP
- Исходник: `images/DIID_install.png` — ресайз/кроп/конверт в нужные форматы
- Положить подготовленные изображения в `desktop/src-tauri/installer/`

## Out of scope
- macOS installer кастомизация
- Иконка приложения (уже генерируется из logo.png в build_win.ps1)
- Splash screen

## Working set
- `desktop/src-tauri/tauri.conf.json`
- `images/DIID_install.png` (исходник)
- новая папка `desktop/src-tauri/installer/` (output)

## Search keys
- `"bundle"`
- `"windows"`
- `"nsis"`
- `"wix"`
- `"installerIcon"`
- `"sidebarImage"`

## Technical notes
- Tauri v2 по умолчанию использует NSIS для Windows
- NSIS sidebar image должен быть 164×314 пикселей, BMP формат
- Исходное изображение вертикальное (портретная ориентация) — хорошо подходит для sidebar
- В `tauri.conf.json` → `bundle.windows.nsis` добавить поля для кастомных изображений
- Документация: https://v2.tauri.app/reference/config/#nsisconfig

## Tests / Checks
- `npx tauri build` → инсталлер собирается без ошибок
- Запустить .exe инсталлер → кастомное изображение видно на боковой панели

## Acceptance
- [ ] Инсталлер показывает кастомное изображение DIID вместо дефолтного
- [ ] Билд проходит без ошибок
