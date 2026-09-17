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

# Config/route/view caches are rebuilt on every boot (not at image build
# time) so they always reflect the real runtime environment variables that
# Render injects into the container.
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

if [ "$RUN_MIGRATIONS" = "true" ]; then
    php artisan migrate --force
fi

exec "$@"
