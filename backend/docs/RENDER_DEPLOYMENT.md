# Deploying the API to Render with Docker

## Web Service setup

Create a Render **Web Service** from this repository and configure:

- **Runtime:** Docker
- **Root Directory:** `backend`
- **Dockerfile Path:** `./Dockerfile`
- **Health Check Path (optional):** `/`
- Leave the build and start commands unset so Render uses the Dockerfile.

The image listens on Render's injected `PORT` (with `10000` as a local Docker
fallback). It runs Nginx and PHP-FPM under Supervisor. Build locally from the
`backend` directory with `docker build -t food-delivery-api .`.

## Required environment variables

Add these in the Web Service's Render **Environment** settings. Do not commit
production secrets to `.env` or the repository.

| Variable | Value |
| --- | --- |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | A persistent Laravel key, generated with `php artisan key:generate --show`; do not change it between deploys |
| `APP_URL` | `https://food-delivery-api-ues3.onrender.com` |
| `LOG_CHANNEL` | `stderr` |
| `LOG_LEVEL` | `info` |
| `DB_CONNECTION` | `pgsql` |
| `DATABASE_URL` | The Internal Database URL from the Render PostgreSQL instance; the entrypoint maps it to Laravel's `DB_URL` |

Use the database's internal URL when the database and Web Service are in the
same Render region. If configuring individual connection fields instead, set
`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD`, and omit
`DATABASE_URL`. If connecting over an external PostgreSQL URL, use TLS as
required by that connection (for example, `DB_SSLMODE=require`).

## Migrations and runtime stores

Run migrations once before serving production traffic. For a single Web
Service instance, set `RUN_MIGRATIONS=true` to run `php artisan migrate --force`
on each container boot. For multiple instances or coordinated deployments,
leave it unset and run that command once as a deploy/release step to avoid
concurrent migration attempts.

This app's example configuration uses database-backed sessions, cache, and
queues. The included migrations create their tables. Keep `SESSION_DRIVER` and
`CACHE_STORE` set to `database` if using those defaults. Set
`QUEUE_CONNECTION=database` only when a separate Render Background Worker is
running `php artisan queue:work`; otherwise use `QUEUE_CONNECTION=sync` so
queued work is not left unprocessed.

Render's container filesystem is ephemeral. Do not rely on files saved to the
local storage disk persisting across deploys or restarts. For image uploads,
configure Cloudinary and set `FILESYSTEM_DISK=cloudinary`.

## Optional integration variables

Set these only when the corresponding feature is enabled:

- `CUSTOMER_APP_URL` and `ADMIN_APP_URL`: public HTTPS origins for the two
  frontends. These are used for CORS and frontend redirects. Alternatively,
  set `CORS_ALLOWED_ORIGINS` to a comma-separated list of exact origins.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`: Google
  OAuth credentials and the callback URL
  `https://food-delivery-api-ues3.onrender.com/api/auth/google/callback`.
- `CLOUDINARY_URL` and `FILESYSTEM_DISK=cloudinary`: Cloudinary image storage.
- `KHQR_BAKONG_TOKEN` and `KHQR_BAKONG_ID`: Bakong payment verification and
  merchant identity. `KHQR_BAKONG_API_URL` can override the default API URL.

Do not set `CORS_ALLOWED_ORIGINS` to a wildcard when using credentials. This
API uses bearer-token authentication by default, so
`CORS_SUPPORTS_CREDENTIALS` should remain `false`.
