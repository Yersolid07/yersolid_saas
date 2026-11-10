<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MenuItemController extends Controller
{
    public function index(Request $request): Response
    {
        $items = MenuItem::query()
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->category))
            ->when($request->filled('status'), fn ($q) => $q->where('is_available', $request->status === 'available'))
            ->orderBy('category')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/MenuItems/Index', [
            'items' => $items,
            'filters' => $request->only(['search', 'category', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/MenuItems/Form');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|in:makanan,minuman,snack,dessert,tiket,other_income,toiletries',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'image' => 'nullable|image|max:2048',
            'is_available' => 'boolean',
            'discount_type' => 'nullable|in:none,nominal,percentage',
            'discount_value' => 'nullable|numeric|min:0',
            'promo_start' => 'nullable|date',
            'promo_end' => 'nullable|date|after_or_equal:promo_start',
            'promo_name' => 'nullable|string|max:255',
            'daily_stock' => 'nullable|integer|min:0',
            'barcode' => 'nullable|string|max:255|unique:menu_items,barcode',
            'is_counter_pickup' => 'nullable|boolean',
        ]);

        if ($request->hasFile('image')) {
            $validated['image_url'] = $request->file('image')->store('menu', 'public');
        }

        // SINKRON STOK (Jer): daily_stock = sisa stok (cermin current_stock).
        // Jika form mengirim daily_stock, stok aktual harus ikut agar kedua
        // kolom SELALU identik. Stok ditulis lewat StockService (single writer).
        if (array_key_exists('daily_stock', $validated)) {
            $newStock = (int) ($validated['daily_stock'] ?? 0);
            unset($validated['daily_stock']);
            $setStock = true;
        }
        if (isset($validated['current_stock'])) {
            $newStock = (int) $validated['current_stock'];
            unset($validated['current_stock']);
            $setStock = true;
        }

        if (empty($validated['discount_type'])) {
            $validated['discount_type'] = 'none';
        }

        $menuItem = MenuItem::create($validated);

        if (! empty($setStock)) {
            app(StockService::class)->setMenuStocks([['id' => $menuItem->id, 'current_stock' => $newStock]], 'Stok awal menu');
        }

        return redirect()->route('admin.menu-items.index')
            ->with('success', 'Menu berhasil ditambahkan.');
    }

    public function edit(MenuItem $menuItem): Response
    {
        return Inertia::render('Admin/MenuItems/Form', ['item' => $menuItem]);
    }

    public function update(Request $request, MenuItem $menuItem)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|in:makanan,minuman,snack,dessert,tiket,other_income,toiletries',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'image' => 'nullable|image|max:2048',
            'is_available' => 'boolean',
            'discount_type' => 'nullable|in:none,nominal,percentage',
            'discount_value' => 'nullable|numeric|min:0',
            'promo_start' => 'nullable|date',
            'promo_end' => 'nullable|date|after_or_equal:promo_start',
            'promo_name' => 'nullable|string|max:255',
            'daily_stock' => 'nullable|integer|min:0',
            'barcode' => 'nullable|string|max:255|unique:menu_items,barcode,'.$menuItem->id,
            'is_counter_pickup' => 'nullable|boolean',
        ]);

        if ($request->hasFile('image')) {
            if ($menuItem->image_url) {
                Storage::disk('public')->delete($menuItem->image_url);
            }
            $validated['image_url'] = $request->file('image')->store('menu', 'public');
        }

        // SINKRON STOK (Jer): daily_stock = sisa stok (cermin current_stock).
        // Jika form mengirim daily_stock, stok aktual harus ikut agar kedua
        // kolom SELALU identik di semua channel. Stok ditulis lewat StockService
        // (single writer) supaya audit trail & inventory cafe ikut sinkron.
        if (array_key_exists('daily_stock', $validated)) {
            $newStock = (int) ($validated['daily_stock'] ?? 0);
            unset($validated['daily_stock']);
            $setStock = true;
        }
        if (isset($validated['current_stock'])) {
            $newStock = (int) $validated['current_stock'];
            unset($validated['current_stock']);
            $setStock = true;
        }

        if (empty($validated['discount_type'])) {
            $validated['discount_type'] = 'none';
        }

        $menuItem->update($validated);

        if (! empty($setStock)) {
            app(StockService::class)->setMenuStocks([['id' => $menuItem->id, 'current_stock' => $newStock]], 'Stok menu diperbarui');
        }

        return redirect()->route('admin.menu-items.index')
            ->with('success', 'Menu berhasil diperbarui.');
    }

    public function destroy(MenuItem $menuItem)
    {
        if ($menuItem->image_url) {
            Storage::disk('public')->delete($menuItem->image_url);
        }
        $menuItem->delete();

        return redirect()->route('admin.menu-items.index')
            ->with('success', 'Menu berhasil dihapus.');
    }

    public function toggleAvailability(MenuItem $menuItem)
    {
        $menuItem->update(['is_available' => ! $menuItem->is_available]);

        return back()->with('success', 'Ketersediaan menu berhasil diubah.');
    }
}
