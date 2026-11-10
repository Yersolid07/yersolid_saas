<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\FoodOrder;
use App\Models\Reservation;
use App\Models\Setting;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    /**
     * Load company info from Settings CMS instead of hardcoding.
     */
    private function companyInfo(): array
    {
        return [
            'name' => Setting::get('site_name', 'Your Business Name'),
            'address' => Setting::get('site_address', 'Your business address'),
            'phone' => Setting::get('site_phone', '-'),
            'email' => Setting::get('site_email', '-'),
        ];
    }

    public function reservation(Reservation $reservation)
    {
        if ($reservation->user_id) {
            if ($reservation->user_id !== auth()->id() && (! auth()->check() || ! auth()->user()->hasAnyRole(['admin', 'manager', 'staff']))) {
                abort(403);
            }
        } else {
            // Guest reservation: Must match session or be staff
            if ($reservation->session_id !== session()->getId() && (! auth()->check() || ! auth()->user()->hasAnyRole(['admin', 'manager', 'staff']))) {
                abort(403);
            }
        }

        $reservation->load(['facility', 'user', 'payment']);

        return Inertia::render('Customer/Reservations/Print', [
            'reservation' => $reservation,
            'company' => $this->companyInfo(),
        ]);
    }

    public function foodOrder(FoodOrder $order)
    {
        if ($order->user_id) {
            if ($order->user_id !== auth()->id() && (! auth()->check() || ! auth()->user()->hasAnyRole(['admin', 'manager', 'staff']))) {
                abort(403);
            }
        } else {
            if ($order->session_id !== session()->getId() && (! auth()->check() || ! auth()->user()->hasAnyRole(['admin', 'manager', 'staff']))) {
                abort(403);
            }
        }

        $order->load(['user', 'items.menuItem', 'reservation.facility', 'payment']);

        return Inertia::render('Customer/FoodOrders/Print', [
            'order' => $order,
            'company' => $this->companyInfo(),
        ]);
    }
}
