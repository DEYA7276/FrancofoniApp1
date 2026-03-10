<?php
/**
 * FrancofoníaApp - API Router Principal
 * Punto de entrada para todas las peticiones REST
 */

// CORS headers para desarrollo local
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

// Pre-flight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Parse the request
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/FRANCOFONIA/FrancofoniApp1/api';
$path = str_replace($basePath, '', parse_url($requestUri, PHP_URL_PATH));
$path = trim($path, '/');
$segments = explode('/', $path);

$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

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
    case 'health':
        echo json_encode(['status' => 'ok', 'timestamp' => date('c')]);
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint no encontrado', 'path' => $path]);
        break;
}
