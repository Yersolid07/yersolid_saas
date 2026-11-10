<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveFacilityRequest;
use App\Models\Facility;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class FacilityController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:view facilities', only: ['index', 'show']),
            new Middleware('can:create facilities', only: ['create', 'store']),
            new Middleware('can:edit facilities', only: ['edit', 'update', 'toggleStatus']),
            new Middleware('can:delete facilities', only: ['destroy']),
        ];
    }

    public function index(Request $request): Response
    {
        $facilities = Facility::query()
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->type))
            ->when($request->filled('status'), fn ($q) => $q->where('is_active', $request->status === 'active'))
            ->withCount('reservations')
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Admin/Facilities/Index', [
            'facilities' => $facilities,
            'filters' => $request->only(['search', 'type', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Facilities/Form');
    }

    public function store(SaveFacilityRequest $request)
    {
        $validated = $request->validated();

        if ($request->hasFile('image')) {
            $validated['image_url'] = $request->file('image')->store('facilities', 'public');
        }

        Facility::create($validated);

        return redirect()->route('admin.facilities.index')
            ->with('success', 'Fasilitas berhasil ditambahkan.');
    }

    public function show(Facility $facility): Response
    {
        $facility->load(['reservations' => fn ($q) => $q->latest()->limit(10)->with('user')]);

        return Inertia::render('Admin/Facilities/Show', [
            'facility' => $facility,
        ]);
    }

    public function edit(Facility $facility): Response
    {
        return Inertia::render('Admin/Facilities/Form', [
            'facility' => $facility,
        ]);
    }

    public function update(SaveFacilityRequest $request, Facility $facility)
    {
        $validated = $request->validated();

        if ($request->hasFile('image')) {
            // Delete old image
            if ($facility->image_url && ! str_starts_with($facility->image_url, 'http')) {
                Storage::disk('public')->delete($facility->image_url);
            }
            $validated['image_url'] = $request->file('image')->store('facilities', 'public');
        }

        $facility->update($validated);

        return redirect()->route('admin.facilities.index')
            ->with('success', 'Fasilitas berhasil diperbarui.');
    }

    public function destroy(Facility $facility)
    {
        if ($facility->reservations()->whereIn('status', ['pending', 'confirmed'])->exists()) {
            return back()->with('error', 'Fasilitas tidak dapat dihapus karena masih ada reservasi aktif.');
        }

        $facility->delete();

        return redirect()->route('admin.facilities.index')
            ->with('success', 'Fasilitas berhasil dihapus.');
    }

    public function toggleStatus(Facility $facility)
    {
        $facility->update(['is_active' => ! $facility->is_active]);

        return back()->with('success', 'Status fasilitas berhasil diubah.');
    }
}
