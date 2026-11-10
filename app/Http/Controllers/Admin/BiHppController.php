<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\Request;

class BiHppController extends Controller
{
    /**
     * Usulan HPP massal berdasarkan target food-cost % per kategori.
     * Ini KALKULASI transparan (harga_jual × %), bukan asumsi harga bahan.
     * Owner tetap memutuskan & bisa edit per item sebelum simpan.
     */
    public function propose(Request $request)
    {
        $validated = $request->validate([
            'category' => 'nullable|in:makanan,minuman,snack,dessert,tiket,other_income,toiletries',
            'target_pct' => 'required|numeric|between:5,80',
        ]);

        $query = MenuItem::query();
        if (! empty($validated['category'])) {
            $query->where('category', $validated['category']);
        }
        $items = $query->where('price', '>', 0)->orderBy('name')->get();

        $suggestions = $items->map(function ($mi) use ($validated) {
            $suggested = round($mi->price * ($validated['target_pct'] / 100), 0);

            return [
                'id' => $mi->id,
                'name' => $mi->name,
                'category' => $mi->category,
                'price' => (float) $mi->price,
                'current_cost' => (float) ($mi->cost_price ?: 0),
                'suggested_cost' => $suggested,
                'margin_pct_at_current' => $mi->price > 0 && $mi->cost_price > 0
                    ? round(($mi->price - $mi->cost_price) / $mi->price * 100, 1) : null,
            ];
        });

        return response()->json([
            'target_pct' => (float) $validated['target_pct'],
            'category' => $validated['category'] ?? 'all',
            'count' => $suggestions->count(),
            'suggestions' => $suggestions->values(),
        ]);
    }

    /**
     * Simpan HPP massal (setelah owner konfirmasi / edit per item).
     */
    public function apply(Request $request)
    {
        $validated = $request->validate([
            'updates' => 'required|array|min:1',
            'updates.*.id' => 'required|exists:menu_items,id',
            'updates.*.cost_price' => 'required|numeric|min:0',
        ]);

        $count = 0;
        foreach ($validated['updates'] as $u) {
            MenuItem::where('id', $u['id'])->update(['cost_price' => $u['cost_price']]);
            $count++;
        }

        return back()->with('success', "HPP diperbarui untuk {$count} menu.");
    }
}
