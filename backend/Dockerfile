# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: install PHP (production) dependencies with Composer.
# Kept separate so vendor/ is cached unless composer.json/composer.lock change.
# ---------------------------------------------------------------------------
FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --no-interaction \
    --prefer-dist \
    --ignore-platform-reqs

# ---------------------------------------------------------------------------
# Stage 2: runtime image — PHP-FPM + nginx, supervised by supervisord,
# listening on Render's dynamic $PORT.
# ---------------------------------------------------------------------------
FROM php:8.3-fpm AS app

ARG APP_DIR=/var/www/html
WORKDIR ${APP_DIR}

# System packages + PHP extensions actually required by this app:
# - pdo_pgsql/pgsql: Render PostgreSQL
# - mbstring, bcmath, intl, zip, gd: required/used by Laravel + Cloudinary/image handling
# - pcntl: used by Laravel's queue worker signal handling
# - opcache: production performance
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        libicu-dev \
        libzip-dev \
        libpng-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
        libonig-dev \
        libcurl4-openssl-dev \
        nginx \
        supervisor \
        gettext-base \
        unzip \
        ca-certificates \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_pgsql \
        pgsql \
        mbstring \
        intl \
        zip \
        gd \
        bcmath \
        pcntl \
        curl \
        opcache \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && rm -rf /var/lib/apt/lists/* \
    # Sanity check: fail the build early if a required extension is missing.
    && for ext in pdo_pgsql pgsql mbstring intl zip gd bcmath pcntl curl opcache; do \
        php -m | grep -qi "${ext}" || (echo "Missing PHP extension: ${ext}" && exit 1); \
    done

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Production PHP settings
COPY docker/php.ini /usr/local/etc/php/conf.d/99-app.ini

# Application source
COPY . .

# Bring in vendor/ installed in the composer stage, then generate the
# optimized autoloader now that the full app source is present.
COPY --from=vendor /app/vendor ./vendor
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev \
    && php artisan package:discover --ansi

# Writable directories Laravel needs at runtime.
RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# nginx + supervisord configuration
COPY docker/nginx.conf.template /etc/nginx/conf.d/default.conf.template
RUN rm -f /etc/nginx/sites-enabled/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Render assigns $PORT at runtime; this EXPOSE is documentation only.
EXPOSE 10000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
