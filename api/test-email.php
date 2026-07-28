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


// Variables que envía Angular desde el formulario y sesión
$cliente_nombre   = trim($data['cliente_nombre'] ?? '');
$cliente_correo   = trim($data['cliente_correo'] ?? '');
$admin_correo     = trim($data['admin_correo'] ?? 'cabanasfloresdeluna@gmail.com');
$telefono         = trim($data['cliente_telefono'] ?? '');
$cabin_nombre     = trim($data['cabin'] ?? '');
$fecha_llegada    = trim($data['fechaLlegada'] ?? '');
$fecha_salida     = trim($data['fechaSalida'] ?? '');
$noches           = intval($data['noches'] ?? 1);
$monto_total      = floatval($data['montoTotal'] ?? 0);



if (empty($cliente_correo) || empty($cabin_nombre) || empty($fecha_llegada) || empty($fecha_salida)) {
    responder(['success' => false, 'message' => 'Campos obligatorios incompletos (correo, cabaña o fechas)'], 400);
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
$nochesValidadas = max(1, $noches); // Evita división entre cero
$precioUnitario  = $monto_total / $nochesValidadas;
$stmtReserva = $conn->prepare("INSERT INTO reservas (usuario_id, cabin_nombre, fecha_llegada, fecha_salida, noches, precio_unitario, monto_total, estado)
                                VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmada')");

$stmtReserva->bind_param("isssidd", $usuarioId, $cabin_nombre, $fecha_llegada, $fecha_salida, $noches, $precioUnitario, $monto_total);
$stmtReserva->execute();
$idDeLaReservaCreada = $conn->insert_id;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

$folioSimulado = $data['folio'] ?? ('FL-' . rand(100000, 999999));
$estadoPagoDB = $data['estado_pago'] ?? 'confirmada';

$stmtPago = $conn->prepare("INSERT INTO pagos (reserva_id, folio, monto, metodo_pago, estado_pago, referencia_pago, fecha_pago)
                            VALUES (?, ?, ?, 'Transferencia', ? , 'ADMIN_MANUAL', NOW())");
$stmtPago->bind_param("isds", $idDeLaReservaCreada, $folioSimulado, $monto_total, $estadoPagoDB);
$stmtPago->execute();

// 4. PREPARAR DATOS Y PLANTILLA DE CORREOS
  $infoCabanas = [
    "Orquídea"=>[
      "descripcion"=> "Hermosa cabaña ideal para parejas. Un espacio íntimo y acogedor diseñado para el descanso y la reconexión en la naturaleza.",
      "caracteristicas" => "👥 2 Personas | Cama matrimonial, Cajonera, Buró y Espejo",
      "amenidades" => "• WIFI • Baño completo • Cocina • Patio • Comedor • Sala"
    ],
    "Girasol"=>[
      "descripcion"=> "Espaciosa cabaña familiar diseñada para crear recuerdos inolvidables con los tuyos, rodeados de paisajes boscoscos únicos.",
      "caracteristicas" => "👥 6 Personas | Cama matrimonial, Cajonera, Buró, Espejo, dos literas con colchón individual , Tv y Cajonera",
      "amenidades" => "• WIFI • Baño completo • Cocina • Patio • Comedor • Sala"
    ],
    "Tulipán"=>[
      "descripcion"=> "Estancia familiar con un diseño alpino espectacular. El balance perfecto entre confort hogareño y la magia del bosque.",
      "caracteristicas" => "👥 6 Personas | Cama matrimonial, Cajonera, Buró, Espejo, dos literas con colchón individual , Tv y Cajonera",
      "amenidades" => "• WIFI • Baño completo • Cocina • Patio • Comedor • Sala"
    ],
    "Dalia House"=>[
      "descripcion"=> "Nuestra cabaña de máxima capacidad. Perfecta para reuniones familiares grandes o grupos que buscan vivir la experiencia de montaña al máximo.",
      "caracteristicas" => "👥 12 Personas | 🛏️ 2 Recámaras | 🚿 1 Baño | 🍳 Sala y Cocina",
      "amenidades" => "• 2 Camas King Size • 4 Camas Individuales • Smart TV • Internet • WIFI • Mirador"
    ],
    "Magnolia House"=>[
      "descripcion"=> "Nuestra cabaña de máxima capacidad. Perfecta para reuniones familiares grandes o grupos que buscan vivir la experiencia de montaña al máximo.",
      "caracteristicas" => "👥 12 Personas | 🛏️ 2 Recámaras | 🚿 1 Baño | 🍳 Sala y Cocina",
      "amenidades" => "• 2 Camas King Size • 4 Camas Individuales • Smart TV • Internet • WIFI • Mirador"
    ],

  ];

$datosExtraCabana = $infoCabanas[trim($cabin_nombre)] ??
 [
  "descripcion" => "Disfruta de una maravillosa estancia en Flores de la Luna rodeado de naturaleza.",
  "caracteristicas" => "👥 Capacidad Estándar | 🌲 Vista al Bosque",
  "amenidades" => "• Todos los servicios esenciales incluidos"
];

$montoFormateado = number_format($monto_total, 2);
$fechaRecibo     = date('d/m/Y');
$pagoExitoso     = ($estado_pago === 'confirmada');

$badgeColor      = $pagoExitoso ? '#e8f5e9' : '#ffebee';
$badgeTextoColor = $pagoExitoso ? '#2e7d32' : '#c62828';
$badgeTexto      = $pagoExitoso ? 'Pago por Transferencia Validado' : 'Pendiente / Rechazado';


// 4. PLANTILLAS HTML ADAPTADAS A TRANSFERENCIA
$pagoExitoso_titulo      = $pagoExitoso ? '¡Todo listo! Tu reservación está confirmada' : '⚠️ Reserva Registrada: Pago Pendiente de Validar';
$mensajeIntroduccionHTML = $pagoExitoso
    ? "Hemos registrado y validado con éxito tu pago por transferencia bancaria."
    : "Tu solicitud fue registrada. Recuerda enviar tu comprobante de transferencia para concluir la confirmación.";

$descCabana  = $datosExtraCabana['descripcion'];
$caracCabana = $datosExtraCabana['caracteristicas'];
$amenCabana  = $datosExtraCabana['amenidades'];

// Correo para el Cliente
$htmlCliente = <<<EOD
<div style="background-color: #fcfaf7; padding: 30px 15px; color: #4a3e3d; font-family: sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #f3e9dc;">
    <div style="background-color: #ff8B64; padding: 35px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">Cabañas Flores de la Luna</h1>
    </div>
    <div style="padding: 30px 30px 15px 30px;">
      <h2 style="color: #5c2c16; font-size: 20px; margin-top: 0;">$pagoExitoso_titulo</h2>
      <p style="color: #6b5b55; line-height: 1.5;">Hola <strong>$cliente_nombre</strong>, $mensajeIntroduccionHTML</p>
    </div>
    <div style="padding: 0 30px 15px 30px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #8e7a74;">Cabaña:</td><td style="font-weight: bold;">$cabin_nombre</td></tr>
        <tr><td style="padding: 8px 0; color: #8e7a74;">Llegada:</td><td style="font-weight: bold;">$fecha_llegada</td></tr>
        <tr><td style="padding: 8px 0; color: #8e7a74;">Salida:</td><td style="font-weight: bold;">$fecha_salida</td></tr>
        <tr><td style="padding: 8px 0; color: #8e7a74;">Noches:</td><td style="font-weight: bold;">$noches</td></tr>
        <tr><td style="padding: 8px 0; color: #8e7a74;">Método de Pago:</td><td style="font-weight: bold;">Transferencia Bancaria</td></tr>
      </table>
    </div>
    <div style="padding: 0 30px 15px 30px;">
      <div style="background-color: #fdfbf9; border: 1px solid #f5eadd; padding: 20px; border-radius: 12px;">
        <h3 style="margin-top:0; color: #5c2c16; font-size: 16px;">🏡 Detalles de tu estancia</h3>
        <p style="color: #ff8B64; font-weight: bold; margin: 5px 0;">$caracCabana</p>
        <p style="font-size: 13px; color: #6b5b55;">$descCabana</p>
        <p style="font-size: 13px; margin-bottom: 0;"><strong>Amenidades:</strong> $amenCabana</p>
      </div>
    </div>
    <div style="padding: 15px 30px 35px 30px; background-color: #fcfaf7;">
      <p style="margin: 5px 0;"><strong>Folio de Reserva:</strong> $folioSimulado</p>
      <p style="margin: 5px 0; font-size: 18px; color: #5c2c16;"><strong>Monto Total:</strong> $$montoFormateado MXN</p>
    </div>
  </div>
</div>
EOD;

// Datos dinámicos para el Administrador
$adminTitulo     = $pagoExitoso ? '🚨 Reserva Manual Registrada (Transferencia)' : '⚠️ Reserva Pendiente por Confirmar';
$adminColorFondo = $pagoExitoso ? '#5c2c16' : '#991b1b';
$adminIntro      = $pagoExitoso
    ? 'Se ha registrado una reserva directamente desde el panel de administración. El pago por transferencia bancaria ha sido acordado o validado.'
    : 'Se generó un registro previo de reserva, pero falta validar la recepción del depósito o transferencia.';

$adminInstruccion = 'Recuerda bloquear manualmente la cabaña en tu calendario físico o de recepción si aún no está sincronizado.';

// Correo para el Administrador
$htmlAdmin = <<<EOD
<div style="background-color: #fcfaf7; padding: 30px 15px; color: #4a3e3d; font-family: sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #f3e9dc;">
    <div style="background-color: $adminColorFondo; padding: 30px; text-align: center;">
      <span style="background-color: #ba4a23; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Administración</span>
      <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 22px; font-weight: 700;">$adminTitulo</h1>
    </div>
    <div style="padding: 30px 30px 15px 30px;">
      <p style="margin: 0; color: #6b5b55; line-height: 1.6; font-size: 14px;">$adminIntro</p>
    </div>
    <div style="padding: 0 30px 15px 30px;">
      <h3 style="color: #ff8B64; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #f5eadd; padding-bottom: 5px;">Datos del Huésped</h3>
      <table style="width: 100%; font-size: 14px;">
        <tr><td style="color: #8e7a74; width: 35%;">Nombre:</td><td style="font-weight: 600;">$cliente_nombre</td></tr>
        <tr><td style="color: #8e7a74;">Correo:</td><td style="font-weight: 600;">$cliente_correo</td></tr>
        <tr><td style="color: #8e7a74;">Teléfono:</td><td style="font-weight: 600;">$telefono</td></tr>
        <tr><td style="color: #8e7a74;">Fecha Registro:</td><td style="font-weight: 600;">$fechaRecibo</td></tr>
      </table>
    </div>
    <div style="padding: 0 30px 30px 30px;">
      <h3 style="color: #ff8B64; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #f5eadd; padding-bottom: 5px;">Detalles del Hospedaje</h3>
      <div style="background-color: #fdfbf9; border: 1px solid #f5eadd; border-radius: 12px; padding: 20px;">
        <table style="width: 100%; font-size: 14px; line-height: 1.8;">
          <tr><td>Cabaña:</td><td style="text-align: right; font-weight: bold;">$cabin_nombre</td></tr>
          <tr><td>Check-In:</td><td style="text-align: right;">$fecha_llegada</td></tr>
          <tr><td>Check-Out:</td><td style="text-align: right;">$fecha_salida</td></tr>
          <tr><td>Noches:</td><td style="text-align: right;">$noches</td></tr>
          <tr><td>Estatus Pago:</td><td style="text-align: right;"><span style="background-color: $badgeColor; color: $badgeTextoColor; border-radius: 30px; padding: 2px 10px; font-size: 12px;">$badgeTexto</span></td></tr>
          <tr><td style="padding-top: 10px; font-weight: bold;">Monto Total:</td><td style="padding-top: 10px; text-align: right; font-weight: 800; font-size: 16px;">$$montoFormateado MXN</td></tr>
        </table>
      </div>
    </div>
    <div style="background-color: #fdfbf9; padding: 15px; text-align: center; border-top: 1px solid #f5eadd; font-size: 12px; color: #8e7a74;">
      <p style="margin: 0;">$adminInstruccion</p>
    </div>
  </div>
</div>
EOD;

function enviarCorreo($dest, $asunto, $html) {
    if (empty($dest)) return false;

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
        error_log("Error SMTP al enviar a $dest: " . $mail->ErrorInfo);
        return false;
    }
}

try{
//ENVIAR CLIENTE
$c = enviarCorreo($cliente_correo, 'Confirmación de Reserva', $htmlCliente);
//ENVIAR ADMINISTRADOR
$a = enviarCorreo($admin_correo, 'Nueva Reserva', $htmlAdmin);

$a2 = enviarCorreo('katyasandoval@editraka.com', 'Nueva Reserva', $htmlAdmin);

responder(['success' => true,
            'usuario_encontrado' => ($usuarioId !== null),
            'usuario_id' => $usuarioId,
            'correosEnviados' => ($c && $a1 && $a2)]);
}
catch( Exception $e){
responder(['success' => false, 'error_smtp' => $e->getMessage()], 500);
}
?>
