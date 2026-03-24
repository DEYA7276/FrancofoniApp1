<?php
$ch = curl_init('http://localhost/FRANCOFONIA/FrancofoniApp1/api/request-reset');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Origin: http://localhost:8100',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['email' => '23610062@utgz.edu.mx']));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
file_put_contents('output.txt', "HTTP Code: $httpcode\nResponse: $response\n");
echo "Listo. Revisa output.txt\n";
