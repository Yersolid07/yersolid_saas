<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MenuItemController extends Controller
{
    public function index(Request $request)
    {
        $query = MenuItem::where('is_available', true)->whereIn('category', ['makanan', 'minuman', 'snack', 'dessert']);

        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%'.$request->search.'%')
                ->orWhere('description', 'like', '%'.$request->search.'%');
        }

        $menuItems = $query->orderBy('category')->orderBy('name')->get()->map(function ($item) {
            // DOMAIN RULE (Jer): stok aktual = current_stock. daily_stock adalah
            // cermin dari current_stock. Out of stock ditentukan dari current_stock.
            $item->is_out_of_stock = ($item->current_stock !== null && $item->current_stock <= 0);

            return $item;
        });

        return Inertia::render('Public/Katalog', [
            'menuItems' => $menuItems,
            'filters' => [
                'search' => $request->input('search', ''),
            ],
        ]);
    }
}
