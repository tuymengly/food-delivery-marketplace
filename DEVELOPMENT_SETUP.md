# Development Setup

This project is three independent applications in one repo. They are **not** merged —
this file only documents a root-level script that starts all three together for
local development.

| App                  | Folder               | Tech             | URL                     |
|----------------------|-----------------------|------------------|-------------------------|
| Backend API          | `backend/`            | Laravel          | http://127.0.0.1:8000   |
| Customer Frontend    | `customer-frontend/`  | React + Vite     | http://localhost:5174   |
| Admin/Restaurant App | `admin-restaurant/`   | React + Vite     | http://localhost:5173   |

Ports are pinned (not auto-assigned) in each app's config, so they stay
consistent across machines: `customer-frontend/vite.config.js` and
`admin-restaurant/vite.config.js` both set an explicit `server.port`.

## Prerequisites

- PHP 8.2+ and Composer, on your `PATH`
- Node.js 18+ and npm
- A database matching `backend/.env` (this repo currently targets PostgreSQL —
  see `DB_CONNECTION`/`DB_DATABASE` in `backend/.env`). The dev servers will
  still *start* without it; only DB-backed API calls need it running.

## First-time setup (after cloning)

```bash
# 1. Install the root dev-orchestrator's own tooling (concurrently)
npm install

# 2. Install dependencies for all three apps in one go
npm run setup
```

`npm run setup` runs `composer install` in `backend/` and `npm install` in
both frontend folders — equivalent to doing it manually in three terminals.

Then finish Laravel's normal one-time environment setup (this part isn't
scripted on purpose, since it touches your local `.env`/database and
shouldn't run unattended):

```bash
cd backend
copy .env.example .env      # only if backend/.env doesn't exist yet
php artisan key:generate
php artisan migrate
cd ..
```

## Start everything

From the project root:

```bash
npm run dev
```

This runs the backend and both frontends together in one terminal, each
line tagged and colored by name (`BACKEND` / `CUSTOMER` / `ADMIN`).

**Press Ctrl+C once to stop all three.** It also uses `concurrently`'s
`--kill-others`, so if one process crashes, the other two are stopped
automatically instead of being left running.

## URLs

- Backend API: **http://127.0.0.1:8000**
- Customer Frontend: **http://localhost:5174**
- Admin/Restaurant Frontend: **http://localhost:5173**

## VS Code alternative

A `.vscode/tasks.json` is included with a **"Run Full Stack (all 3 apps)"**
task. In VS Code: `Terminal → Run Task… → Run Full Stack (all 3 apps)`. Each
app opens in its own dedicated integrated-terminal panel instead of one
merged terminal — useful if you want to scroll each app's logs separately.
Stop each panel individually (its trash-can/stop icon, or Ctrl+C in that
panel) when done.

## Troubleshooting

- **"Port already in use" on startup**: something else is already bound to
  8000/5173/5174. Find and stop it, e.g. on Windows:
  ```powershell
  netstat -ano | findstr :5173
  taskkill /PID <pid> /F
  ```
- **`php` not found**: make sure your PHP install (e.g. XAMPP's
  `php.exe`) is on `PATH` — check with `php -v`.
- **Backend starts but API calls fail**: your local database probably isn't
  running or doesn't match `backend/.env`.
- **Only running the backend's own tooling**: `backend/composer.json` still
  has its own `composer run dev` (Laravel serve + queue + logs). That's
  independent of this root script and unaffected by it.
