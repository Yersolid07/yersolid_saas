<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#059669">

        <title>{{ $title ?? config('app.name', 'Laravel') }}</title>
        <link rel="icon" type="image/png" href="/images/logo.png">
        <link rel="manifest" href="/manifest.webmanifest">
        <link rel="apple-touch-icon" href="/images/logo.png">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        <script>
          if (typeof window.Ziggy !== 'undefined' && typeof window.Ziggy.route === 'function') {
            window.route = window.Ziggy.route;
          }
        </script>
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])

        @if(config('services.tripay.api_key'))
            <script src="https://cdn.tripay.co.id/js/tripay.min.js" data-client-key="{{ config('services.tripay.merchant_code') }}"></script>
        @endif

        @inertiaHead

        <!-- SEO Meta Tags -->
        <meta name="description" content="{{ $description }}">
        <meta name="image" content="{{ $image }}">

        <!-- Open Graph -->
        <meta property="og:title" content="{{ $title }}">
        <meta property="og:description" content="{{ $description }}">
        <meta property="og:image" content="{{ $image }}">
        <meta property="og:url" content="{{ request()->url() }}">
        <meta property="og:type" content="website">

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $title }}">
        <meta name="twitter:description" content="{{ $description }}">
        <meta name="twitter:image" content="{{ $image }}">

        <!-- JSON-LD Schema -->
        @if(isset($schema))
            <!--email_off--><script type="application/ld+json">{!! $schema !!}</script><!--/email_off-->
        @endif

        <!-- Theme Colors -->
        @php
            $themeColors = \App\Models\Setting::get('theme_colors');
        @endphp
        @if($themeColors)
        <style>
            :root {
                @foreach(json_decode($themeColors, true) as $key => $val)
                --color-primary-{{ $key }}: {{ $val }};
                @endforeach
            }
        </style>
        @endif
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>