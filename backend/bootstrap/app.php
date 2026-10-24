<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
  ->withMiddleware(function (Middleware $middleware): void {
    $middleware->redirectGuestsTo(function () {
        return null;
    });

    // Real visitor IP behind Docker / a reverse proxy (for the audit log
    // and sign-in limits). List the proxy addresses in TRUSTED_PROXIES,
    // e.g. "172.16.0.0/12" for Docker's network, or "127.0.0.1".
    // Empty (the default): trust no proxy, so X-Forwarded-For from a
    // visitor is ignored and cannot fake an IP address.
    $proxies = trim((string) env('TRUSTED_PROXIES', ''));

    if ($proxies !== '') {
        $middleware->trustProxies(
            at: $proxies === '*' ? '*' : array_values(array_filter(array_map('trim', explode(',', $proxies)))),
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO
        );
    }
}) 

    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();

