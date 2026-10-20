FROM php:8.4-cli

# Tools composer needs, plus the libraries behind the PHP extensions:
# pdo_mysql (database), zip + gd (phpoffice/phpspreadsheet for the Excel imports).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libzip-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql zip gd \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Windows checkouts can turn line endings into CRLF, which breaks a shell script.
COPY docker-entrypoint.sh /usr/local/bin/siknayan-entrypoint
RUN sed -i 's/\r$//' /usr/local/bin/siknayan-entrypoint \
    && chmod +x /usr/local/bin/siknayan-entrypoint

WORKDIR /var/www/html

EXPOSE 8000

ENTRYPOINT ["siknayan-entrypoint"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
