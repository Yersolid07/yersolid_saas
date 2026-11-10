<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function index(Request $request): Response
    {
        $coupons = Coupon::query()
            ->when($request->search, fn ($q) => $q->where('code', 'like', "%{$request->search}%"))
            ->when($request->status !== null, fn ($q) => $q->where('is_active', $request->status === 'active'))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Coupons/Index', [
            'coupons' => $coupons,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Coupons/Form');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:coupons',
            'type' => 'required|in:percent,fixed',
            'value' => 'required|numeric|min:0',
            'min_purchase' => 'required|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'valid_until' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        Coupon::create($validated);

        return redirect()->route('admin.coupons.index')->with('success', 'Kupon berhasil dibuat.');
    }

    public function edit(Coupon $coupon): Response
    {
        return Inertia::render('Admin/Coupons/Form', ['coupon' => $coupon]);
    }

    public function update(Request $request, Coupon $coupon)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:coupons,code,'.$coupon->id,
            'type' => 'required|in:percent,fixed',
            'value' => 'required|numeric|min:0',
            'min_purchase' => 'required|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'valid_until' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        $coupon->update($validated);

        return redirect()->route('admin.coupons.index')->with('success', 'Kupon berhasil diperbarui.');
    }

    public function destroy(Coupon $coupon)
    {
        $coupon->delete();

        return redirect()->route('admin.coupons.index')->with('success', 'Kupon berhasil dihapus.');
    }

    public function toggle(Coupon $coupon)
    {
        $coupon->update(['is_active' => ! $coupon->is_active]);

        return back()->with('success', 'Status kupon berhasil diubah.');
    }
}
