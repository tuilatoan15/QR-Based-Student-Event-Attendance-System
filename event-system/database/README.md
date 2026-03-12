## Database (SQL Server) — Migrations & Seeds

This folder contains a simple, production-friendly migration + seed system for SQL Server.

### Prerequisites
- SQL Server running and reachable via environment variables
- Node dependencies installed (`npm install`)

### Environment variables
The migration/seed runners reuse the existing DB env vars from `config/db.js`:

- `DB_SERVER` (default: `localhost`)
- `DB_PORT` (default: `1433`)
- `DB_USER`  (default: `sa`)
- `DB_PASSWORD`
- `DB_NAME` (default: `event_system`)

### Run migrations
From `event-system/`:

```bash
npm run db:migrate
```

### Run seeders
```bash
npm run db:seed
```

### Notes
- Migrations run **in filename order**.
- Seeders run **in filename order**.
- Scripts support `GO` batch separators in `.sql` files.

