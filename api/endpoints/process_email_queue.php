<?php
/**
 * Endpoint: Process Email Queue
 * Envía correos pendientes (correoEnviado = 0) en lotes asíncronos para evitar congelar el frontend.
 */
require_once __DIR__ . '/../config/database.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../PHPMailer/src/Exception.php';
require_once __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../PHPMailer/src/SMTP.php';

// Validar que se haga mediante POST o llamado local seguro
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && php_sapi_name() !== 'cli') {
    http_response_code(405);
    echo json_encode(['error' => 'Metodo no permitido']);
    exit;
}

$db = (new Database())->getConnection();

// Buscar hasta 5 participantes pendientes de envío
$stmt = $db->query('SELECT * FROM participants WHERE correoEnviado = 0 AND correo != "" LIMIT 5');
$pendientes = $stmt->fetchAll();

if (count($pendientes) === 0) {
    echo json_encode(['message' => 'Sin correos en cola', 'procesados' => 0]);
    exit;
}

$mail = new PHPMailer(true);
$procesados = 0;
$errores = 0;

try {
    // Configuración Base SMTP 
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com'; 
    $mail->SMTPAuth   = true;
    $mail->Username   = 'TU_CORREO_AQUI@gmail.com'; // TODO: Reemplazar por correo real
    $mail->Password   = 'TU_PASSWORD_AQUI';         // TODO: Reemplazar por Password de Aplicación
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->setFrom('TU_CORREO_AQUI@gmail.com', 'Francofonía 2026');
    $mail->isHTML(true);
    $mail->CharSet    = 'UTF-8';
    
    // Mantener la conexión KeepAlive abierta para mandar múltiples rápido
    $mail->SMTPKeepAlive = true;

    foreach ($pendientes as $p) {
        try {
            $mail->clearAddresses();
            $mail->addAddress($p['correo'], $p['nombre']);

            $isVIP = isset($p['tipoBoleto']) && $p['tipoBoleto'] === 'VIP';
            
            $mail->Subject = 'Bienvenido a Francofonía 2026' . ($isVIP ? ' - Invitación Especial 👑' : ' - Tu Gafete QR');
            $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" . urlencode($p['id']);
            
            $body  = "<div style='font-family: Arial, sans-serif; font-size: 14px; color: #333;'>";
            $body .= "<h2 style='color: " . ($isVIP ? "#d4af37" : "#2c3e50") . ";'>🥐 Bienvenue au Festival de Gastronomie</h2>";
            $body .= "<p>Hola <strong>{$p['nombre']}</strong>,</p>";
            $body .= "<p>Bienvenido al evento exclusivo de cultura y gastronomía francesa.</p>";
            if ($isVIP) {
                $body .= "<p><strong>🌟 ERES UN INVITADO ESPECIAL 🌟</strong> - Esperamos que disfrutes del mayor trato de excelencia.</p>";
            }
            $body .= "<p>Aquí está tu <strong>código QR digital</strong> para acceder y calificar libremente los stands:</p>";
            $body .= "<div style='background: white; padding: 15px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 20px 0;'>";
            $body .= "<img src='{$qrUrl}' alt='Tu Código QR' style='width: 250px; height: 250px; display: block;' />";
            $body .= "</div>";
            $body .= "<p>Preséntalo en cada stand para degustar.</p>";
            $body .= "<p style='color: #888; font-size: 12px;'>Equipo Francofonía 2026</p>";
            $body .= "</div>";

            $mail->Body = $body;
            $mail->send();
            
            // Marcar como completado en DB
            $upd = $db->prepare('UPDATE participants SET correoEnviado = 1 WHERE id = ?');
            $upd->execute([$p['id']]);
            $procesados++;

        } catch (Exception $e) {
            $errores++;
            // Marcar código de error o resetear a futuro según estrategia
            error_log("Error enviando a {$p['correo']}: {$mail->ErrorInfo}");
            // Reset error so it can process next
            $mail->getSMTPInstance()->reset();
        }
    }
    
    $mail->smtpClose();

} catch (Exception $e) {
    error_log("Error crítico en Bulk Mailer: {$mail->ErrorInfo}");
    echo json_encode(['error' => 'Fallo al iniciar el servidor SMTP', 'details' => $e->getMessage()]);
    exit;
}

echo json_encode(['message' => 'Cola procesada', 'exitos' => $procesados, 'fallos' => $errores]);
