<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\MenuItem;
use App\Services\StockService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));

        $query = Inventory::query()->where('location', 'warehouse');

        if ($search !== '') {
            $query->where('name', 'like', '%'.$search.'%');
        }

        $inventories = $query->orderBy('name')
            ->with(['transactions' => fn ($q) => $q->with('user')->latest()->limit(20)])
            ->get()
            ->each(function ($item) {
                $item->low = $item->minimum_stock !== null
                    && $item->current_stock <= $item->minimum_stock;
            });

        // Menu cafe untuk dropdown "Kirim ke Cafe" (transfer gudang -> menu).
        $cafeMenuItems = MenuItem::whereIn('category', ['snack', 'minuman', 'dessert', 'makanan'])
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'name', 'category', 'price', 'current_stock']);

        return Inertia::render('Staff/Inventory/Index', [
            'inventories' => $inventories,
            'filters' => ['search' => $search],
            'cafeMenuItems' => $cafeMenuItems,
        ]);
    }

    /**
     * Staff tetap hanya boleh memutasi stok GUDANG.
     * Penulisan lewat StockService (satu penulis + audit trail konsisten).
     */
    public function transaction(Request $request, Inventory $inventory, StockService $stock)
    {
        abort_if($inventory->location !== 'warehouse', 403, 'Akses ditolak');

        $validated = $request->validate([
            'type' => 'required|in:in,out,adjustment',
            'quantity' => 'required|numeric|min:0.01',
            'total_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:255',
        ]);

        $stock->transactInventory(
            $inventory,
            $validated['type'],
            (float) $validated['quantity'],
            (float) ($validated['total_cost'] ?? 0),
            $validated['notes'] ?? null
        );

        return redirect()->back()->with('success', 'Transaksi gudang berhasil disimpan');
    }

    /**
     * Transfer stok gudang -> menu cafe (Staff boleh).
     * Gudang berkurang, menu cafe bertambah (current_stock & daily_stock sinkron).
     */
    public function transferToMenu(Request $request, Inventory $inventory, StockService $stock)
    {
        abort_if($inventory->location !== 'warehouse', 403, 'Hanya item gudang yang bisa di-transfer ke cafe');

        $validated = $request->validate([
            'menu_item_id' => 'required|exists:menu_items,id',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:255',
        ]);

        $menuItem = MenuItem::findOrFail($validated['menu_item_id']);

        $stock->transferToMenu(
            $inventory,
            $menuItem,
            (float) $validated['quantity'],
            $validated['notes'] ?? null
        );

        return redirect()->back()->with('success', "Transfer ke menu {$menuItem->name} berhasil (gudang -{$validated['quantity']}, menu +{$validated['quantity']})");
    }
}
