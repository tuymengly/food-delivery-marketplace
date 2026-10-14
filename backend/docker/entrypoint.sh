#!/bin/sh
set -e

# Render injects PORT at runtime; fall back to 10000 for local `docker run`.
: "${PORT:=10000}"
export PORT

# Render's Postgres add-on may only expose a single DATABASE_URL-style var
# under a different name than Laravel expects; map it if DB_URL isn't set.
if [ -z "$DB_URL" ] && [ -n "$DATABASE_URL" ]; then
    export DB_URL="$DATABASE_URL"
fi

# Only substitute $PORT — leave nginx's own $uri/$document_root/etc. alone.
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

cd /var/www/html

if [ "${APP_ENV:-production}" = "production" ]; then
    if [ -z "${APP_KEY:-}" ]; then
        echo "APP_KEY must be set for production." >&2
        exit 1
    fi

    if [ "${DB_CONNECTION:-sqlite}" != "pgsql" ]; then
        echo "DB_CONNECTION must be set to pgsql for this production image." >&2
        exit 1
    fi
fi

php artisan config:clear

case "${RUN_MIGRATIONS:-false}" in
    true|1|yes|TRUE|YES)
        php artisan migrate --force
        ;;
    false|0|no|FALSE|NO|"")
        ;;
    *)
        echo "RUN_MIGRATIONS must be true or false." >&2
        exit 1
        ;;
esac

# Config/route/view caches are rebuilt on every boot (not at image build
# time) so they always reflect the real runtime environment variables that
# Render injects into the container.
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
