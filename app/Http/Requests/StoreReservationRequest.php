<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreReservationRequest extends FormRequest
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
            'facility_id' => 'required|exists:facilities,id',
            'check_in_date' => 'required|date|after_or_equal:today',
            'check_out_date' => 'required|date|after_or_equal:check_in_date',
            'check_in_time' => 'nullable|date_format:H:i',
            'check_out_time' => 'nullable|date_format:H:i',
            'guest_count' => 'required|integer|min:1',
            'special_requests' => 'nullable|string|max:1000',
            'coupon_code' => 'nullable|string|exists:coupons,code',
            'payment_method' => 'required|in:tripay,cash',
            'payment_channel' => 'nullable|string',
            'payment_preference' => 'nullable|in:full,dp',
        ];

        if (! auth()->check()) {
            $rules['customer_name'] = 'required|string|max:255';
            $rules['customer_email'] = 'required|email|max:255';
            $rules['customer_phone'] = 'required|string|max:20';
        }

        return $rules;
    }
}
