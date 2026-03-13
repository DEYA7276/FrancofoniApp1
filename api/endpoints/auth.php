<?php
/**
 * Endpoint: Auth - Login/Logout para staff y guests
 * Versión segura con validación y logging
 */
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/validator.php';
require_once __DIR__ . '/../config/security_logger.php';

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
    
    // Validar inputs
    $emailError = InputValidator::validateEmail($email);
    if ($emailError) {
        http_response_code(400);
        echo json_encode(['error' => $emailError]);
        return;
    }
    
    $passError = InputValidator::validatePassword($password);
    if ($passError) {
        http_response_code(400);
        echo json_encode(['error' => $passError]);
        return;
    }

    $stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([strtolower(trim($email))]);
    $user = $stmt->fetch();

    if (!$user) {
        SecurityLogger::loginFailed($email, 'Usuario no encontrado');
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
        return;
    }

    // Verify password
    if (!password_verify($password, $user['password'])) {
        SecurityLogger::loginFailed($email, 'Password incorrecto');
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
        return;
    }

    // Login exitoso
    SecurityLogger::loginSuccess($user['id'], $user['role']);
    
    // Return user data (without password)
    unset($user['password']);
    echo json_encode(['user' => $user]);
}

function guestLogin($db, $data) {
    $correo = strtolower(trim($data['correo'] ?? ''));

    // Validar email
    $emailError = InputValidator::validateEmail($correo);
    if ($emailError) {
        http_response_code(400);
        echo json_encode(['error' => $emailError]);
        return;
    }

    $stmt = $db->prepare('SELECT * FROM participants WHERE correo = ?');
    $stmt->execute([$correo]);
    $participant = $stmt->fetch();

    if (!$participant) {
        SecurityLogger::loginFailed($correo, 'Participante no encontrado');
        http_response_code(404);
        echo json_encode(['found' => false, 'error' => 'Participante no encontrado']);
        return;
    }

    SecurityLogger::loginSuccess($participant['id'], 'guest');
    
    // No exponer datos sensibles
    $safeParticipant = [
        'id' => $participant['id'],
        'nombre' => $participant['nombre'],
        'apellido_paterno' => $participant['apellido_paterno'],
        'correo' => $participant['correo'],
        'correoEnviado' => (bool) $participant['correoEnviado']
    ];
    
    echo json_encode(['found' => true, 'participant' => $safeParticipant]);
}
