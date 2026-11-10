<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Staff\TableStatusController;
use App\Http\Requests\StoreFoodOrderRequest;
use App\Models\FoodOrder;
use App\Models\MenuItem;
use App\Models\QRCode;
use App\Models\Reservation;
use App\Services\OrderService;
use App\Services\PaymentService;
use App\Services\TripayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class FoodOrderController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Customer/FoodOrders/Index', [
            'orders' => FoodOrder::with(['items.menuItem'])
                ->where('user_id', auth()->id())
                ->latest()
                ->paginate(10),
        ]);
    }

    public function create(Request $request)
    {
        $activeReservations = [];
        if (auth()->check()) {
            $activeReservations = Reservation::with('facility')
                ->where('user_id', auth()->id())
                ->whereIn('status', ['pending', 'confirmed', 'checked_in'])
                ->get();
        }

        $paymentChannels = Cache::remember('tripay_channels', 3600, function () {
            try {
                return app(TripayService::class)->getPaymentChannels();
            } catch (\Exception $e) {
                return [];
            }
        });

        if (empty($paymentChannels)) {
            Cache::forget('tripay_channels');
        }

        // Fetch ALL available (is_available=true) menu items including exhausted ones
        // so we can show "Habis" badge on the frontend
        $allMenuItems = MenuItem::where('is_available', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->map(function ($item) {
                // Mark item as out of stock if it uses daily stock tracking and stock is depleted
                $item->is_out_of_stock = ($item->current_stock !== null && $item->current_stock <= 0);

                return $item;
            })
            ->groupBy('category');

        return Inertia::render('Customer/FoodOrders/Create', [
            'menuItems' => $allMenuItems,
            'reservationId' => $request->reservation_id,
            'activeReservations' => $activeReservations,
            'qrCodes' => QRCode::all(),
            'availableTables' => TableStatusController::tableStatuses(),
            'isAuthenticated' => auth()->check(),
            'user' => auth()->user(),
            'paymentChannels' => $paymentChannels,
        ]);
    }

    public function store(StoreFoodOrderRequest $request)
    {
        $validated = $request->validated();

        try {
            $order = app(OrderService::class)
                ->createOrder(
                    $validated,
                    auth()->id(),
                    auth()->check() ? null : session()->getId()
                );
        } catch (\Exception $e) {
            return back()->withErrors(['items' => $e->getMessage()]);
        }

        // For guest users: persist order ID in session so the home page can
        // show a "resume tracking" link if they navigate away.
        if (! auth()->check()) {
            session(['guest_order_id' => $order->id]);
        }

        // Handle Payment for non room_service
        $checkoutUrl = null;
        if ($validated['order_type'] !== 'room_service') {
            $customerInfo = auth()->check()
                ? [
                    'name' => auth()->user()->name,
                    'email' => auth()->user()->email,
                    'phone' => auth()->user()->phone ?? null,
                ]
                : [
                    'name' => $validated['customer_name'],
                    'email' => null, // guest email not collected for food orders
                    'phone' => $validated['customer_phone'],
                ];

            $paymentMethod = $validated['payment_method'] ?? 'cash';
            $result = app(PaymentService::class)
                ->createForFoodOrder($order, $paymentMethod, $customerInfo, $validated['payment_channel'] ?? null);
            $checkoutUrl = $result['checkout_url'];
            $tripayError = $result['error'] ?? null;
        }

        // Admin & Kitchen will be notified once payment is confirmed (via Tripay Webhook or POS checkout)

        if ($checkoutUrl) {
            return Inertia::location($checkoutUrl);
        }

        if ($validated['order_type'] !== 'room_service' && ($validated['payment_method'] ?? '') === 'tripay') {
            $msg = 'Gagal memproses pembayaran online'.($tripayError ? ': '.$tripayError : '').'. Silakan bayar di kasir.';

            return redirect()->route('customer.orders.show', $order->id)->with('error', $msg);
        }

        return redirect()->route('customer.orders.show', $order->id)
            ->with('success', 'Pesanan makanan berhasil dibuat!');
    }

    public function show(FoodOrder $order)
    {
        // FIX #5 — 403 saat "kembali" dari Tripay.
        // Setelah bayar, Tripay membuka return_url di konteks browser/sesi BARU,
        // sehingga sesi & auth lama hilang. Versi lama hanya mengizinkan guest
        // (user_id NULL) -> order milik user login langsung 403 permanen.
        // Aturan baru: siapa pun yang memegang UUID order boleh MELIHAT status
        // pesanannya (read-only). UUID tidak dapat ditebak, dan halaman ini tidak
        // membocorkan data pengguna lain selain isi pesanannya sendiri.
        $user = auth()->user();

        if ($user && $user->hasAnyRole(['admin', 'manager', 'staff'])) {
            // staff bebas melihat semua
        } elseif ($user && $order->user_id !== null && (int) $order->user_id !== (int) $user->id) {
            abort(403, 'Anda tidak berhak melihat pesanan ini.');
        }

        // Re-establish guest tracking supaya banner "lanjutkan pesanan" muncul
        // setelah redirect Tripay (sesi lama sudah tidak ada).
        if (! $user || $order->user_id === null) {
            session(['guest_order_id' => $order->id]);
        }

        return Inertia::render('Customer/FoodOrders/Show', [
            'order' => $order->load(['items.menuItem', 'reservation.facility', 'payment', 'user']),
            'isGuest' => ! $order->user_id,
        ]);
    }
}
