<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\Gazebo;
use App\Models\QRCode as QRCodeModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QRCodeController extends Controller
{
    public function index()
    {
        $facilities = Facility::where('is_active', true)->get();
        $qrcodes = QRCodeModel::latest()->get();

        return Inertia::render('Admin/QRCodes/Index', [
            'facilities' => $facilities,
            'qrcodes' => $qrcodes,
        ]);
    }

    public function generate(Request $request)
    {
        $rules = [
            'label' => 'required|string|max:255',
            'type' => 'required|in:facility,table',
            'size' => 'nullable|integer|min:100|max:1000',
        ];

        if ($request->type === 'facility') {
            $rules['facility_id'] = 'required|exists:facilities,id';
        } else {
            $rules['table_number'] = 'required|string|max:50';
        }

        $request->validate($rules);

        $size = $request->input('size', 500); // 500px for print quality
        $url = route('catalog.public');

        if ($request->type === 'facility') {
            $facility = Facility::findOrFail($request->facility_id);
            $url .= '?location_type=facility&location_id='.$facility->id;
        } else {
            $url .= '?location_type=table&table_number='.urlencode($request->table_number);
        }

        // Resolve gazebo from table label prefix (e.g. "Kawasar 1 Meja 03" → "Kawasar 1")
        // Normalizer MUST match the migration's normalizeGazeboName() so lookups succeed.
        $gazeboId = null;
        if ($request->type === 'table' && preg_match('/^(.+?)\s+Meja/i', $request->label, $m)) {
            $norm = collect(explode(' ', strtolower(trim($m[1]))))
                ->map(fn ($w) => ucfirst($w))
                ->map(fn ($w) => preg_replace('/(\d+)/', ' $1', $w))
                ->implode(' ');
            $norm = preg_replace('/\s+/', ' ', trim($norm));
            $gazeboId = Gazebo::where('name', $norm)->value('id');
        } elseif ($request->type === 'table' && preg_match('/^(Pondo)\s*\d+/i', $request->label, $m)) {
            $gazeboId = Gazebo::where('name', 'Pondo')->value('id');
        }

        // Generate QR code as SVG file (format explicitly set to match .svg extension)
        $fileName = 'qrcodes/qr_'.Str::random(10).'.svg';
        $path = storage_path('app/public/'.$fileName);

        // Ensure directory exists
        if (! file_exists(storage_path('app/public/qrcodes'))) {
            mkdir(storage_path('app/public/qrcodes'), 0755, true);
        }

        try {
            QrCode::format('svg')->size($size)->generate($url, $path);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Gagal membuat file QR: '.$e->getMessage());
        }

        $qrCode = QRCodeModel::create([
            'label' => $request->label,
            'location_type' => $request->type,
            'location_id' => $request->facility_id,
            'gazebo_id' => $gazeboId,
            'table_number' => $request->table_number,
            'image_path' => '/storage/'.$fileName,
            'url' => $url,
        ]);

        return redirect()->back()->with('success', 'QR Code berhasil dibuat dan disimpan.');
    }

    public function destroy(QRCodeModel $qrcode)
    {
        $path = str_replace('/storage/', '', $qrcode->image_path);
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        $qrcode->delete();

        return redirect()->back()->with('success', 'QR Code berhasil dihapus.');
    }
}
