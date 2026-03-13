<?php
/**
 * Endpoint: Process Email Queue
 * Envía correos pendientes (correoEnviado = 0) en lotes asíncronos
 * 
 * Mejorado con:
 * - Archivo de configuración separado
 * - Logs estructurados
 * - Manejo de errores detallado
 * - Reintentos automáticos
 * - Diagnóstico automático de problemas
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/email_config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require_once __DIR__ . '/../PHPMailer/src/Exception.php';
require_once __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../PHPMailer/src/SMTP.php';

// Validar que se haga mediante POST o llamado local seguro
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && php_sapi_name() !== 'cli') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Cargar configuración
$config = require __DIR__ . '/../config/email_config.php';
$smtpConfig = $config[$config['provider']] ?? $config['gmail'];

// Función de logging
function logEmail($mensaje, $tipo = 'INFO') {
    global $config;
    if ($config['enable_logs']) {
        $logDir = dirname($config['log_file']);
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0755, true);
        }
        $fecha = date('Y-m-d H:i:s');
        $logEntry = "[$fecha] [$tipo] $mensaje\n";
        @file_put_contents($config['log_file'], $logEntry, FILE_APPEND);
    }
}

logEmail("=== Inicio de procesamiento de cola de correos ===");

$db = (new Database())->getConnection();

// Buscar participantes pendientes de envío
$stmt = $db->query('SELECT * FROM participants WHERE correoEnviado = 0 AND correo != "" AND correo IS NOT NULL LIMIT ' . ($config['batch_size'] ?? 5));
$pendientes = $stmt->fetchAll();

if (count($pendientes) === 0) {
    logEmail("No hay correos pendientes en cola");
    echo json_encode(['message' => 'Sin correos en cola', 'procesados' => 0]);
    exit;
}

logEmail("Encontrados " . count($pendientes) . " correos pendientes");

$mail = new PHPMailer(true);
$procesados = 0;
$errores = 0;
$detalles = [];

try {
    // Configuración SMTP
    $mail->SMTPDebug = SMTP::DEBUG_OFF; // Cambiar a DEBUG_SERVER para debuggear
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
    
    // Configuración de tiempo de espera
    $mail->Timeout = 30;
    
    logEmail("Conexión SMTP configurada hacia {$smtpConfig['host']}");

    // Mantener la conexión KeepAlive abierta para mandar múltiples rápido
    $mail->SMTPKeepAlive = true;

    foreach ($pendientes as $p) {
        $intentos = 0;
        $enviado = false;
        
        while (!$enviado && $intentos < ($config['max_retries'] ?? 3)) {
            $intentos++;
            
            try {
                $mail->clearAddresses();
                $mail->addAddress($p['correo'], $p['nombre']);
                
                $mail->Subject = $config['subject'];
                
                // Generar URL del QR
                $qrData = urlencode($p['id']);
                $qrSize = $config['qr_size'] ?? 250;
                $qrUrl = "{$config['qr_api_url']}?size={$qrSize}x{$qrSize}&data={$qrData}";
                
                // Construir cuerpo del correo
                $body = buildEmailBody($p, $qrUrl, $config);
                $mail->Body = $body;
                
                $mail->send();
                
                // Marcar como completado en DB
                $upd = $db->prepare('UPDATE participants SET correoEnviado = 1 WHERE id = ?');
                $upd->execute([$p['id']]);
                
                $procesados++;
                $enviado = true;
                $detalles[] = [
                    'correo' => $p['correo'],
                    'nombre' => $p['nombre'],
                    'status' => 'enviado',
                    'intentos' => $intentos
                ];
                logEmail("Correo enviado a {$p['correo']} (intento $intentos)", 'SUCCESS');
                
            } catch (Exception $e) {
                logEmail("Intento $intentos fallido para {$p['correo']}: " . $mail->ErrorInfo, 'ERROR');
                
                if ($intentos < ($config['max_retries'] ?? 3)) {
                    // Esperar un poco antes de reintentar
                    sleep(2);
                }
            }
        }
        
        if (!$enviado) {
            $errores++;
            $detalles[] = [
                'correo' => $p['correo'],
                'nombre' => $p['nombre'],
                'status' => 'fallido',
                'intentos' => $intentos,
                'error' => $mail->ErrorInfo
            ];
            logEmail("Fallo definitivo para {$p['correo']} después de $intentos intentos", 'ERROR');
        }
        
        // Reset SMTP para siguiente correo
        $mail->getSMTPInstance()->reset();
    }

    $mail->smtpClose();

} catch (Exception $e) {
    logEmail("Error crítico: " . $e->getMessage(), 'CRITICAL');
    echo json_encode([
        'error' => 'Fallo al iniciar el servidor SMTP', 
        'details' => $e->getMessage(),
        'hint' => 'Verificar credenciales SMTP en config/email_config.php'
    ]);
    exit;
}

logEmail("=== Fin de procesamiento: $procesados enviados, $errores fallidos ===");

echo json_encode([
    'message' => 'Cola procesada', 
    'exitos' => $procesados, 
    'fallos' => $errores,
    'detalles' => $detalles
]);

/**
 * Construye el cuerpo del correo HTML
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
                    <!-- Header con gradiente -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0A2342 0%, #2087C7 60%, #174A7C 100%); padding: 30px; text-align: center;">
                            <h1 style="color: #FBC02D; margin: 0; font-size: 28px;">🥐 Francofonía 2026</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">La gastronomía une al mundo</p>
                        </td>
                    </tr>
                    
                    <!-- Contenido -->
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
                            
                            <!-- Código QR -->
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
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                            <p style="color: #888888; font-size: 12px; margin: 0;">
                                © 2026 Francofonía. Todos los derechos reservados.
                            </p>
                            <p style="color: #888888; font-size: 11px; margin: 5px 0 0 0;">
                                Equipo Francofonía 2026
                            </p>
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
