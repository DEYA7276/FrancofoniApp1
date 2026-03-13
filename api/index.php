<?php
/**
 * FrancofoníaApp - API Router Principal
 * Versión con SEGURIDAD AVANZADA
 */

// Iniciar sesión para CSRF
session_start();

// Headers de seguridad
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(), microphone=(), camera=()');

// CORS - solo permitir la app
$allowedOrigins = ['http://localhost:4200', 'http://localhost', 'http://127.0.0.1:4200'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins) || $origin === '') {
    header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-CSRF-Token');
header('Access-Control-Max-Age: 3600');
header('Content-Type: application/json; charset=UTF-8');

// Pre-flight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verificación de seguridad básica
require_once __DIR__ . '/config/security.php';

// Rate Limiting para endpoints sensibles
$rateLimitedEndpoints = ['auth', 'participants', 'send-email', 'process-email-queue'];
$resource = '';

// Parse the request
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/FRANCOFONIA/FrancofoniApp1/api';
$path = str_replace($basePath, '', parse_url($requestUri, PHP_URL_PATH));
$path = trim($path, '/');
$segments = explode('/', $path);

$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

// Verificar que no sea un bot
if (!Security::verifyRequest(getallheaders())) {
    http_response_code(403);
    echo json_encode(['error' => 'Solicitud bloqueada', 'code' => 403]);
    exit;
}

// Aplicar rate limiting a endpoints sensibles
if (in_array($resource, $rateLimitedEndpoints)) {
    require_once __DIR__ . '/config/rate_limiter.php';
    $action = $resource . '_' . $method;
    if (!RateLimiter::check($action)) {
        RateLimiter::limitExceeded();
    }
}

// Route to endpoint
switch ($resource) {
    case 'auth':
        require_once __DIR__ . '/endpoints/auth.php';
        handleAuth($method, $id);
        break;
    case 'participants':
        require_once __DIR__ . '/endpoints/participants.php';
        handleParticipants($method, $id);
        break;
    case 'stands':
        require_once __DIR__ . '/endpoints/stands.php';
        handleStands($method, $id);
        break;
    case 'visits':
        require_once __DIR__ . '/endpoints/visits.php';
        handleVisits($method, $id);
        break;
    case 'surveys':
        require_once __DIR__ . '/endpoints/surveys.php';
        handleSurveys($method, $id);
        break;
    case 'users':
        require_once __DIR__ . '/endpoints/users.php';
        handleUsers($method, $id);
        break;
    case 'reports':
        require_once __DIR__ . '/endpoints/reports.php';
        $subResource = $segments[1] ?? '';
        handleReports($method, $subResource);
        break;
    case 'send-email':
        require_once __DIR__ . '/endpoints/send_email.php';
        break;
    case 'process-email-queue':
        require_once __DIR__ . '/endpoints/process_email_queue.php';
        break;
    case 'email-status':
        require_once __DIR__ . '/endpoints/email_status.php';
        break;
    case 'csrf-token':
        // Endpoint público para obtener token CSRF
        echo json_encode(['csrf_token' => Security::getCsrfTokenForClient()]);
        break;
    case 'health':
        echo json_encode(['status' => 'ok', 'timestamp' => date('c')]);
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint no encontrado', 'path' => $path]);
        break;
}
