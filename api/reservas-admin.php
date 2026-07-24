<?php

// 1. Cabeceras CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

function responder($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

ini_set('display_errors', 0);
error_reporting(E_ALL);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer-master/src/Exception.php';
require 'PHPMailer-master/src/PHPMailer.php';
require 'PHPMailer-master/src/SMTP.php';
require 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    responder(['success' => false, 'message' => 'No se recibieron datos en la petición'], 400);
}

// Variables que envía Angular desde el formulario y sesión
$cliente_nombre   = $data['cliente_nombre'] ?? $data['cliente'] ?? 'Huésped';
$cliente_correo   = $data['cliente_correo'] ?? $data['correo'] ?? '';
$admin_correo     = $data['admin_correo'] ?? 'cabanasfloresdeluna@gmail.com';
$telefono         = $data['cliente_telefono'] ?? $data['telefono'] ?? 'N/A';
$cabin_nombre     = $data['cabin'] ?? $data['cabin_nombre'] ?? '';
$fecha_llegada    = $data['fechaLlegada'] ?? $data['fecha_llegada'] ?? '';
$fecha_salida     = $data['fechaSalida'] ?? $data['fecha_salida'] ?? '';
$noches           = intval($data['noches'] ?? 1);
$monto_total      = floatval($data['montoTotal'] ?? $data['monto_total'] ?? 0);

if (empty($cliente_correo) || empty($cabin_nombre) || empty($fecha_llegada) || empty($fecha_salida)) {
    responder(['success' => false, 'message' => 'Faltan datos obligatorios para la reserva'], 400);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 1. BUSCAR O ASIGNAR USUARIO
// Buscamos si el correo del cliente ya existe como usuario registrado; si no, tomamos el usuario enviante
$stmt = $conn->prepare("SELECT id FROM usuarios WHERE correo = ?");
$stmt->bind_param("s", $cliente_correo);
$stmt->execute();
$userResults = $stmt->get_result();

if ($userResults->num_rows > 0) {
    $usuarioId = $userResults->fetch_assoc()['id'];
} else {
    // Si el cliente no tiene cuenta, usamos la del admin en sesión (o por defecto ID 1)
    $usuarioId = intval($data['usuario_id'] ?? 1);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 2. INSERTAR RESERVA (Confirmada directamente)
$precioUnitario = ($noches > 0) ? ($monto_total / $noches) : $monto_total;
$stmtReserva = $conn->prepare("INSERT INTO reservas (usuario_id, cabin_nombre, fecha_llegada, fecha_salida, noches, precio_unitario, monto_total, estado)
                                VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmada')");

$stmtReserva->bind_param("issssdd", $usuarioId, $cabin_nombre, $fecha_llegada, $fecha_salida, $noches, $precioUnitario, $monto_total);
$stmtReserva->execute();
$idDeLaReservaCreada = $conn->insert_id;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 3. INSERTAR PAGO (Tipo Transferencia / Manual)
$folioAdmin = 'FL-ADM-' . rand(100000, 999999);

$stmtPago = $conn->prepare("INSERT INTO pagos (reserva_id, folio, monto, metodo_pago, estado_pago, referencia_pago, fecha_pago)
                            VALUES (?, ?, ?, 'Transferencia', 'confirmada', 'ADMIN_MANUAL', NOW())");
$stmtPago->bind_param("isd", $idDeLaReservaCreada, $folioAdmin, $monto_total);
$stmtPago->execute();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 4. PREPARAR DATOS Y PLANTILLA DE CORREOS
$infoCabanas = [
    "Orquídea" => [
      "descripcion" => "Hermosa cabaña ideal para parejas. Un espacio íntimo y acogedor diseñado para el descanso.",
      "caracteristicas" => "👥 2 Personas | Cama matrimonial, Cajonera, Buró y Espejo",
      "amenidades" => "• WIFI • Baño completo • Cocina • Patio • Comedor • Sala"
    ],
    "Girasol" => [
      "descripcion" => "Espaciosa cabaña familiar diseñada para crear recuerdos inolvidables.",
      "caracteristicas" => "👥 6 Personas | Cama matrimonial, Cajonera, Buró, Espejo, dos literas con colchón individual",
      "amenidades" => "• WIFI • Baño completo • Cocina • Patio • Comedor • Sala"
    ],
    "Tulipán" => [
      "descripcion" => "Estancia familiar con un diseño alpino espectacular. El balance perfecto entre confort y bosque.",
      "caracteristicas" => "👥 6 Personas | Cama matrimonial, Cajonera, Buró, Espejo, dos literas con colchón individual",
      "amenidades" => "• WIFI • Baño completo • Cocina • Patio • Comedor • Sala"
    ],
    "Dalia House" => [
      "descripcion" => "Nuestra cabaña de máxima capacidad. Perfecta para reuniones familiares grandes.",
      "caracteristicas" => "👥 12 Personas | 🛏️ 2 Recámaras | 🚿 1 Baño | 🍳 Sala y Cocina",
      "amenidades" => "• 2 Camas King Size • 4 Camas Individuales • Smart TV • Internet • WIFI"
    ],
    "Magnolia House" => [
      "descripcion" => "Nuestra cabaña de máxima capacidad. Perfecta para reuniones familiares grandes.",
      "caracteristicas" => "👥 12 Personas | 🛏️ 2 Recámaras | 🚿 1 Baño | 🍳 Sala y Cocina",
      "amenidades" => "• 2 Camas King Size • 4 Camas Individuales • Smart TV • Internet • WIFI"
    ]
];

$datosExtraCabana = $infoCabanas[trim($cabin_nombre)] ?? [
  "descripcion" => "Disfruta de una maravillosa estancia en Flores de la Luna.",
  "caracteristicas" => "👥 Capacidad Estándar | 🌲 Vista al Bosque",
  "amenidades" => "• Todos los servicios esenciales incluidos"
];

$montoFormateado = number_format($monto_total, 2);
$fechaRegistro   = date('d/m/Y');
$caracCabana     = $datosExtraCabana['caracteristicas'];
$descCabana      = $datosExtraCabana['descripcion'];
$amenCabana      = $datosExtraCabana['amenidades'];

// Correo para el Cliente
$htmlCliente = <<<EOD
<div style="background-color: #fcfaf7; padding: 30px 15px; color: #4a3e3d; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #f3e9dc;">

    <div style="background-color: #ff8B64; padding: 35px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">Cabañas Flores de la Luna</h1>
    </div>

    <div style="padding: 30px 30px 15px 30px;">
      <h2 style="color: #5c2c16; font-size: 20px;">¡Hola $cliente_nombre! Tu reservación está confirmada 🌿</h2>
      <p>Tu reserva ha sido registrada con éxito mediante pago directo/transferencia.</p>
    </div>

    <div style="padding: 0 30px 15px 30px;">
      <table style="width: 100%; border-collapse: collapse; line-height: 1.8;">
        <tr><td><strong>Cabaña:</strong></td><td>$cabin_nombre</td></tr>
        <tr><td><strong>Llegada:</strong></td><td>$fecha_llegada</td></tr>
        <tr><td><strong>Salida:</strong></td><td>$fecha_salida</td></tr>
        <tr><td><strong>Noches:</strong></td><td>$noches</td></tr>
      </table>
    </div>

    <div style="padding: 0 30px 15px 30px;">
      <div style="background-color: #fdfbf9; border: 1px solid #f5eadd; padding: 20px; border-radius: 12px;">
        <h3 style="margin-top:0;">🏡 Detalles: Cabaña $cabin_nombre</h3>
        <p style="color: #ff8B64;">$caracCabana</p>
        <p>$descCabana</p>
        <p><strong>Amenidades:</strong> $amenCabana</p>
      </div>
    </div>

    <div style="padding: 15px 30px 35px 30px; background-color: #fdfbf9; text-align: center;">
      <p style="margin: 5px 0;"><strong>Folio de Reserva:</strong> $folioAdmin</p>
      <p style="margin: 5px 0; font-size: 18px; color: #2e7d32;"><strong>Monto Total:</strong> $$montoFormateado MXN</p>
      <p style="margin: 5px 0; font-size: 12px; color: #8e7a74;">(Pago confirmado vía Transferencia / Administración)</p>
    </div>

  </div>
</div>
EOD;

// Correo para el Administrador
$htmlAdmin = <<<EOD
<div style="background-color: #fcfaf7; padding: 30px 15px; color: #4a3e3d; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #f3e9dc;">

    <div style="background-color: #5c2c16; padding: 30px; text-align: center;">
      <span style="background-color: #ba4a23; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Registro Admin Manual</span>
      <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px;">📝 Reserva Registrada Exitosamente</h1>
    </div>

    <div style="padding: 30px 30px 15px 30px;">
      <p style="margin: 0; color: #6b5b55; line-height: 1.6;">Se ha bloqueado manualmente un rango de fechas desde el panel de administración por pago en efectivo o transferencia.</p>
    </div>

    <div style="padding: 0 30px 15px 30px;">
      <h3 style="color: #ff8B64; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #f5eadd; padding-bottom: 5px;">Datos del Cliente</h3>
      <table style="width: 100%; font-size: 14px; line-height: 1.8;">
        <tr><td style="color: #8e7a74; width: 35%;">Nombre:</td><td style="font-weight: 600;">$cliente_nombre</td></tr>
        <tr><td style="color: #8e7a74;">Correo Cliente:</td><td style="font-weight: 600;">$cliente_correo</td></tr>
        <tr><td style="color: #8e7a74;">Teléfono:</td><td style="font-weight: 600;">$telefono</td></tr>
        <tr><td style="color: #8e7a74;">Fecha Registro:</td><td style="font-weight: 600;">$fechaRegistro</td></tr>
      </table>
    </div>

    <div style="padding: 0 30px 30px 30px;">
      <h3 style="color: #ff8B64; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #f5eadd; padding-bottom: 5px;">Detalles del Bloqueo</h3>
      <div style="background-color: #fdfbf9; border: 1px solid #f5eadd; border-radius: 12px; padding: 20px;">
        <table style="width: 100%; font-size: 14px; line-height: 1.8;">
          <tr><td>Folio Generado:</td><td style="text-align: right; font-weight: bold;">$folioAdmin</td></tr>
          <tr><td>Cabaña:</td><td style="text-align: right; font-weight: bold;">$cabin_nombre</td></tr>
          <tr><td>Check-In:</td><td style="text-align: right;">$fecha_llegada</td></tr>
          <tr><td>Check-Out:</td><td style="text-align: right;">$fecha_salida</td></tr>
          <tr><td>Noches:</td><td style="text-align: right;">$noches</td></tr>
          <tr><td>Método:</td><td style="text-align: right; font-weight: bold; color: #2e7d32;">TRANSFERENCIA / EFECTIVO</td></tr>
          <tr><td style="padding-top: 10px; font-weight: bold;">Monto Total:</td><td style="padding-top: 10px; text-align: right; font-weight: 800; font-size: 16px;">$$montoFormateado MXN</td></tr>
        </table>
      </div>
    </div>

  </div>
</div>
EOD;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 5. ENVIAR CORREOS
function enviarCorreo($dest, $asunto, $html) {
    if (empty($html) || empty($dest)) return false;

    $mail = new PHPMailer(true);
    try {
        $mail->isMail();
        $mail->setFrom('cabanasfloresdeluna@gmail.com', 'Reservaciones Flores de la Luna');
        $mail->addAddress($dest);
        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body    = $html;
        $mail->CharSet = 'UTF-8';

        return $mail->send();
    } catch (Exception $e) {
        error_log("Error al enviar correo admin a $dest: " . $mail->ErrorInfo);
        return false;
    }
}

try {
    // 1. Correo al Cliente
    $c = enviarCorreo($cliente_correo, 'Confirmación de Reserva Directa - Cabañas Flores de la Luna', $htmlCliente);

    // 2. Correo al Administrador
    $a = enviarCorreo('cabanasfloresdeluna@gmail.com', '📝 Reserva Manual Registrada (#'.$folioAdmin.')', $htmlAdmin);

    responder([
        'success' => true,
        'folio' => $folioAdmin,
        'message' => 'Reserva guardada y correos procesados',
        'correosEnviados' => ($c || $a)
    ]);
} catch (Exception $e) {
    responder(['success' => false, 'error' => $e->getMessage()], 500);
}
?>
