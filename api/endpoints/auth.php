<?php
/**
 * Endpoint: Auth - Login/Logout para staff y guests
 */
require_once __DIR__ . '/../config/database.php';

function handleAuth($method, $action) {
    $db = (new Database())->getConnection();

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        switch ($action) {
            case 'login':
                staffLogin($db, $data);
                break;
            case 'guest-login':
                guestLogin($db, $data);
                break;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Acción no válida']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
    }
}

function staffLogin($db, $data) {
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email y contraseña son requeridos']);
        return;
    }

    $stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
        return;
    }

    // Verify password
    if (!password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
        return;
    }

    // Return user data (without password)
    unset($user['password']);
    echo json_encode(['user' => $user]);
}

function guestLogin($db, $data) {
    $correo = strtolower(trim($data['correo'] ?? ''));

    if (empty($correo)) {
        http_response_code(400);
        echo json_encode(['error' => 'Correo requerido']);
        return;
    }

    $stmt = $db->prepare('SELECT * FROM participants WHERE LOWER(correo) = ?');
    $stmt->execute([$correo]);
    $participant = $stmt->fetch();

    if (!$participant) {
        http_response_code(404);
        echo json_encode(['found' => false, 'error' => 'Participante no encontrado']);
        return;
    }

    $participant['correoEnviado'] = (bool) $participant['correoEnviado'];
    echo json_encode(['found' => true, 'participant' => $participant]);
}
