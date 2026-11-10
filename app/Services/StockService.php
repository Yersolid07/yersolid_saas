<?php

namespace App\Services;

use App\Models\FinancialTransaction;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\MenuItem;
use App\Models\User;
use App\Notifications\LowStockAlert;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

/**
 * Satu-satunya penulis stok di sistem (single writer).
 *
 * Alasan keberadaan: sebelumnya `current_stock` ditulis dari 6 tempat berbeda
 * (DailyStock raw DB::update, MenuItemController, OrderService, Payment, 2x InventoryController).
 * DailyStock memakai raw UPDATE sehingga Spatie LogsActivity tidak terpicu ->
 * stok berubah tanpa jejak audit dan tidak sinkron dengan menu Cafe & Layanan.
 *
 * Semua jalur mutasi WAJIB lewat sini supaya:
 *  - activity_log (Spatie) selalu tercatat pada MenuItem & Inventory
 *  - notifikasi stok tipis terkirim konsisten
 *  - link menu <-> inventory (kolom inventories.menu_item_id) ikut tersinkron
 */
class StockService
{
    public const MENU = 'menu';

    public const INVENTORY = 'inventory';

    /**
     * Set stok menu ke nilai absolut (dipakai "Stok Harian Cafe" + edit Menu Cafe).
     * Menggunakan Eloquent update() supaya LogsActivity terpicu.
     *
     * @param  array<int, array{id:string, current_stock:int}>  $stocks
     * @return array{updated:int, skipped:int, low:array<int,string>}
     */
    public function setMenuStocks(array $stocks, ?string $note = 'Stok harian diperbarui'): array
    {
        $updated = 0;
        $skipped = 0;
        $low = [];

        DB::transaction(function () use ($stocks, $note, &$updated, &$skipped, &$low) {
            foreach ($stocks as $row) {
                $new = (int) $row['current_stock'];
                $item = MenuItem::where('id', $row['id'])->lockForUpdate()->first();
                if (! $item) {
                    $skipped++;

                    continue;
                }

                // Hanya tulis bila berubah -> hindari log sampah & dirty flag palsu.
                if ((int) $item->current_stock === $new) {
                    $skipped++;

                    continue;
                }

                // DOMAIN RULE (Jer): `daily_stock` adalah SISA STOK, bukan batas
                // porsi dan bukan clamp. `daily_stock` harus SELALU identik dengan
                // `current_stock` agar semua channel (Stok Harian Cafe, Menu Cafe,
                // Inventori cafe, POS) membaca angka yang sama. Kedua kolom ditulis
                // bersama agar tidak pernah beda.
                $item->update([
                    'current_stock' => $new,
                    'daily_stock' => $new,
                ]);
                $updated++;

                if ($new <= 0) {
                    $low[] = $item->name;
                }

                // GUDANG INDEPENDEN: stok menu TIDAK lagi meneruskan ke
                // inventory cafe. Stok cafe dikelola penuh di sini + menu-items;
                // inventory cafe terpisah (bahan gudang), transfer eksplisit.
            }
        });

        if ($updated > 0) {
            $this->logNote('menu_stock_set', $note, ['updated' => $updated, 'low' => $low]);
        }

        return ['updated' => $updated, 'skipped' => $skipped, 'low' => $low];
    }

    /**
     * Mutasi stok menu relatif (dipakai order paid / cancel / restore).
     *
     * Catatan: dulu metode ini langsung return bila daily_stock === null,
     * padahal banyak produk cafe (snack/minuman) tidak memakai batas harian
     * tapi MASIH punya current_stock. Akibatnya stok mereka tidak pernah
     * berkurang saat order → POS tidak sinkron dengan Stok Harian Cafe.
     * Sekarang current_stock selalu disinkronkan; daily_stock hanya dipakai
     * sebagai batas atas (clamp) bila memang diisi.
     */
    public function moveMenuStock(MenuItem $item, int $delta, string $reason): void
    {
        if ($delta === 0) {
            return;
        }

        // current_stock === null berarti produk benar-benar tanpa pelacakan stok.
        if ($item->current_stock === null) {
            return;
        }

        $fresh = MenuItem::where('id', $item->id)->lockForUpdate()->first();
        if (! $fresh || $fresh->current_stock === null) {
            return;
        }

        $new = max(0, (int) $fresh->current_stock + $delta);

        if ($new === (int) $fresh->current_stock) {
            return;
        }

        $fresh->update([
            'current_stock' => $new,
            'daily_stock' => $new,
        ]);
        // GUDANG INDEPENDEN: tidak lagi meneruskan ke inventory cafe.
        $this->logNote('menu_stock_move', $reason, [
            'menu_item' => $fresh->name,
            'delta' => $delta,
            'after' => $new,
        ]);
    }

    /**
     * Mutasi stok inventori (gudang / dapur / cafe).
     *
     * DOMAIN RULE (Jer): `out` gudang->dapur adalah PEMINDAHAN, bukan kerugian.
     * Expense hanya bila $totalCost > 0 diisi manual (rusak/hilang/beli).
     */
    public function transactInventory(
        Inventory $inventory,
        string $type,
        float $qty,
        float $totalCost = 0,
        ?string $notes = null,
        ?int $userId = null
    ): InventoryTransaction {
        return DB::transaction(function () use ($inventory, $type, $qty, $totalCost, $notes, $userId) {
            $inv = Inventory::where('id', $inventory->id)->lockForUpdate()->firstOrFail();

            if ($type === 'out') {
                if ((float) $inv->current_stock < $qty) {
                    abort(422, 'Stok tidak mencukupi untuk pengurangan');
                }
                $inv->current_stock = (float) $inv->current_stock - $qty;
            } elseif ($type === 'in') {
                $inv->current_stock = (float) $inv->current_stock + $qty;
            } else {
                $inv->current_stock = $qty; // adjustment = set exact
            }

            $inv->save();

            // GUDANG INDEPENDEN (Jer): inventori BUKAN cermin stok menu.
            // Stok cafe (menu_items.current_stock) dikelola terpisah lewat
            // staff/daily-stock & admin/menu-items (keduanya tetap sinkron).
            // Inventori = gudang/bahan baku; transfer ke cafe dilakukan
            // eksplisit lewat transaksi `out` + menu target (transferToMenu).
            // TIDAK ada lagi auto-sync menu <-> inventory di sini.

            if ($inv->minimum_stock !== null && (float) $inv->current_stock <= (float) $inv->minimum_stock) {
                $recipients = User::role(['admin', 'manager'])->get();
                if ($recipients->isNotEmpty()) {
                    Notification::send($recipients, new LowStockAlert($inv));
                }
            }

            $transaction = InventoryTransaction::create([
                'inventory_id' => $inv->id,
                'type' => $type,
                'quantity' => $qty,
                'cost' => $totalCost,
                'stock_after' => $inv->current_stock,
                'notes' => $notes,
                'user_id' => $userId ?? auth()->id(),
            ]);

            if ($totalCost > 0) {
                $category = match ($type) {
                    'in' => 'inventory_purchase',
                    'adjustment' => 'inventory_adjustment',
                    default => 'inventory_loss',
                };
                $label = match ($type) {
                    'in' => 'Pembelian Stok',
                    'adjustment' => 'Penyesuaian Stok',
                    default => 'Kerugian Stok (Out)',
                };

                FinancialTransaction::create([
                    'type' => 'expense',
                    'category' => $category,
                    'amount' => $totalCost,
                    'description' => $label.": {$inv->name}",
                    'reference_id' => $transaction->id,
                    'transaction_date' => now()->toDateString(),
                    'user_id' => auth()->id(),
                ]);
            }

            return $transaction;
        });
    }

    /**
     * Set stok inventory absolut (dipakai tab Cafe/Dapur quick-edit).
     */
    public function setInventoryStock(Inventory $inventory, float $qty, ?int $userId = null): InventoryTransaction
    {
        return $this->transactInventory($inventory, 'adjustment', $qty, 0, 'Set stok dari panel', $userId);
    }

    /**
     * Transfer stok dari gudang/inventori ke menu cafe (stok menu bertambah).
     *
     * Gudang (inventories) berkurang; menu cafe (menu_items.current_stock &
     * daily_stock) bertambah. Menu TETAP sinkron dengan staff/daily-stock &
     * admin/menu-items (keduanya baca kolom yang sama). Transfer mencatat
     * InventoryTransaction (out) di gudang + activity_log di menu.
     */
    public function transferToMenu(Inventory $inventory, MenuItem $menuItem, float $qty, ?string $notes = null, ?int $userId = null): void
    {
        if ($qty <= 0) {
            abort(422, 'Jumlah transfer harus lebih dari 0');
        }

        DB::transaction(function () use ($inventory, $menuItem, $qty, $notes, $userId) {
            // 1) Gudang berkurang (out) — lewat transactInventory (audit + notif).
            $this->transactInventory(
                $inventory,
                'out',
                $qty,
                0,
                $notes ?: 'Transfer ke menu cafe: '.$menuItem->name,
                $userId
            );

            // 2) Menu cafe bertambah — lewat moveMenuStock (+qty).
            //    moveMenuStock menulis current_stock & daily_stock bersama (sinkron).
            $this->moveMenuStock($menuItem, (int) round($qty), 'Transfer dari gudang: '.$inventory->name);
        });
    }

    /**
     * Transfer stok dari menu cafe kembali ke gudang (menu berkurang).
     * Dipakai bila kelebihan/retur. Menu tetap sinkron dengan channel-nya.
     */
    public function transferFromMenu(MenuItem $menuItem, Inventory $inventory, float $qty, ?string $notes = null, ?int $userId = null): void
    {
        if ($qty <= 0) {
            abort(422, 'Jumlah transfer harus lebih dari 0');
        }

        DB::transaction(function () use ($inventory, $menuItem, $qty, $notes, $userId) {
            // 1) Menu cafe berkurang.
            $this->moveMenuStock($menuItem, -1 * (int) round($qty), 'Retur ke gudang: '.$inventory->name);

            // 2) Gudang bertambah (in) — catat transaksi.
            $this->transactInventory(
                $inventory,
                'in',
                $qty,
                0,
                $notes ?: 'Retur dari menu cafe: '.$menuItem->name,
                $userId
            );
        });
    }

    protected function logNote(string $event, string $message, array $props = []): void
    {
        try {
            activity('stock')
                ->event($event)
                ->withProperties($props + ['message' => $message])
                ->log($message);
        } catch (\Throwable $e) {
            Log::warning('[StockService] activity log failed: '.$e->getMessage());
        }
    }
}
