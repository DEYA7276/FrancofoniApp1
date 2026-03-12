<?php
/**
 * Endpoint: Participants - CRUD completo con Cola de Correos Asíncrona
 */
require_once __DIR__ . '/../config/database.php';

function handleParticipants($method, $id) {
    $db = (new Database())->getConnection();

    switch ($method) {
        case 'GET':
            if ($id) {
                getParticipantById($db, $id);
            } else {
                // Check for query params
                $correo = $_GET['correo'] ?? null;
                if ($correo) {
                    getParticipantByEmail($db, $correo);
                } else {
                    getAllParticipants($db);
                }
            }
            break;
        case 'POST':
            createParticipant($db);
            break;
        case 'PUT':
            if ($id) updateParticipant($db, $id);
            else { http_response_code(400); echo json_encode(['error' => 'ID requerido']); }
            break;
        case 'DELETE':
            if ($id) deleteParticipant($db, $id);
            else { http_response_code(400); echo json_encode(['error' => 'ID requerido']); }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
    }
}

function getAllParticipants($db) {
    $stmt = $db->query('SELECT * FROM participants ORDER BY createdAt DESC');
    $participants = $stmt->fetchAll();
    foreach ($participants as &$p) {
        $p['correoEnviado'] = (bool) $p['correoEnviado'];
    }
    echo json_encode($participants);
}

function getParticipantById($db, $id) {
    $stmt = $db->prepare('SELECT * FROM participants WHERE id = ?');
    $stmt->execute([$id]);
    $p = $stmt->fetch();
    if ($p) {
        $p['correoEnviado'] = (bool) $p['correoEnviado'];
        echo json_encode($p);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Participante no encontrado']);
    }
}

function getParticipantByEmail($db, $correo) {
    $stmt = $db->prepare('SELECT * FROM participants WHERE LOWER(correo) = ?');
    $stmt->execute([strtolower(trim($correo))]);
    $p = $stmt->fetch();
    if ($p) {
        $p['correoEnviado'] = (bool) $p['correoEnviado'];
        echo json_encode($p);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'No encontrado']);
    }
}

function createParticipant($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = 'p-' . uniqid();

    $stmt = $db->prepare('INSERT INTO participants (id, nombre, apellido_paterno, apellido_materno, ciudad, municipio, sexo, correo, qrCode, correoEnviado, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');
    $stmt->execute([
        $id,
        $data['nombre'] ?? '',
        $data['apellido_paterno'] ?? '',
        $data['apellido_materno'] ?? '',
        $data['ciudad'] ?? '',
        $data['municipio'] ?? '',
        $data['sexo'] ?? '',
        strtolower(trim($data['correo'] ?? '')),
        $data['qrCode'] ?? null,
        $data['correoEnviado'] ?? false ? 1 : 0
    ]);

    echo json_encode([
        'id' => $id, 
        'message' => 'Participante registrado. El correo se enviará en segundo plano.', 
        'correoStatus' => 'En Cola'
    ]);
}

function updateParticipant($db, $id) {
    $data = json_decode(file_get_contents('php://input'), true);

    $fields = [];
    $values = [];

    $allowed = ['nombre', 'apellido_paterno', 'apellido_materno', 'ciudad', 'municipio', 'sexo', 'correo', 'qrCode', 'correoEnviado'];
    foreach ($allowed as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = ?";
            $val = $data[$field];
            if ($field === 'correoEnviado') $val = $val ? 1 : 0;
            if ($field === 'correo') $val = strtolower(trim($val));
            $values[] = $val;
        }
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No hay campos para actualizar']);
        return;
    }

    $values[] = $id;
    $sql = 'UPDATE participants SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $db->prepare($sql)->execute($values);

    echo json_encode(['message' => 'Participante actualizado']);
}

function deleteParticipant($db, $id) {
    $stmt = $db->prepare('DELETE FROM participants WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['message' => 'Participante eliminado']);
}
