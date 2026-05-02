# DIID-011 — Sync desktop with current backend (multiuser + role)

## Status
Ready (depends on DIID-010)

## Branch
feature/DIID-011-desktop-sync

## Goal
Десктоп-бэкенд отстал от серверного — нет поддержки multiuser (role, create_user, delete_me, password-loop login). Синхронизировать `backend_runner.py` и убедиться что вся новая функциональность работает на SQLite.

## Scope
- Убедиться что `backend_runner.py` импортирует все модели (проверить что ничего не пропущено после DIID-001)
- Проверить что `User.role` с `server_default="member"` работает на SQLite
- Проверить что login endpoint (перебор паролей) работает на SQLite
- Проверить что `DELETE /auth/me` каскадно удаляет сессии и user_settings на SQLite (CASCADE поведение)
- Проверить что лимит 9 юзеров работает

## Out of scope
- Фронтенд — уже обновлён в web-версии, десктоп грузит тот же билд
- Новая функциональность
- Android

## Working set
- `desktop/backend_runner.py`
- `backend/app/models/user.py`
- `backend/app/api/v1/auth.py`

## Technical notes
- `backend_runner.py` уже импортирует `app.models.user` и `app.models.user_settings` — нужно только убедиться что create_all подтянет новое поле `role`
- SQLite поддерживает `ON DELETE CASCADE`, но нужно включить `PRAGMA foreign_keys = ON` — проверить что это сделано в engine config
- Если `foreign_keys` pragma не включена — добавить event listener в `backend_runner.py`

## Tests / Checks
- Десктоп запускается → setup → создать master
- Создать member через /settings/users
- Логин по паролю member → попадает в аккаунт member
- Member удаляет себя → сессии и settings удалены

## Acceptance
- [ ] Multiuser работает на десктопе
- [ ] CASCADE удаление работает на SQLite
- [ ] Существующие данные (если есть) не ломаются
