# Deploying the API to Fly.io

The Fly.io deploy build context must include the repository-root Dockerfile.
This repository also contains a backend-only Dockerfile for Render; the root
Dockerfile packages the same Laravel API while using `backend/` as its source.

## Launch

Install and authenticate `flyctl`, then run these commands from the repository
root (not from `backend/`):

```powershell
Set-Location F:\food-delivery-marketplace
flyctl launch --no-deploy --region sin
```

When prompted, choose an app name. Review the generated root `fly.toml` and
confirm its `[http_service]` `internal_port` is `10000`, matching the Nginx
listener in the container. Add `PORT = "10000"` under `[env]` so the entrypoint
binds Nginx to Fly Proxy's configured port.

## Secrets and database

Configure a Fly Postgres database or another reachable PostgreSQL service, then
set the app secrets. Keep `APP_KEY` stable across deploys:

```powershell
flyctl secrets set APP_ENV=production APP_DEBUG=false APP_KEY="<generated Laravel key>" APP_URL="https://<app-name>.fly.dev" DB_CONNECTION=pgsql DATABASE_URL="<PostgreSQL connection URL>" LOG_CHANNEL=stderr LOG_LEVEL=info
```

Generate the key from the backend with `php artisan key:generate --show`.
Do not commit it or put secrets in `fly.toml`. Enable `RUN_MIGRATIONS=true` for
a single Fly Machine, or run migrations once as a release step when deploying
multiple machines:

```powershell
flyctl secrets set RUN_MIGRATIONS=true
```

After reviewing `fly.toml` and setting the database/secrets, deploy from the
repository root:

```powershell
flyctl deploy
```

The image serves the Laravel root route at `/` and listens on the configured
port. Fly Machines have ephemeral local storage; configure external object
storage such as Cloudinary for persistent uploads. Set the frontend origins
and optional Google OAuth or Bakong payment credentials in Fly secrets when
those integrations are enabled.
