# DIID-001 — Multi-user support (password-only auth)

## Status
Ready

## Branch
feature/DIID-001-multiuser

## Goal
Мастер-пользователь (первый, кто создал vault) может создавать до 8 дополнительных пользователей. Логин остаётся без username — система определяет юзера по паролю. Каждый юзер может сменить свой пароль и удалить свой аккаунт.

## Scope
- Добавить поле `role` в модель `User` (`master` / `member`). Alembic-миграция
- Первый юзер (`/auth/setup`) автоматически получает `role = "master"`
- `POST /auth/users` — мастер создаёт юзера (принимает `password`). Лимит: максимум 9 юзеров total. Возвращает `user_id`
- `GET /auth/users` — мастер видит список юзеров (id, username/label, role, created_at). Обычные юзеры получают 403
- `DELETE /auth/me` — юзер удаляет СВОЙ аккаунт. Мастер не может удалить себя (vault остаётся без хозяина). Каскадно удалять сессии
- Логин (`POST /auth/login`) — перебирать всех юзеров, `verify_password` по каждому, возвращать первое совпадение. Обязательно: при первом совпадении — break, не проверять остальных
- `GET /auth/me` — добавить `role` в ответ
- Frontend: страница управления юзерами в Settings (только для master). Форма создания юзера (только пароль). Список существующих юзеров
- Frontend: кнопка "Удалить аккаунт" в Settings для обычных юзеров
- Frontend: `User` тип — добавить `role`
- `authApi` — добавить `createUser`, `listUsers`, `deleteMe`

## Out of scope
- Username при логине — НЕ добавлять, вход только по паролю
- Удаление чужих аккаунтов
- Разграничение доступа к данным между юзерами (все видят всё) — это отдельная задача
- Desktop app — не трогать
- Права/permissions (RBAC) — пока только master/member
- Имена/лейблы юзеров — пока без них, только id и role

## Working set
Backend:
- `backend/app/models/user.py`
- `backend/app/schemas/auth.py`
- `backend/app/api/v1/auth.py`
- `backend/app/api/deps.py`
- `backend/app/core/security.py`
- новая миграция в `backend/alembic/versions/`

Frontend:
- `frontend/src/lib/api/auth.ts`
- `frontend/src/lib/types.ts`
- `frontend/src/features/auth/authStore.ts`
- `frontend/src/pages/settings/index.tsx`
- новая страница `frontend/src/pages/settings/users.tsx`
- `frontend/src/lib/i18n.ts` (новые строки)
- `frontend/src/app/router.tsx` (новый route)

## Search keys
- `"role"`
- `"master"`
- `"User"`
- `"setup_vault"`
- `"auth/login"`
- `"authApi"`
- `"get_current_user"`

## Technical notes
- Argon2 ~200-300ms per verify. При 9 юзерах worst case login ~2-3s. Приемлемо
- При переборе паролей — early return при первом совпадении
- Существующий юзер `admin` из `/auth/setup` должен стать `master`. Миграция: `UPDATE users SET role = 'master' WHERE role IS NULL`
- `username` пока оставить в модели (уже есть), но не использовать при логине. Для новых юзеров генерировать `user_N` автоматически
- При удалении аккаунта каскадно удаляются сессии (уже есть `ondelete="CASCADE"` на `sessions.user_id`)

## Tests / Checks
- `POST /auth/setup` → юзер с `role=master`
- `POST /auth/users` от мастера с паролем → 201, новый юзер `role=member`
- `POST /auth/users` от member → 403
- `POST /auth/users` когда уже 9 юзеров → 409
- `POST /auth/login` с паролем member → логин как member
- `POST /auth/login` с паролем master → логин как master
- `DELETE /auth/me` от member → 204, юзер и сессии удалены
- `DELETE /auth/me` от master → 403
- `GET /auth/users` от master → список
- `GET /auth/users` от member → 403

## Acceptance
- [ ] scope выполнен
- [ ] out of scope не тронут
- [ ] миграция применяется без ошибок
- [ ] существующий admin-юзер становится master
- [ ] логин работает по паролю без username
- [ ] master может создавать юзеров
- [ ] member может удалить свой аккаунт
- [ ] master не может удалить себя
- [ ] лимит 9 юзеров работает
- [ ] фронт отображает управление юзерами для master

## Done
Multi-user vault: master создаёт юзеров по паролю, юзеры могут удалить себя, логин без username.

## Not done
- Разграничение доступа к данным между юзерами
- Desktop app support
- Имена/аватарки юзеров
