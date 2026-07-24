<?php
// test-email.php - PRUEBA SMTP AUTÉNTICA

// 1. Permitir el origen de tu aplicación Angular
header("Access-Control-Allow-Origin: *");

// 2. Permitir los métodos HTTP que usas (especialmente POST y OPTIONS)
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");

// 3. Permitir las cabeceras que envía Angular (como Content-Type)
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// 4. Manejar la petición "preflight" OPTIONS (Angular la envía automáticamente antes del POST)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
// Si es una petición OPTIONS, salimos inmediatamente con éxito
    http_response_code(200);
    exit;
}

function responder($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Reportar errores para depuración
ini_set('display_errors', 0);
error_reporting(E_ALL);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer-master/src/Exception.php';
require 'PHPMailer-master/src/PHPMailer.php';
require 'PHPMailer-master/src/SMTP.php';
require 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) { die(json_encode(['success' => false, 'message' => 'No hay datos'])); }



$clienteCorreo = $data['cliente_correo'] ?? $data['correo'] ?? 'bscotaku14@gmail.com';
$adminCorreo   = $data['admin_correo']   ?? 'cabanasfloresdeluna@gmail.com';

$html = 'holiiiis';

function probarEnvioSMTP($destinatario, $rol) {
    if (empty($destinatario)) return false;

    $mail = new PHPMailer(true);
    try {
        // --- CAMBIO CLAVE: Usamos la función interna de PHP ---
        $mail->isMail();

        // Configuraciones básicas
        $mail->setFrom('reservas@floresdelaluna.mx', 'Reservaciones Flores de la Luna');
        $mail->addAddress($dest);
        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body = $html;
        $mail->CharSet = 'UTF-8';

        return $mail->send();
    } catch (Exception $e) {
        error_log("Error SMTP al enviar a $destinatario: " . $mail->ErrorInfo);
        return false;
    }
}

// Ejecutar envíos
$enviadoCliente = probarEnvioSMTP($clienteCorreo, 'Cliente');
$enviadoAdmin   = probarEnvioSMTP($adminCorreo, 'Administrador');

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'success' => true,
    'folio' => 'FL-SMTP-' . rand(1000, 9999),
    'message' => 'Petición procesada vía SMTP',
    'correosEnviados' => ($enviadoCliente && $enviadoAdmin),
    'detalles' => [
        'cliente' => ['correo' => $clienteCorreo, 'enviado' => $enviadoCliente],
        'admin'   => ['correo' => $adminCorreo, 'enviado' => $enviadoAdmin]
    ]
]);
?>
