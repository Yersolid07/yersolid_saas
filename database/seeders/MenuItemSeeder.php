<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use Illuminate\Database\Seeder;

class MenuItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            // Makanan
            ['name' => 'Nasi Gudeg', 'description' => 'Nasi gudeg khas Yogya dengan ayam dan telur', 'category' => 'makanan', 'price' => 25000.00],
            ['name' => 'Sate Ayam', 'description' => 'Sate ayam dengan bumbu kacang spesial', 'category' => 'makanan', 'price' => 20000.00],
            ['name' => 'Gado-gado', 'description' => 'Salad sayuran dengan bumbu kacang', 'category' => 'makanan', 'price' => 18000.00],
            ['name' => 'Nasi Kuning', 'description' => 'Yellow rice plate with complete side dishes', 'category' => 'makanan', 'price' => 22000.00],
            ['name' => 'Grilled Fish Rica', 'description' => 'Grilled fish with spicy rica-rica sauce', 'category' => 'makanan', 'price' => 35000.00],
            ['name' => 'Smoked Tuna Noodles', 'description' => 'Noodles with smoked tuna', 'category' => 'makanan', 'price' => 25000.00],

            // Minuman
            ['name' => 'Es Teh Manis', 'description' => 'Es teh manis segar', 'category' => 'minuman', 'price' => 8000.00],
            ['name' => 'Es Jeruk', 'description' => 'Es jeruk peras segar', 'category' => 'minuman', 'price' => 10000.00],
            ['name' => 'Kopi Tubruk', 'description' => 'Kopi tubruk tradisional', 'category' => 'minuman', 'price' => 12000.00],
            ['name' => 'Local Coffee', 'description' => 'Arabica coffee, house roast', 'category' => 'minuman', 'price' => 15000.00],
            ['name' => 'Jus Alpukat', 'description' => 'Jus alpukat segar dengan susu', 'category' => 'minuman', 'price' => 15000.00],
            ['name' => 'Air Mineral', 'description' => 'Air mineral botol', 'category' => 'minuman', 'price' => 5000.00],

            // Snack
            ['name' => 'Pisang Goreng', 'description' => 'Pisang goreng crispy', 'category' => 'snack', 'price' => 15000.00],
            ['name' => 'Bakwan Jagung', 'description' => 'Bakwan jagung manis crispy', 'category' => 'snack', 'price' => 12000.00],
            ['name' => 'Gorengan Mix', 'description' => 'Campur gorengan: tahu, tempe, bakwan', 'category' => 'snack', 'price' => 18000.00],

            // Dessert
            ['name' => 'Es Krim Kelapa', 'description' => 'Es krim kelapa muda segar', 'category' => 'dessert', 'price' => 18000.00],
            ['name' => 'Rice Porridge', 'description' => 'Traditional tinutuan rice porridge', 'category' => 'dessert', 'price' => 20000.00],
            ['name' => 'Lalampa Cake', 'description' => 'Sticky rice roll with smoked tuna filling', 'category' => 'dessert', 'price' => 10000.00],
        ];

        foreach ($items as $item) {
            MenuItem::firstOrCreate(['name' => $item['name']], array_merge($item, ['is_available' => true]));
        }
    }
}
