# syntax=docker/dockerfile:1

# Build PHP extensions once and use the same PHP platform for Composer
# dependency resolution and the final runtime image.
FROM php:8.3-fpm AS php-base

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        libicu-dev \
        libzip-dev \
        libpng-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
        libonig-dev \
        libcurl4-openssl-dev \
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
    && rm -rf /var/lib/apt/lists/* \
    && for ext in pdo_pgsql pgsql mbstring intl zip gd bcmath pcntl curl opcache; do \
        php -m | grep -qi "${ext}" || (echo "Missing PHP extension: ${ext}" && exit 1); \
    done

# Resolve production dependencies against the exact PHP runtime platform.
FROM php-base AS dependencies
WORKDIR /app
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY backend/composer.json backend/composer.lock ./
RUN composer install \
        --no-dev \
        --no-scripts \
        --no-autoloader \
        --no-interaction \
        --prefer-dist \
        --no-progress \
    && rm -rf /root/.composer/cache

# Generate the optimized autoloader with application source available.
FROM php-base AS build
ARG APP_DIR=/var/www/html
WORKDIR ${APP_DIR}
COPY backend/ ./
COPY --from=dependencies /app/vendor ./vendor
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN composer dump-autoload --classmap-authoritative --no-dev --no-scripts \
    && php artisan package:discover --ansi \
    && composer check-platform-reqs --no-dev \
    && mkdir -p storage/app/private storage/app/public \
        storage/framework/cache/data storage/framework/sessions \
        storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Final web runtime. Composer and build-stage files are not copied into it.
FROM php-base AS app
ARG APP_DIR=/var/www/html
WORKDIR ${APP_DIR}

RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx \
        supervisor \
        gettext-base \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build ${APP_DIR} ${APP_DIR}
COPY backend/docker/php.ini /usr/local/etc/php/conf.d/99-app.ini
COPY backend/docker/nginx.conf.template /etc/nginx/conf.d/default.conf.template
RUN rm -f /etc/nginx/sites-enabled/default
COPY backend/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY backend/docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 10000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
