<?php

namespace App\Constants;

/**
 * Centralized, standardized expense (OPEX) categories for manual entries.
 * Used by ReportController (validation) and the Reports/Inventory front-end (dropdowns).
 * System-generated categories (cafe, reservation, payment_gateway, inventory_purchase)
 * are NOT part of this list — they are created automatically by the app.
 */
final class ExpenseCategories
{
    public const OPERATIONAL_CAFE = 'Operasional Cafe';

    public const OPERATIONAL_KITCHEN = 'Operasional Dapur';

    public const UTILITIES = 'Utilitas & Listrik';

    public const CLEANING_SUPPLIES = 'Kebersihan & Perlengkapan';

    public const SALARIES = 'Gaji Karyawan';

    public const REPAIRS = 'Perbaikan Fasilitas';

    public const TRANSPORT = 'Transport & Logistik';

    public const TAX_FEES = 'Pajak & Biaya Admin';

    public const INVENTORY_PURCHASE = 'Pembelian Stok';

    public const OTHER = 'Lainnya';

    public const REFUND = 'Pengembalian';

    /** @return string[] */
    public static function all(): array
    {
        return [
            self::OPERATIONAL_CAFE,
            self::OPERATIONAL_KITCHEN,
            self::UTILITIES,
            self::CLEANING_SUPPLIES,
            self::SALARIES,
            self::REPAIRS,
            self::TRANSPORT,
            self::TAX_FEES,
            self::INVENTORY_PURCHASE,
            self::OTHER,
            self::REFUND,
        ];
    }
}
