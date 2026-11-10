<?php

namespace App\Services;

use App\Models\FoodOrder;
use App\Models\MenuItem;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\NewFoodOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class OrderService
{
    public function __construct(private StockService $stock) {}

    /**
     * Create a new food order (for customer self-ordering via QR/web).
     *
     * @param  array  $validated  Validated order data
     * @param  int|null  $userId  User ID (if authenticated)
     * @param  string|null  $sessionId  Session ID (for guests)
     *
     * @throws \Exception
     */
    public function createOrder(array $validated, ?int $userId, ?string $sessionId): FoodOrder
    {
        return DB::transaction(function () use ($validated, $userId, $sessionId) {
            $realTotal = 0;
            $resolvedItems = []; // pre-validated items with locked menu data

            // STEP 1: Lock and validate ALL items before creating any record (Sorted to prevent deadlock)
            $sortedItems = collect($validated['items'])->sortBy('menu_item_id')->values()->all();
            foreach ($sortedItems as $item) {
                $menuItem = MenuItem::where('id', $item['menu_item_id'])->lockForUpdate()->firstOrFail();

                if (! $menuItem->is_available) {
                    throw new \Exception("Menu \"{$menuItem->name}\" saat ini tidak tersedia.");
                }

                // Pelacakan stok berlaku bila daily_stock diisi (batas harian)
                // ATAU current_stock diisi (produk cafe yang dijual langsung).
                $tracked = $menuItem->daily_stock !== null || $menuItem->current_stock !== null;
                if ($tracked) {
                    if ($menuItem->current_stock <= 0) {
                        throw new \Exception("Stok \"{$menuItem->name}\" sudah habis untuk hari ini.");
                    }
                    if ($menuItem->current_stock < $item['quantity']) {
                        throw new \Exception("Stok \"{$menuItem->name}\" tidak mencukupi. Sisa: {$menuItem->current_stock} porsi.");
                    }
                }

                $resolvedItems[] = [
                    'menuItem' => $menuItem,
                    'quantity' => $item['quantity'],
                    'price' => $menuItem->final_price,
                ];

                $realTotal += $menuItem->final_price * $item['quantity'];
            }

            // STEP 2: Create the FoodOrder now that all items are validated
            $orderData = [
                'total_amount' => $realTotal,
                'order_type' => $validated['order_type'],
                'table_number' => $validated['table_number'] ?? null,
                'reservation_id' => $validated['reservation_id'] ?? null,
                'notes' => $validated['notes'] ?? null,
                // #3 GERBANG KASIR: pesanan online masuk antrean kasir dulu.
                // Status 'pending' hanya diberikan setelah kasir ACC (approve()).
                'status' => 'awaiting_cashier',
                'payment_status' => 'unpaid',
            ];

            if ($userId) {
                $orderData['user_id'] = $userId;
            } else {
                $orderData['customer_name'] = $validated['customer_name'] ?? null;
                $orderData['customer_phone'] = $validated['customer_phone'] ?? null;
                $orderData['session_id'] = $sessionId;
            }

            $order = FoodOrder::create($orderData);

            // STEP 3: Deduct stock and create order items
            foreach ($resolvedItems as $resolved) {
                $menuItem = $resolved['menuItem'];

                // StockService = satu-satunya penulis stok (audit trail konsisten).
                // Dulu ada guard `daily_stock !== null` di sini, yang membuat
                // produk tanpa batas harian (snack/minuman) tidak pernah berkurang.
                $this->stock->moveMenuStock($menuItem, -(int) $resolved['quantity'], 'Order dibuat '.$order->id);

                $order->items()->create([
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $resolved['quantity'],
                    'price' => $resolved['price'],
                    'status' => $menuItem->is_counter_pickup ? 'delivered' : 'pending',
                ]);
            }

            return $order;
        });
    }

    /**
     * Process POS Order (Create new or append to existing unpaid order).
     * All POS payments are physically verified by the cashier — immediately marked as paid.
     */
    public function processPosOrder(array $validated, int $userId, bool $markAsPaid = true): FoodOrder
    {
        return DB::transaction(function () use ($validated, $userId, $markAsPaid) {

            $paymentMethod = $validated['payment_method'] ?? 'cash';

            if (! empty($validated['order_id'])) {
                // ─────────────────────────────────────────────────
                // APPEND to existing order (customer ordered via QR,
                // chose "bayar di kasir", now at cashier counter)
                // ─────────────────────────────────────────────────
                $order = FoodOrder::findOrFail($validated['order_id']);

                $newItemsAdded = false;
                $sortedItems = collect($validated['items'])->sortBy('menu_item_id')->values()->all();
                foreach ($sortedItems as $item) {
                    if (empty($item['is_existing'])) {
                        $menuItem = MenuItem::where('id', $item['menu_item_id'])->lockForUpdate()->firstOrFail();

                        if (! $menuItem->is_available) {
                            throw new \Exception("Menu \"{$menuItem->name}\" saat ini tidak tersedia.");
                        }

                        if ($menuItem->daily_stock !== null || $menuItem->current_stock !== null) {
                            if ($menuItem->current_stock <= 0) {
                                throw new \Exception("Stok \"{$menuItem->name}\" sudah habis untuk hari ini.");
                            }
                            if ($menuItem->current_stock < $item['quantity']) {
                                throw new \Exception("Stok \"{$menuItem->name}\" tidak mencukupi. Sisa: {$menuItem->current_stock} porsi.");
                            }
                            $this->stock->moveMenuStock($menuItem, -(int) $item['quantity'], 'Order dibuat');
                        }

                        $order->items()->create([
                            'menu_item_id' => $menuItem->id,
                            'quantity' => $item['quantity'],
                            'price' => $menuItem->final_price,
                            'notes' => $item['notes'] ?? null,
                            'status' => $menuItem->is_counter_pickup ? 'delivered' : 'pending',
                        ]);
                        $newItemsAdded = true;
                    }
                }

                $order->recalculateTotal();

                // Mark order as paid by cashier if markAsPaid is true
                $order->update([
                    'order_type' => $validated['order_type'] ?? $order->order_type,
                    'table_number' => $validated['table_number'] ?? $order->table_number,
                    'customer_name' => $validated['customer_name'] ?? $order->customer_name,
                    'notes' => $validated['notes'] ?? $order->notes,
                    'payment_status' => $markAsPaid ? 'paid' : 'unpaid',
                    'status' => 'pending', // Always start as pending in KDS
                    'user_id' => $userId,
                ]);

                // Create or update the Payment record for financial tracking
                if ($markAsPaid) {
                    $existingPayment = $order->fresh()->payment;
                    if ($existingPayment) {
                        $existingPayment->update([
                            'payment_method' => $paymentMethod,
                            'amount' => $order->total_amount,
                        ]);
                        $existingPayment->markAsSuccess();
                    } else {
                        $payment = Payment::create([
                            'food_order_id' => $order->id,
                            'amount' => $order->total_amount,
                            'payment_method' => $paymentMethod,
                            'payment_status' => 'pending',
                        ]);
                        $payment->markAsSuccess();
                    }
                }

                // #3 GERBANG KASIR: online order masuk antrean kasir, TIDAK masuk KDS.
                // Notifikasi dikirim ke kasir/staff saat order online dibuat.
                if (! $markAsPaid && $newItemsAdded) {
                    $hasFood = $order->items->contains(
                        fn ($i) => $i->menuItem && in_array($i->menuItem->category, ['makanan', 'minuman', 'snack', 'dessert'])
                    );

                    if ($hasFood) {
                        $kitchenStaff = User::role(['staff', 'manager', 'admin'])->get();
                        Notification::send($kitchenStaff, new NewFoodOrder($order));
                    }
                }

            } else {
                // ─────────────────────────────────────────────────
                // NEW POS order (walk-in customer, cashier creates)
                // ─────────────────────────────────────────────────
                $realTotal = 0;
                $resolvedItems = [];
                $sortedItems = collect($validated['items'])->sortBy('menu_item_id')->values()->all();

                foreach ($sortedItems as $item) {
                    $menuItem = MenuItem::where('id', $item['menu_item_id'])->lockForUpdate()->firstOrFail();

                    if (! $menuItem->is_available) {
                        throw new \Exception("Menu \"{$menuItem->name}\" saat ini tidak tersedia.");
                    }

                    // DOMAIN RULE (Jer): stok dilacak bila current_stock diisi.
                    // daily_stock hanyalah cermin dari current_stock (sisa stok).
                    if ($menuItem->current_stock !== null) {
                        if ($menuItem->current_stock <= 0) {
                            throw new \Exception("Stok \"{$menuItem->name}\" sudah habis untuk hari ini.");
                        }
                        if ($menuItem->current_stock < $item['quantity']) {
                            throw new \Exception("Stok \"{$menuItem->name}\" tidak mencukupi. Sisa: {$menuItem->current_stock} porsi.");
                        }
                    }

                    $resolvedItems[] = [
                        'menuItem' => $menuItem,
                        'quantity' => $item['quantity'],
                        'notes' => $item['notes'] ?? null,
                        'price' => $menuItem->final_price,
                    ];

                    $realTotal += $menuItem->final_price * $item['quantity'];
                }

                $order = FoodOrder::create([
                    'total_amount' => $realTotal,
                    'order_type' => $validated['order_type'],
                    'table_number' => $validated['table_number'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                    'customer_name' => $validated['customer_name'] ?? 'Guest Walk-in',
                    'payment_status' => $markAsPaid ? 'paid' : 'unpaid',
                    'status' => 'pending',
                    'user_id' => $userId,
                ]);

                $hasFood = false;
                foreach ($resolvedItems as $resolved) {
                    $menuItem = $resolved['menuItem'];

                    if ($menuItem->daily_stock !== null || $menuItem->current_stock !== null) {
                        $this->stock->moveMenuStock($menuItem, -(int) $resolved['quantity'], 'Order dibuat '.$order->id);
                    }

                    $order->items()->create([
                        'menu_item_id' => $menuItem->id,
                        'quantity' => $resolved['quantity'],
                        'price' => $resolved['price'],
                        'notes' => $resolved['notes'],
                        'status' => $menuItem->is_counter_pickup ? 'delivered' : 'pending',
                    ]);

                    if (in_array($menuItem->category, ['makanan', 'minuman', 'snack', 'dessert'])) {
                        $hasFood = true;
                    }
                }

                // Create Payment record AFTER items so markAsSuccess() sees all items
                if ($markAsPaid) {
                    $payment = Payment::create([
                        'food_order_id' => $order->id,
                        'amount' => $realTotal,
                        'payment_method' => $paymentMethod,
                        'payment_status' => 'pending',
                    ]);
                    $payment->markAsSuccess();
                } else {
                    // Only send notification here if it's NOT paid immediately.
                    // If paid immediately, Payment::markAsSuccess() will handle the notification.
                    if ($hasFood) {
                        $kitchenStaff = User::role(['staff', 'manager', 'admin'])->get();
                        Notification::send($kitchenStaff, new NewFoodOrder($order));
                    } else {
                        // Tiket/non-food only order: complete immediately
                        $order->update(['status' => 'delivered']);
                    }
                }

            }

            return $order;
        });
    }
}
