<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\MenuItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_welcome_page_can_be_rendered(): void
    {
        Facility::create([
            'name' => 'Test Homestay',
            'type' => 'homestay',
            'description' => 'A nice test homestay',
            'price_per_day' => 500000,
            'is_active' => true,
        ]);

        MenuItem::create([
            'name' => 'Nasi Goreng',
            'description' => 'Fried rice',
            'price' => 25000,
            'category' => 'makanan',
            'is_available' => true,
        ]);

        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Welcome')
            ->has('facilities')
            ->has('menuItems')
        );
    }

    public function test_facilities_page_can_be_rendered(): void
    {
        $response = $this->get('/fasilitas');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Public/Facilities')
            ->has('facilities')
        );
    }

    public function test_catalog_page_can_be_rendered(): void
    {
        $response = $this->get('/katalog');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Public/Katalog')
            ->has('menuItems')
            ->has('filters')
        );
    }
}
