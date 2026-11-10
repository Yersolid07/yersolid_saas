<?php

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_FRESH_CONNECT => true,
    CURLOPT_URL => 'https://tripay.co.id/api-sandbox/merchant/payment-channel',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => false,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer DEV-ryikcBHRm4QgORslsEKPXndIuc8gP0PdEnZub6pR'],
]);
$response = curl_exec($curl);
curl_close($curl);
echo $response;
