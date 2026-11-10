<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveFacilityRequest extends FormRequest
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
        return [
            'name' => 'required|string|max:255',
            'type' => 'required|in:homestay,gazebo,pool,cafe',
            'description' => 'nullable|string',
            'capacity' => 'nullable|integer|min:1',
            'bed_count' => 'nullable|integer|min:0',
            'price_prefix' => 'nullable|string|max:100',
            'price_unit' => 'nullable|string|max:100',
            'price_per_day' => 'nullable|numeric|min:0',
            'price_per_hour' => 'nullable|numeric|min:0',
            'image' => 'nullable|image|max:2048',
            'promo_name' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'amenities' => 'nullable|array',
            'amenities.*.icon' => 'nullable|string|max:100',
            'amenities.*.label' => 'nullable|string|max:255',
            'rules' => 'nullable|array',
            'rules.*' => 'nullable|string|max:255',
        ];
    }
}
