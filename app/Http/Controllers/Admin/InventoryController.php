<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveInventoryRequest;
use App\Models\FinancialTransaction;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\MenuItem;
use App\Models\User;
use App\Notifications\LowStockAlert;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $category = trim((string) $request->input('category', ''));
        $location = trim((string) $request->input('location', ''));

        $query = Inventory::query();

        if ($search !== '') {
            $query->where('name', 'like', '%'.$search.'%');
        }
        if ($category !== '') {
            $query->where('category', $category);
        }
        if ($location !== '') {
            $query->where('location', $location);
        }

        $inventories = $query->orderBy('name')
            ->with([
                'menuItem:id,name,category,price,current_stock,daily_stock',
                'transactions' => function ($q) {
                    $q->with('user')->latest()->limit(50);
                },
            ])
            ->get()
            ->each(function ($item) {
                $item->total_cost_in = $item->transactions
                    ->where('type', 'in')
                    ->sum('cost');
                $item->last_restock = optional(
                    $item->transactions->where('type', 'in')->first()
                )->created_at;
            });

        $categories = Inventory::whereNotNull('category')
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->values()
            ->all();

        // #2: menu items yang BELUM ter-link ke inventory cafe (untuk form "Tambah Produk Cafe").
        $unlinkedMenuItems = MenuItem::whereIn('category', ['snack', 'minuman', 'dessert', 'makanan'])
            ->whereNotIn('id', Inventory::whereNotNull('menu_item_id')->pluck('menu_item_id'))
            ->orderBy('name')
            ->get(['id', 'name', 'category', 'price', 'current_stock']);

        // SEMUA menu cafe (untuk dropdown "Kirim ke Cafe" saat transfer gudang -> menu).
        $cafeMenuItems = MenuItem::whereIn('category', ['snack', 'minuman', 'dessert', 'makanan'])
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'name', 'category', 'price', 'current_stock']);

        return Inertia::render('Admin/Inventories/Index', [
            'inventories' => $inventories,
            'categories' => $categories,
            'locations' => ['warehouse', 'kitchen', 'cafe', 'general'],
            'unlinkedMenuItems' => $unlinkedMenuItems,
            'cafeMenuItems' => $cafeMenuItems,
            'filters' => ['search' => $search, 'category' => $category, 'location' => $location],
        ]);
    }

    public function store(SaveInventoryRequest $request, StockService $stock)
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $stock) {
            $inventory = Inventory::create($validated);

            // GUDANG INDEPENDEN: inventory TIDAK lagi sinkron ke menu.
            // Stok cafe (menu) dikelola terpisah lewat staff/daily-stock &
            // admin/menu-items. Transfer gudang->cafe lewat transaksi `out`
            // + menu target (lihat transferToMenu).

            if ($inventory->current_stock > 0) {
                $totalCost = $validated['initial_total_cost'] ?? 0;

                $transaction = InventoryTransaction::create([
                    'inventory_id' => $inventory->id,
                    'type' => 'in',
                    'quantity' => $inventory->current_stock,
                    'cost' => $totalCost,
                    'stock_after' => $inventory->current_stock,
                    'notes' => 'Stok awal sistem',
                    'user_id' => auth()->id(),
                ]);

                if ($totalCost > 0) {
                    FinancialTransaction::create([
                        'type' => 'expense',
                        'category' => 'inventory_purchase',
                        'amount' => $totalCost,
                        'description' => "Pembelian Stok Awal: {$inventory->name}",
                        'reference_id' => $transaction->id,
                        'transaction_date' => now()->toDateString(),
                        'user_id' => auth()->id(),
                    ]);
                }
            }
        });

        return redirect()->back()->with('success', 'Data stok berhasil ditambahkan');
    }

    public function update(SaveInventoryRequest $request, Inventory $inventory, StockService $stock)
    {
        $validated = $request->validated();

        // GUDANG INDEPENDEN: perubahan current_stock inventory TIDAK lagi
        // diteruskan ke menu. Inventori = gudang/bahan, bukan cermin stok cafe.
        // (Stok cafe dikelola via staff/daily-stock & admin/menu-items.)

        if (! empty($validated)) {
            $inventory->update($validated);
        }

        return redirect()->back()->with('success', 'Data stok diperbarui');
    }

    /**
     * #2: Semua mutasi stok inventori lewat StockService (satu penulis).
     */
    public function transaction(Request $request, Inventory $inventory, StockService $stock)
    {
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

        return redirect()->back()->with('success', 'Transaksi stok berhasil disimpan');
    }

    /**
     * #2: Set stok absolut cepat dari tab Cafe / Dapur.
     */
    public function setStock(Request $request, Inventory $inventory, StockService $stock)
    {
        $validated = $request->validate([
            'current_stock' => 'required|numeric|min:0',
        ]);

        $stock->setInventoryStock($inventory, (float) $validated['current_stock']);

        return redirect()->back()->with('success', "Stok {$inventory->name} diset ke {$validated['current_stock']}");
    }

    /**
     * Transfer stok gudang -> menu cafe.
     * Gudang berkurang, menu (current_stock & daily_stock) bertambah.
     * Admin/Manager/Staff boleh; inventory harus location != cafe (gudang/bahan).
     */
    public function transferToMenu(Request $request, Inventory $inventory, StockService $stock)
    {
        abort_if($inventory->location === 'cafe', 403, 'Item cafe tidak bisa transfer ke menu (sudah di lokasi cafe)');

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

        return redirect()->back()->with('success', "Transfer ke menu {$menuItem->name} berhasil (stok gudang -{$validated['quantity']}, menu +{$validated['quantity']})");
    }

    public function destroy(Inventory $inventory)
    {
        $inventory->delete();

        return redirect()->back()->with('success', 'Data stok dihapus');
    }
}
