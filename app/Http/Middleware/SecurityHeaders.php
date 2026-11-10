<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Adds baseline security headers to every response.
 * Defense-in-depth: HSTS is set by nginx; this covers clickjacking,
 * MIME sniffing, referrer leakage, and a sane CSP for the Inertia SPA.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(self)');
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Content-Security-Policy — tuned for Inertia + React + Google SSO + payment gateways.
        // Allows: self, inline styles (Inertia), Google Fonts, Midtrans/Tripay scripts, data: for images.
        $csp = implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.tripay.co.id https://tripay.co.id https://accounts.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://api.tripay.co.id https://accounts.google.com",
            "frame-src 'self' https://accounts.google.com https://app.tripay.co.id",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]);
        $response->headers->set('Content-Security-Policy', $csp);

        return $response;
    }
}
