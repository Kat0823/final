FROM php:8.4-cli

# Tools composer needs, plus the libraries behind the PHP extensions:
# pdo_mysql (database), zip + gd (phpoffice/phpspreadsheet for the Excel imports).
# default-mysql-client gives mysqldump / mariadb-dump for the System Admin
# Data Backup page (no XAMPP needed).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        default-mysql-client \
        libzip-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql zip gd opcache \
    && rm -rf /var/lib/apt/lists/*

# OPcache keeps Laravel's code compiled in memory instead of reading and
# compiling every file on each request (much faster API answers).
# Files are still checked for changes every 2 seconds, so edits show up.
RUN { \
        echo 'opcache.enable=1'; \
        echo 'opcache.enable_cli=1'; \
        echo 'opcache.memory_consumption=128'; \
        echo 'opcache.interned_strings_buffer=16'; \
        echo 'opcache.max_accelerated_files=20000'; \
        echo 'opcache.validate_timestamps=1'; \
        echo 'opcache.revalidate_freq=2'; \
        echo 'realpath_cache_size=4096K'; \
        echo 'realpath_cache_ttl=600'; \
        echo 'upload_max_filesize=512M'; \
        echo 'post_max_size=520M'; \
    } > /usr/local/etc/php/conf.d/siknayan-performance.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Windows checkouts can turn line endings into CRLF, which breaks a shell script.
COPY docker-entrypoint.sh /usr/local/bin/siknayan-entrypoint
RUN sed -i 's/\r$//' /usr/local/bin/siknayan-entrypoint \
    && chmod +x /usr/local/bin/siknayan-entrypoint

WORKDIR /var/www/html

EXPOSE 8000

ENTRYPOINT ["siknayan-entrypoint"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
