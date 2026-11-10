<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\FoodOrder;
use App\Models\MenuItem;
use App\Models\QRCode;
use App\Services\OrderService;
use App\Services\PaymentService;
use App\Services\TripayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class POSController extends Controller
{
    public function index(): Response
    {
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

        return Inertia::render('Staff/POS/Index', [
            'paymentChannels' => $paymentChannels,
            'menuItems' => MenuItem::where('is_available', true)
                ->where('category', '<>', 'tiket')   // tickets are sold at Kasir Tiket, not POS
                ->orderBy('category')
                ->orderBy('name')
                ->get()
                ->map(function ($item) {
                    $item->is_out_of_stock = ($item->current_stock !== null && $item->current_stock <= 0);

                    return $item;
                })
                ->groupBy('category'),

            /**
             * Show unpaid orders the cashier can act on.
             * - Online/Tripay orders are handled by the webhook and should NOT appear here.
             * - Delivered (completed) orders are excluded; cancelled stays visible so it can be cleaned up.
             */
            'activeOrders' => FoodOrder::with(['items.menuItem', 'reservation.facility', 'user', 'payment'])
                ->whereIn('payment_status', ['unpaid', 'paid'])
                ->whereIn('status', ['awaiting_cashier', 'pending', 'preparing', 'ready'])
                ->where(function ($q) {
                    $q->whereHas('payment', fn ($sub) => $sub->where('payment_method', 'cash'))
                        ->orWhere('user_id', auth()->id())
                        ->orWhere('status', 'awaiting_cashier');
                })
                ->latest()
                ->get(),

            'user' => auth()->user(),

            // Tables (QR) grouped by gazebo for the POS dropdown
            'tables' => QRCode::with('gazebo')
                ->where('location_type', 'table')
                ->orderBy('table_number')
                ->get(['id', 'label', 'table_number', 'gazebo_id'])
                ->map(function ($t) {
                    return [
                        'id' => $t->id,
                        'label' => $t->label,
                        'table_number' => $t->table_number,
                        'gazebo_name' => $t->gazebo?->name ?? 'Lainnya',
                    ];
                })
                ->groupBy('gazebo_name')
                ->map(function ($group, $gazebo) {
                    return [
                        'gazebo' => $gazebo,
                        'tables' => $group->values()->all(),
                    ];
                })
                ->values()
                ->all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'nullable|exists:food_orders,id',
            'order_type' => 'required|in:dine_in,takeaway',
            'table_number' => 'required_if:order_type,dine_in|nullable|string|max:20',
            'customer_name' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1|max:100',
            'items.*.notes' => 'nullable|string',
            'items.*.is_existing' => 'nullable|boolean',
            // Accepted POS payment methods
            'payment_method' => 'required|in:cash,qris,transfer,edc,ewallet',
            'payment_channel' => 'required_if:payment_method,transfer,ewallet|nullable|string',
            'amount_paid' => 'required_if:payment_method,cash|nullable|numeric|min:0',
        ]);

        // Normalize table_number for consistency with QR codes (uppercase, trimmed)
        if (! empty($validated['table_number'])) {
            $validated['table_number'] = strtoupper(trim($validated['table_number']));
        }

        // Map handled later to preserve original string for $isTripay

        $totalAmount = 0;
        $menuItemIds = collect($validated['items'])->pluck('menu_item_id')->unique();
        $menuItems = MenuItem::whereIn('id', $menuItemIds)->get()->keyBy('id');

        foreach ($validated['items'] as $item) {
            $menuItem = $menuItems->get($item['menu_item_id']);
            if ($menuItem) {
                $totalAmount += $menuItem->final_price * $item['quantity'];
            }
        }

        if ($validated['payment_method'] === 'cash' && ($validated['amount_paid'] ?? 0) < $totalAmount) {
            return back()->withErrors(['amount_paid' => 'Jumlah bayar kurang dari total tagihan.']);
        }

        // Keep the original requested method for the Tripay check
        $originalPaymentMethod = $validated['payment_method'];
        $isTripay = in_array($originalPaymentMethod, ['qris', 'transfer', 'ewallet', 'tripay']);

        // Map POS frontend payment methods to Database ENUM values for OrderService
        if ($validated['payment_method'] === 'edc') {
            $validated['payment_method'] = 'credit_card';
        } elseif ($validated['payment_method'] === 'qris') {
            $validated['payment_method'] = 'tripay';
        }

        $checkoutUrl = null;
        $qrUrl = null;
        $paymentId = null;
        try {
            // If it's Tripay, we do NOT mark it as paid immediately
            $markAsPaid = ! $isTripay;
            $order = app(OrderService::class)->processPosOrder($validated, auth()->id(), $markAsPaid);

            if ($isTripay) {
                // Determine channel code
                $channel = $validated['payment_channel'] ?? null;
                if ($originalPaymentMethod === 'qris' && empty($channel)) {
                    $channel = 'QRIS';
                }

                $customerInfo = [
                    'name' => $validated['customer_name'] ?? 'Walk-in Customer',
                    'email' => 'walkin@example.com',
                    'phone' => '080000000000',
                ];

                $result = app(PaymentService::class)
                    ->createForFoodOrder($order, 'tripay', $customerInfo, $channel, route('staff.pos.print', $order->id));

                if (! empty($result['error'])) {
                    throw new \Exception('Tripay error: '.$result['error']);
                }

                $checkoutUrl = $result['checkout_url'] ?? null;
                $qrUrl = $result['qr_url'] ?? ($result['gateway_response']['qr_url'] ?? null);
                $paymentId = $result['payment']->id ?? null;
            }
        } catch (\Exception $e) {
            return back()->withErrors(['items' => $e->getMessage()]);
        }

        // Load items for bluetooth receipt printing
        $order->load(['items.menuItem', 'user']);
        $orderDataForPrint = [
            'id' => $order->id,
            'customerName' => $order->customer_name ?? ($order->user?->name ?? 'Tamu'),
            'total' => $order->total_amount,
            'payment_status' => $order->payment_status,
            'items' => $order->items->map(function ($item) {
                return [
                    'name' => $item->menuItem->name ?? 'Item',
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                ];
            })->toArray(),
        ];

        return back()->with([
            'success' => 'Transaksi berhasil diproses.',
            'print_order_id' => $order->id,
            'print_order_data' => $orderDataForPrint,
            'checkout_url' => $checkoutUrl,
            'qr_url' => $qrUrl,
            'payment_id' => $paymentId,
            'change_amount' => $validated['payment_method'] === 'cash'
                ? (($validated['amount_paid'] ?? 0) - $totalAmount)
                : 0,
        ]);
    }

    public function print(FoodOrder $order)
    {
        $order->load(['items.menuItem', 'user']);

        return view('reports.pos-receipt', compact('order'));
    }
}
