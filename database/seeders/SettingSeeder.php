<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // General (generic demo values — buyers customize after install)
            ['key' => 'site_name', 'value' => 'My Resort', 'type' => 'text', 'group' => 'general'],
            ['key' => 'site_description', 'value' => 'Welcome to our resort.', 'type' => 'text', 'group' => 'general'],

            // Hero
            ['key' => 'hero_title', 'value' => 'Welcome to Our Resort', 'type' => 'text', 'group' => 'hero'],
            ['key' => 'hero_subtitle', 'value' => 'Enjoy Nature in Every Corner', 'type' => 'text', 'group' => 'hero'],
            ['key' => 'hero_description', 'value' => 'Book your room or gazebo now and enjoy a peaceful stay.', 'type' => 'text', 'group' => 'hero'],
            ['key' => 'hero_image', 'value' => '/images/logo.png', 'type' => 'image', 'group' => 'hero'],

            // About
            ['key' => 'about_title', 'value' => 'About Us', 'type' => 'text', 'group' => 'about'],
            ['key' => 'about_description', 'value' => 'We are a nature destination offering a peaceful and memorable stay with a range of enjoyable facilities.', 'type' => 'text', 'group' => 'about'],

            // Contact
            ['key' => 'contact_whatsapp', 'value' => '080000000000', 'type' => 'text', 'group' => 'contact'],
            ['key' => 'contact_email', 'value' => 'info@example.com', 'type' => 'text', 'group' => 'contact'],
            ['key' => 'contact_address', 'value' => 'Your address here', 'type' => 'text', 'group' => 'contact'],
            ['key' => 'contact_map_embed', 'value' => '', 'type' => 'text', 'group' => 'contact'],

            // Footer
            ['key' => 'footer_text', 'value' => '© '.date('Y').' '.Setting::get('site_name', 'My Resort & Nature').'. All rights reserved.', 'type' => 'text', 'group' => 'general'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
