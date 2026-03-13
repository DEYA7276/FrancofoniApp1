<?php
/**
 * Endpoint: Envío de Correo Individual
 * Envía un correo inmediatamente a un participante específico
 * Útil para pruebas o reenvíos
 * 
 * POST /api/send-email
 * {
 *   "participantId": "p-123456"
 * }
 * 
 * Opcional:
 * {
 *   "participantId": "p-123456",
 *   "resend": true  // Para reenviar aunque ya tenga correoEnviado = 1
 * }
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/email_config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require_once __DIR__ . '/../PHPMailer/src/Exception.php';
require_once __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../PHPMailer/src/SMTP.php';

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido. Use POST']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$participantId = $data['participantId'] ?? '';
$forceResend = $data['resend'] ?? false;

if (empty($participantId)) {
    http_response_code(400);
    echo json_encode(['error' => 'participantId es requerido']);
    exit;
}

// Cargar configuración
$config = require __DIR__ . '/../config/email_config.php';
$smtpConfig = $config[$config['provider']] ?? $config['gmail'];

// Conectar a BD
$db = (new Database())->getConnection();

// Buscar participante
$stmt = $db->prepare('SELECT * FROM participants WHERE id = ?');
$stmt->execute([$participantId]);
$participante = $stmt->fetch();

if (!$participante) {
    http_response_code(404);
    echo json_encode(['error' => 'Participante no encontrado']);
    exit;
}

// Verificar si ya se envió (a menos que sea reenvío forzado)
if (!$forceResend && $participante['correoEnviado']) {
    echo json_encode([
        'message' => 'El correo ya fue enviado anteriormente',
        'resend' => true,
        'hint' => 'Use {"participantId": "xxx", "resend": true} para forzar reenvío'
    ]);
    exit;
}

if (empty($participante['correo'])) {
    http_response_code(400);
    echo json_encode(['error' => 'El participante no tiene correo electrónico']);
    exit;
}

// Configurar PHPMailer
$mail = new PHPMailer(true);

try {
    $mail->SMTPDebug = SMTP::DEBUG_OFF;
    $mail->isSMTP();
    $mail->Host       = $smtpConfig['host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $smtpConfig['username'];
    $mail->Password   = $smtpConfig['password'];
    $mail->SMTPSecure = $smtpConfig['encryption'] === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $smtpConfig['port'];
    $mail->setFrom($smtpConfig['from_email'], $smtpConfig['from_name']);
    $mail->isHTML(true);
    $mail->CharSet = 'UTF-8';
    $mail->Timeout = 30;
    
    // Destinatario
    $mail->addAddress($participante['correo'], $participante['nombre']);
    
    // Asunto
    $mail->Subject = $config['subject'];
    
    // Generar QR
    $qrData = urlencode($participante['id']);
    $qrSize = $config['qr_size'] ?? 250;
    $qrUrl = "{$config['qr_api_url']}?size={$qrSize}x{$qrSize}&data={$qrData}";
    
    // Cuerpo del correo
    $body = buildEmailBody($participante, $qrUrl, $config);
    $mail->Body = $body;
    
    // Enviar
    $mail->send();
    
    // Actualizar BD
    $upd = $db->prepare('UPDATE participants SET correoEnviado = 1 WHERE id = ?');
    $upd->execute([$participantId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Correo enviado exitosamente',
        'correo' => $participante['correo'],
        'nombre' => $participante['nombre']
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al enviar correo',
        'details' => $mail->ErrorInfo,
        'hint' => 'Verificar credenciales SMTP en config/email_config.php'
    ]);
}

/**
 * Construye el cuerpo del correo HTML (mismo que process_email_queue)
 */
function buildEmailBody($participante, $qrUrl, $config) {
    $nombre = htmlspecialchars($participante['nombre']);
    
    $body = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #0A2342 0%, #2087C7 60%, #174A7C 100%); padding: 30px; text-align: center;">
                            <h1 style="color: #FBC02D; margin: 0; font-size: 28px;">🥐 Francofonía 2026</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">La gastronomía une al mundo</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px;">
                            <h2 style="color: #722F37; margin-top: 0;">Bienvenue, $nombre!</h2>
                            <p style="color: #333333; font-size: 14px; line-height: 1.6;">
                                Bienvenido al evento exclusivo de cultura y gastronomía francesa. 
                                ¡Estás a punto de vivir una experiencia única!
                            </p>
                            <p style="color: #333333; font-size: 14px; line-height: 1.6;">
                                Aquí está tu <strong>código QR digital</strong>. Muéstralo en cada stand para recibir tu degustación:
                            </p>
                            <div style="text-align: center; margin: 25px 0;">
                                <div style="background: white; padding: 15px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                    <img src="$qrUrl" alt="Tu Código QR" style="width: 250px; height: 250px; display: block;" />
                                </div>
                            </div>
                            <p style="color: #666666; font-size: 12px; text-align: center;">
                                Presenta este código en cada stand para degustrar
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                            <p style="color: #888888; font-size: 12px; margin: 0;">© 2026 Francofonía. Todos los derechos reservados.</p>
                            <p style="color: #888888; font-size: 11px; margin: 5px 0 0 0;">Equipo Francofonía 2026</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

    return $body;
}
