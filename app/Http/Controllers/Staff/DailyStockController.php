<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Services\StockService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DailyStockController extends Controller
{
    /**
     * FIX #1: Stok Harian Cafe kini satu pintu dengan Menu Cafe & Layanan
     * (StockService::setMenuStocks). Tidak ada lagi raw DB::update yang
     * mem-bypass audit trail dan membuat kedua menu tidak sinkron.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $category = trim((string) $request->input('category', ''));

        $query = MenuItem::where('is_available', true);

        if ($search !== '') {
            $query->where('name', 'like', '%'.$search.'%');
        }
        if ($category !== '') {
            $query->where('category', $category);
        }

        $items = $query->orderBy('category')->orderBy('name')->get();

        $categories = MenuItem::where('is_available', true)
            ->whereNotNull('category')
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->values()
            ->all();

        return Inertia::render('Staff/DailyStock', [
            'items' => $items,
            'categories' => $categories,
            'filters' => ['search' => $search, 'category' => $category],
        ]);
    }

    public function update(Request $request, StockService $stock)
    {
        $validated = $request->validate([
            'stocks' => 'required|array|min:1',
            'stocks.*.id' => 'required|exists:menu_items,id',
            'stocks.*.current_stock' => 'required|integer|min:0',
        ]);

        $result = $stock->setMenuStocks($validated['stocks'], 'Stok harian cafe diperbarui');

        return back()->with(
            'success',
            "Stok harian berhasil diperbarui ({$result['updated']} item disimpan, {$result['skipped']} tidak berubah)."
        );
    }
}
