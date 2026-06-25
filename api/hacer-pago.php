<?php
//hacer-pago.php

// Reportar errores para depuración
ini_set('display_errors', 1);
error_reporting(E_ALL);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer-master/src/Exception.php';
require 'PHPMailer-master/src/PHPMailer.php';
require 'PHPMailer-master/src/SMTP.php';
require 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) { die(json_encode(['success' => false, 'message' => 'No hay datos'])); }


$nombre = $data['nombre'];
$email = $data['email'];
$cabin_nombre = $data['cabin_nombre'];
$monto_total = $data['monto_total'];
$noches = $data['noches'];
$estado_pago = $data['estado_pago'];


// 1. BUSCAR USUARIO
$stmt = $conn->prepare("SELECT id FROM usuarios WHERE correo = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$userResults = $stmt->get_result();

if ($userResults->num_rows === 0) {
    die(json_encode(['success' => false, 'requireAuth' => true, 'message' => 'Debes iniciar sesión']));
}
$usuarioId = $userResults->fetch_assoc()['id'];

// 2. INSERTAR RESERVA
$precioUnitario = floatval($monto_total) / intval($noches);
$stmtReserva = $conn->prepare("INSERT INTO reservas (usuario_id, cabin_nombre, fecha_llegada, fecha_salida, noches, precio_unitario, monto_total, estado)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
// ... (ejecuta el insert, usa $conn->insert_id para obtener el ID)
$idDeLaReservaCreada = $conn->insert_id;

// 3. LÓGICA DE PAGO (PayPal)
$folioSimulado = 'FL-' . rand(100000, 999999);
$estadoPagoDB = ($estado_pago === 'confirmada') ? 'confirmada' : 'fallido';

$stmtPago = $conn->prepare("INSERT INTO pagos (reserva_id, folio, monto, estado_pago, fecha_pago) VALUES (?, ?, ?, ?, NOW())");
$stmtPago->bind_param("isds", $idDeLaReservaCreada, $folioSimulado, $monto_total, $estadoPagoDB);
$stmtPago->execute();



function enviarCorreo($destinatario, $asunto, $htmlContenido) {
    $mail = new PHPMailer(true);
    try {
        // Configuración del servidor SMTP (HostGator)
        $mail->isSMTP();
        $mail->Host       = 'mail.floresdelaluna.mx';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'tu_correo@floresdelaluna.mx'; // Tu correo real
        $mail->Password   = 'tu_contraseña';                // Tu contraseña real
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        // Destinatarios
        $mail->setFrom('reservas@floresdelaluna.mx', 'Cabañas Flores de la Luna');
        $mail->addAddress($destinatario);

        // Contenido
        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body    = $htmlContenido;
        $mail->CharSet = 'UTF-8';

        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}


// 4. Ejecución del envío
$clienteExitoso = enviarCorreo($email, '🌲 ¡Confirmación de tu Reserva!', $htmlCliente);
$adminExitoso = enviarCorreo('cabanasfloresdelaluna@gmail.com', '🚨 Nueva Reservación', $htmlAdmin);

// 5. Respuesta final a Angular
echo json_encode(['success' => true, 'correosEnviados' => ($clienteExitoso && $adminExitoso)]);
?>
