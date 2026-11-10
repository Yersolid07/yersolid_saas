<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TripayService
{
    protected string $apiKey;

    protected string $privateKey;

    protected string $merchantCode;

    protected string $mode;

    public function __construct()
    {
        $this->apiKey = config('services.tripay.api_key', '');
        $this->privateKey = config('services.tripay.private_key', '');
        $this->merchantCode = config('services.tripay.merchant_code', '');
        $this->mode = config('services.tripay.mode', 'sandbox');
    }

    public function getBaseUrl(): string
    {
        return $this->mode === 'production'
            ? 'https://tripay.co.id/api'
            : 'https://tripay.co.id/api-sandbox';
    }

    /**
     * Build a merchant reference string with prefix and ID.
     */
    public function makeMerchantRef(string $prefix, string $id): string
    {
        return strtoupper($prefix).'-'.time().'-'.$id;
    }

    /**
     * Generate the HMAC signature required by Tripay.
     */
    public function makeSignature(string $merchantRef, int $amount): string
    {
        return hash_hmac('sha256', $this->merchantCode.$merchantRef.$amount, $this->privateKey);
    }

    /**
     * Create a transaction in Tripay and return the response data array.
     *
     * @throws \Exception on API error or curl failure
     */
    public function createTransaction(
        string $merchantRef,
        int $amount,
        array $customerInfo,
        array $orderItems,
        string $returnUrl,
        string $method = 'QRIS'
    ): array {
        $payload = [
            'method' => $method,
            'merchant_ref' => $merchantRef,
            'amount' => $amount,
            'customer_name' => $customerInfo['name'] ?? 'Walk-in Customer',
            'customer_email' => $customerInfo['email'] ?: 'guest@example.com',
            'customer_phone' => $customerInfo['phone'] ?: '080000000000',
            'order_items' => $orderItems,
            'return_url' => $returnUrl,
            'expired_time' => time() + (24 * 60 * 60),
            'signature' => $this->makeSignature($merchantRef, $amount),
        ];

        if (empty($this->apiKey)) {
            throw new \Exception('Tripay API Key tidak ditemukan. Pastikan Anda telah mengatur TRIPAY_API_KEY di file .env dan melakukan config:clear.');
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
            'Accept' => 'application/json',
        ])->post($this->getBaseUrl().'/transaction/create', $payload);

        if (! $response->successful()) {
            Log::error('[TripayService] HTTP error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \Exception('Tripay HTTP Error: '.$response->body());
        }

        $data = $response->json();

        if (! ($data['success'] ?? false)) {
            $msg = $data['message'] ?? 'Unknown error';
            Log::error('[TripayService] API error', ['response' => $data]);
            throw new \Exception('Tripay API Error: '.$msg);
        }

        return $data['data'];
    }

    /**
     * Verify a webhook signature.
     */
    public function verifyWebhookSignature(string $rawBody, string $headerSignature): bool
    {
        $expected = hash_hmac('sha256', $rawBody, $this->privateKey);

        return hash_equals($expected, $headerSignature);
    }

    /**
     * Fetch available payment channels.
     */
    public function getPaymentChannels(): array
    {
        if (empty($this->apiKey)) {
            throw new \RuntimeException('Tripay API key not configured');
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
            'Accept' => 'application/json',
        ])->get($this->getBaseUrl().'/merchant/payment-channel');

        if (! $response->successful()) {
            throw new \RuntimeException('Tripay payment-channel API failed: '.$response->status());
        }

        $channels = $response->json('data', []);

        if (empty($channels)) {
            throw new \RuntimeException('Tripay returned no payment channels');
        }

        return $channels;
    }
}
