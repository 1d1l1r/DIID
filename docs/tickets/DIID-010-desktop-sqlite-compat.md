# DIID-010 — Fix SQLite compatibility in models

## Status
Ready

## Branch
fix/DIID-010-sqlite-compat

## Goal
Модели бэкенда содержат PostgreSQL-специфичный синтаксис, из-за которого десктоп-версия (SQLite) крашится при запуске. Нужно сделать `server_default` значения совместимыми с обоими движками.

## Scope
- `backend/app/models/profile.py` — `server_default=text("'[]'::jsonb")` → убрать `::jsonb` каст. Заменить на `server_default=text("'[]'")` (работает и в PostgreSQL, и в SQLite)
- `backend/app/models/card.py` — `server_default="'blue'"` → проверить и при необходимости исправить кавычки
- Alembic миграции — проверить что существующие миграции не содержат `::jsonb` или других PG-only конструкций. Если содержат — добавить conditional logic или оставить как есть (миграции не запускаются в desktop mode, только `create_all`)
- Убедиться что `create_all` в `backend_runner.py` проходит без ошибок на SQLite

## Out of scope
- Переписка моделей под multi-dialect (engine events, dialect checks)
- Изменение логики Alembic
- Любые фронтенд-правки
- Новый функционал

## Working set
- `backend/app/models/profile.py`
- `backend/app/models/card.py`
- `desktop/backend_runner.py`

## Search keys
- `"::jsonb"`
- `"server_default"`
- `"create_all"`
- `"text("`

## Technical notes
- Десктоп использует `Base.metadata.create_all()`, не Alembic
- `'[]'` без `::jsonb` — валидный JSON literal и в Postgres, и в SQLite
- `func.now()` компилируется в `CURRENT_TIMESTAMP` для SQLite — ок
- `Uuid(as_uuid=True)` маппится в CHAR(32) для SQLite — ок
- `SAEnum` хранится как VARCHAR в SQLite — ок
- `DateTime(timezone=True)` — SQLite не поддерживает timezone нативно, но SQLAlchemy обрабатывает на уровне Python — ок

## Tests / Checks
- `python -c "from sqlalchemy import create_engine; from app.db.base import Base; import app.models.profile; ...; engine = create_engine('sqlite:///test.db'); Base.metadata.create_all(engine)"` → без ошибок
- Удалить test.db после проверки

## Acceptance
- [ ] `create_all` на SQLite проходит без ошибок
- [ ] PostgreSQL миграции не сломаны
- [ ] Десктоп запускается без краша
