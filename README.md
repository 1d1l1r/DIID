# DIID — Personal Document Vault

A self-hosted, encrypted vault for storing family documents, bank cards, and passwords. Runs entirely on your own server — no cloud, no third parties.

---

## Features

- **Profiles** — organize everything by person (family members, etc.)
- **Documents** — ID cards, passports, driver's licenses with expiry tracking
- **Bank cards** — stored with encrypted numbers and CVV, beautiful card UI
- **Passwords** — service credentials grouped by category
- **Field visibility** — per-field control: always visible / tap to reveal / confirm to reveal
- **Search** — instant full-text search across all records
- **EN / RU** — full interface localization with persistent preference
- **Sessions** — view and revoke active login sessions
- **Encryption** — all sensitive fields encrypted at rest with Fernet (AES-128-CBC)
- **Single master password** — argon2id hashing, no username needed

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI · SQLAlchemy · Alembic · argon2-cffi · cryptography |
| Database | PostgreSQL 16 |
| Frontend | React 19 · TypeScript · Vite · Tailwind CSS v4 |
| State | Zustand · TanStack Query v5 |
| Deployment | Docker · Docker Compose |

---

## Quick Deploy (Production)

**Requirements:** server with Docker + Docker Compose installed.

```bash
# 1. Clone
git clone https://github.com/1d1l1r/DIID.git
cd DIID

# 2. Configure environment
cp backend/.env.example backend/.env
nano backend/.env
```

Fill in `.env`:

```env
POSTGRES_PASSWORD=your_strong_db_password

# Generate encryption key:
# python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
VAULT_ENCRYPTION_KEY=your_generated_key

# Your domain or server IP (for CORS)
CORS_ORIGINS=["https://yourdomain.com"]

SESSION_EXPIRE_DAYS=30
APP_ENV=production
```

```bash
# 3. Start
docker compose up -d

# 4. Apply database migrations
docker compose exec backend alembic upgrade head
```

Open the app in your browser — you'll be prompted to create a master password on first run.

> **Data lives in a named Docker volume** (`postgres_data`) and persists across restarts and image rebuilds.

---

## Development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"

cp .env.example .env  # edit DATABASE_URL to point to local postgres

alembic upgrade head
uvicorn app.main:app --reload
```

API available at `http://localhost:8000` · Swagger UI at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at `http://localhost:5173`

---

## Updating

```bash
git pull
docker compose up -d --build
docker compose exec backend alembic upgrade head
```

---

## Security Notes

- Keep `.env` out of version control (already in `.gitignore`)
- Use a strong, unique `POSTGRES_PASSWORD` and `VAULT_ENCRYPTION_KEY`
- Put the app behind a reverse proxy (nginx / Caddy) with HTTPS
- `VAULT_ENCRYPTION_KEY` rotation is supported via comma-separated keys (MultiFernet)
- Sessions are invalidated on master password change

---

## License

MIT
