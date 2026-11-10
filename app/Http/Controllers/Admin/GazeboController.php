<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\Gazebo;
use App\Models\QRCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class GazeboController extends Controller
{
    /**
     * List all gazebos with their linked facility + table (QR) counts.
     */
    public function index()
    {
        $gazebos = Gazebo::with(['facility', 'tables'])
            ->orderBy('name')
            ->get()
            ->map(function ($g) {
                return [
                    'id' => $g->id,
                    'name' => $g->name,
                    'facility_id' => $g->facility_id,
                    'facility_name' => $g->facility?->name,
                    'description' => $g->description,
                    'is_active' => $g->is_active,
                    'tables' => $g->tables->map(fn ($t) => [
                        'id' => $t->id,
                        'label' => $t->label,
                        'table_number' => $t->table_number,
                        'image_path' => $t->image_path,
                    ]),
                ];
            });

        $facilities = Facility::where('type', 'gazebo')
            ->whereNotIn('id', function ($q) {
                $q->select('facility_id')->from('gazebos')->whereNotNull('facility_id');
            })
            ->get(['id', 'name']);

        return Inertia::render('Admin/Gazebos/Index', [
            'gazebos' => $gazebos,
            'facilities' => $facilities,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'facility_id' => 'nullable|exists:facilities,id',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        Gazebo::create([
            'name' => $validated['name'],
            'facility_id' => $validated['facility_id'] ?? null,
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->back()->with('success', 'Gazebo berhasil ditambahkan.');
    }

    public function update(Request $request, Gazebo $gazebo)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'facility_id' => 'nullable|exists:facilities,id',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $gazebo->update([
            'name' => $validated['name'],
            'facility_id' => $validated['facility_id'] ?? null,
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? $gazebo->is_active,
        ]);

        return redirect()->back()->with('success', 'Gazebo berhasil diperbarui.');
    }

    public function destroy(Gazebo $gazebo)
    {
        if ($gazebo->tables()->exists()) {
            return redirect()->back()->withErrors([
                'gazebo' => 'Gazebo masih punya meja. Pindahkan/hapus mejanya dulu sebelum menghapus gazebo.',
            ]);
        }

        $gazebo->delete();

        return redirect()->back()->with('success', 'Gazebo berhasil dihapus.');
    }

    /**
     * Add a table (QR code) to a gazebo.
     */
    public function addTable(Request $request, Gazebo $gazebo)
    {
        $validated = $request->validate([
            'label' => 'required|string|max:255',
            'table_number' => 'required|string|max:50',
        ]);

        // Generate a QR code pointing at the table (dine-in catalog).
        $url = route('catalog.public').'?location_type=table&table_number='.urlencode($validated['table_number']);

        $fileName = 'qrcodes/qr_'.Str::random(10).'.svg';
        $path = storage_path('app/public/'.$fileName);
        if (! file_exists(storage_path('app/public/qrcodes'))) {
            mkdir(storage_path('app/public/qrcodes'), 0755, true);
        }

        try {
            \SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->size(500)->generate($url, $path);
        } catch (\Throwable $e) {
            return redirect()->back()->withErrors(['table' => 'Gagal membuat QR meja: '.$e->getMessage()]);
        }

        QRCode::create([
            'label' => $validated['label'],
            'location_type' => 'table',
            'gazebo_id' => $gazebo->id,
            'table_number' => $validated['table_number'],
            'image_path' => '/storage/'.$fileName,
            'url' => $url,
        ]);

        return redirect()->back()->with('success', 'Meja berhasil ditambahkan ke '.$gazebo->name.'.');
    }

    public function removeTable(Gazebo $gazebo, QRCode $table)
    {
        if ($table->gazebo_id !== $gazebo->id) {
            abort(404);
        }

        $path = str_replace('/storage/', '', $table->image_path);
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        $table->delete();

        return redirect()->back()->with('success', 'Meja berhasil dihapus.');
    }
}
