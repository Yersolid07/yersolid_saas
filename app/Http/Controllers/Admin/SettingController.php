<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class SettingController extends Controller implements HasMiddleware
{
    /**
     * Get the middleware that should be assigned to the controller.
     */
    public static function middleware(): array
    {
        return [
            new Middleware('role:admin', only: ['index', 'update', 'resetData']),
        ];
    }

    public function resetData(Request $request)
    {
        $request->validate([
            'reset_date' => 'required|date',
            'confirm_text' => 'required|in:HAPUS DATA',
        ]);

        $date = Carbon::parse($request->reset_date)->startOfDay();

        DB::transaction(function () use ($date) {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // Delete records created on or after the reset_date
            DB::table('payments')->where('created_at', '>=', $date)->delete();
            DB::table('financial_transactions')->where('created_at', '>=', $date)->delete();
            DB::table('food_order_items')->where('created_at', '>=', $date)->delete();
            DB::table('food_orders')->where('created_at', '>=', $date)->delete();
            DB::table('pos_closings')->where('created_at', '>=', $date)->delete();

            if (Schema::hasTable('reservation_addons')) {
                DB::table('reservation_addons')->where('created_at', '>=', $date)->delete();
            }

            DB::table('reservations')->where('created_at', '>=', $date)->delete();
            DB::table('reviews')->where('created_at', '>=', $date)->delete();

            // DOMAIN RULE (Jer): daily_stock = sisa stok (cermin current_stock),
            // BUKAN nilai reset. Reset data TIDAK boleh menimpa stok aktual yang
            // tersisa di menu. Stok dibiarkan apa adanya.

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        });

        return redirect()->back()->with('success', 'Data transaksi mulai dari tanggal yang dipilih berhasil dihapus!');
    }

    public function index()
    {
        $settings = Setting::all()->keyBy('key')->map(function ($setting) {
            return $setting->value;
        });

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->except(['_token']);

        foreach ($data as $key => $value) {
            if ($request->hasFile($key)) {
                $request->validate([
                    $key => 'image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
                ]);
                $path = $request->file($key)->store('settings', 'public');
                Setting::set($key, '/storage/'.$path, 'image');
            } else {
                Setting::set($key, $value ?? '');

                // If the key is theme_color, also generate shades
                if ($key === 'theme_color' && $value) {
                    $shades = $this->generateTailwindShades($value);
                    Setting::set('theme_colors', json_encode($shades));
                }
            }
        }

        return redirect()->back()->with('success', 'Pengaturan berhasil diperbarui!');
    }

    private function generateTailwindShades($hex)
    {
        return [
            '50' => $this->mixColors($hex, '#ffffff', 0.9),
            '100' => $this->mixColors($hex, '#ffffff', 0.8),
            '200' => $this->mixColors($hex, '#ffffff', 0.6),
            '300' => $this->mixColors($hex, '#ffffff', 0.4),
            '400' => $this->mixColors($hex, '#ffffff', 0.2),
            '500' => $hex,
            '600' => $this->mixColors($hex, '#000000', 0.2),
            '700' => $this->mixColors($hex, '#000000', 0.4),
            '800' => $this->mixColors($hex, '#000000', 0.6),
            '900' => $this->mixColors($hex, '#000000', 0.8),
        ];
    }

    private function mixColors($color1, $color2, $weight)
    {
        $c1 = sscanf($color1, '#%02x%02x%02x');
        $c2 = sscanf($color2, '#%02x%02x%02x');

        $r = round($c1[0] * (1 - $weight) + $c2[0] * $weight);
        $g = round($c1[1] * (1 - $weight) + $c2[1] * $weight);
        $b = round($c1[2] * (1 - $weight) + $c2[2] * $weight);

        return sprintf('#%02x%02x%02x', $r, $g, $b);
    }
}
