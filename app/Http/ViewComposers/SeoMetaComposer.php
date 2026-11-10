<?php

namespace App\Http\ViewComposers;

use App\Models\Setting;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\View\View;

class SeoMetaComposer
{
    /**
     * Bind data to the view.
     *
     * @return void
     */
    public function compose(View $view)
    {
        $routeName = Request::route() ? Request::route()->getName() : null;

        // Default values (overridable per-install via Settings CMS → SEO group)
        $title = config('app.name', 'My Application');
        $description = Setting::get('meta_description', config('app.name').' – official website.');
        $image = Setting::get('meta_image', asset('/images/logo.png'));
        $schema = null; // JSON-LD schema

        // Override based on route. Every default below is a generic template:
        // buyers customize these strings (or override meta_* keys in Settings).
        switch ($routeName) {
            case 'home':
                $title = config('app.name');
                $description = Setting::get('meta_description', 'Welcome to '.config('app.name').'. Explore our menu, book a table, and order online.');
                $image = asset('/images/home.jpg'); // You may need to add this image
                $schema = $this->getRestaurantSchema();
                break;
            case 'catalog.public':
                $title = 'Menu – '.config('app.name');
                $description = Setting::get('meta_catalog_description', 'Browse our full food and drink menu. Up-to-date prices, available for dine-in or takeaway.');
                $image = asset('/images/menu.jpg');
                $schema = $this->getMenuSchema();
                break;
            case 'facilities.public':
                $title = 'Facilities – '.config('app.name');
                $description = Setting::get('meta_facilities_description', 'Discover the facilities we provide, from gazebos to kids play areas.');
                $image = asset('/images/facilities.jpg');
                break;
            case 'privacy':
                $title = 'Privacy Policy – '.config('app.name');
                $description = Setting::get('meta_privacy_description', 'Read the privacy policy of '.config('app.name').' to learn how we handle your personal data.');
                break;
            case 'terms':
                $title = 'Terms of Service – '.config('app.name');
                $description = Setting::get('meta_terms_description', 'Review the terms of service that apply when using '.config('app.name').'.');
                break;
            case 'about':
                $title = 'About Us – '.config('app.name');
                $description = Setting::get('meta_about_description', 'Get to know '.config('app.name').' – our story, mission, and the team behind our service.');
                $image = asset('/images/about.jpg');
                break;
                // Add more routes as needed
        }

        // Share with view
        $view->with(compact('title', 'description', 'image', 'schema'));
    }

    /**
     * Get JSON-LD schema for the restaurant (home page).
     *
     * @return string
     */
    protected function getRestaurantSchema()
    {
        $setting = Setting::all()->pluck('value', 'key')->toArray();

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Restaurant',
            'name' => $setting['app_name'] ?? config('app.name', 'My Restaurant'),
            'image' => $this->getFirstImage($setting['app_logo'] ?? '/images/logo.png'),
            'description' => $setting['meta_description'] ?? 'A great place to eat and drink.',
            'address' => [
                '@type' => 'PostalAddress',
                'streetAddress' => $setting['address'] ?? 'Street Address',
                'addressLocality' => $setting['city'] ?? 'City',
                'addressRegion' => $setting['province'] ?? 'Province',
                'postalCode' => $setting['postal_code'] ?? '12345',
                'addressCountry' => 'ID',
            ],
            'geo' => [
                '@type' => 'GeoCoordinates',
                'latitude' => $setting['latitude'] ?? '0.0000',
                'longitude' => $setting['longitude'] ?? '0.0000',
            ],
            'telephone' => $setting['phone'] ?? '+62 000 0000 0000',
            'priceRange' => $setting['price_range'] ?? '$$',
            'servesCuisine' => [
                'Indonesian',
                'Local Cuisine',
            ],
            'openingHoursSpecification' => [
                [
                    '@type' => 'OpeningHoursSpecification',
                    'dayOfWeek' => [
                        'Monday',
                        'Tuesday',
                        'Wednesday',
                        'Thursday',
                        'Friday',
                        'Saturday',
                        'Sunday',
                    ],
                    'opens' => '08:00',
                    'closes' => '22:00',
                ],
            ],
        ];

        return json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }

    /**
     * Get JSON-LD schema for the menu page.
     *
     * @return string
     */
    protected function getMenuSchema()
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Menu',
            'name' => 'Menu '.config('app.name'),
            'description' => 'Full food and drink menu at '.config('app.name').'.',
            // Note: hasMenuItem could be added but would require loading menu items.
            // For simplicity, we omit it here to avoid heavy queries in view composer.
            // In a real implementation, you might want to cache or load a limited set.
        ];

        return json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }

    /**
     * Get the full URL for an image path.
     *
     * @param  string  $path
     * @return string
     */
    protected function getFirstImage($path)
    {
        if (preg_match('/^https?:\/\//', $path)) {
            return $path;
        }

        return asset($path);
    }
}
