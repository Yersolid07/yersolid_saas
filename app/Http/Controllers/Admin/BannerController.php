<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BannerController extends Controller
{
    public function index()
    {
        $banners = Banner::orderBy('sort_order')->get();

        return Inertia::render('Admin/Banners/Index', [
            'banners' => $banners,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
            'link_url' => 'nullable|url|max:255',
        ]);

        $imagePath = $request->file('image')->store('banners', 'public');

        // Put it at the end
        $maxOrder = Banner::max('sort_order') ?? 0;

        Banner::create([
            'title' => $request->title,
            'description' => $request->description,
            'image_path' => $imagePath,
            'link_url' => $request->link_url,
            'is_active' => true,
            'sort_order' => $maxOrder + 1,
        ]);

        return redirect()->back()->with('success', 'Banner berhasil ditambahkan.');
    }

    public function update(Request $request, Banner $banner)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'link_url' => 'nullable|url|max:255',
        ]);

        $data = $request->only(['title', 'description', 'link_url']);

        if ($request->hasFile('image')) {
            if (Storage::disk('public')->exists($banner->image_path)) {
                Storage::disk('public')->delete($banner->image_path);
            }
            $data['image_path'] = $request->file('image')->store('banners', 'public');
        }

        $banner->update($data);

        return redirect()->back()->with('success', 'Banner berhasil diperbarui.');
    }

    public function toggleStatus(Banner $banner)
    {
        $banner->update(['is_active' => ! $banner->is_active]);

        return redirect()->back()->with('success', 'Status banner berhasil diubah.');
    }

    public function destroy(Banner $banner)
    {
        if (Storage::disk('public')->exists($banner->image_path)) {
            Storage::disk('public')->delete($banner->image_path);
        }
        $banner->delete();

        return redirect()->back()->with('success', 'Banner berhasil dihapus.');
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:banners,id',
            'items.*.sort_order' => 'required|integer',
        ]);

        foreach ($request->items as $item) {
            Banner::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return redirect()->back()->with('success', 'Urutan banner berhasil disimpan.');
    }
}
