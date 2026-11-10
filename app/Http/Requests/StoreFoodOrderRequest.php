<?php

namespace App\Http\Requests;

use App\Models\Reservation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreFoodOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'order_type' => 'required|in:dine_in,takeaway,room_service',
            'table_number' => 'required_if:order_type,dine_in|nullable|string|max:20',
            'reservation_id' => 'required_if:order_type,room_service|nullable|exists:reservations,id',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1|max:100',
            'payment_method' => 'required_unless:order_type,room_service|in:tripay,cash',
            'payment_channel' => 'nullable|string',
        ];

        if (! auth()->check()) {
            $rules['customer_name'] = 'required|string|max:255';
            $rules['customer_phone'] = 'required|string|max:50';
        }

        return $rules;
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->order_type === 'room_service') {
                if (empty($this->reservation_id)) {
                    $validator->errors()->add('reservation_id', 'Reservasi harus dipilih untuk layanan kamar.');
                }
                if (! auth()->check()) {
                    $validator->errors()->add('auth', 'Anda harus login untuk memesan layanan kamar.');
                }

                if (! empty($this->reservation_id)) {
                    $reservation = Reservation::find($this->reservation_id);
                    if ($reservation && $reservation->user_id !== auth()->id()) {
                        $validator->errors()->add('reservation_id', 'Anda tidak berhak memesan layanan kamar untuk reservasi ini.');
                    }
                }
            }
        });
    }
}
