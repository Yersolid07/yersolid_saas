<?php

use App\Services\TripayService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Http;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$service = app(TripayService::class);
$response = Http::withHeaders([
    'Authorization' => 'Bearer '.config('services.tripay.api_key'),
    'Accept' => 'application/json',
])->get($service->getBaseUrl().'/merchant/payment-channel');

echo 'HTTP Status: '.$response->status()."\n";
echo 'Response: '.$response->body()."\n";
