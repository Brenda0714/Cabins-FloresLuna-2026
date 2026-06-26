<?php
//hacer-pago.php

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


$nombre = $data['nombre'];
$email = $data['email'];
$cabin_nombre = $data['cabin_nombre'];
$monto_total = $data['monto_total'];
$noches = $data['noches'];
$estado_pago = $data['estado_pago'];
$fecha_llegada = $data['fecha_llegada'];
$fecha_salida = $data['fecha_salida'];
$telefono = $data['telefono'] ?? '';
$referenciaPayPalReal = $data['referencia_pago'] ?? 'N/A';
$finalEstadoReserva = ($estado_pago === 'confirmada') ? 'confirmada' : 'pendiente';




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 1. BUSCAR USUARIO
$stmt = $conn->prepare("SELECT id FROM usuarios WHERE correo = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$userResults = $stmt->get_result();

if ($userResults->num_rows === 0) {
    responder(['success' => false, 'requireAuth' => true, 'message' => 'Debes iniciar sesión'], 401);
}
$usuarioId = $userResults->fetch_assoc()['id'];


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 2. INSERTAR RESERVA
$precioUnitario = floatval($monto_total) / intval($noches);
$stmtReserva = $conn->prepare("INSERT INTO reservas (usuario_id, cabin_nombre, fecha_llegada, fecha_salida, noches, precio_unitario, monto_total, estado)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

$stmtReserva->bind_param("issssdds", $usuarioId, $cabin_nombre, $fecha_llegada, $fecha_salida, $noches, $precioUnitario, $monto_total, $finalEstadoReserva);
$stmtReserva->execute();
$idDeLaReservaCreada = $conn->insert_id;



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 3. LÓGICA DE PAGO (PayPal)
$folioSimulado = 'FL-' . rand(100000, 999999);
$estadoPagoDB = ($estado_pago === 'confirmada') ? 'confirmada' : 'fallido';

$stmtPago = $conn->prepare("  INSERT INTO pagos (reserva_id, folio, monto, metodo_pago, estado_pago, referencia_pago, fecha_pago)
                                  VALUES (?, ?, ?, 'PayPal', ?, ?, NOW())");
$stmtPago->bind_param("isdss", $idDeLaReservaCreada, $folioSimulado, $monto_total, $estadoPagoDB, $referenciaPayPalReal);
$stmtPago->execute();


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 4. PREPARACION PARA EMAIL

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



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 5. PREPARAR VARIABLES PARA EMAIL (Necesarias para email-template.php)
$montoFormateado = number_format($monto_total, 2);
$fechaRecibo = date('d/m/Y');
$badgeColor = ($estado_pago === 'confirmada') ? '#e8f5e9' : '#ffebee';
$badgeTextoColor = ($estado_pago === 'confirmada') ? '#2e7d32' : '#c62828';
$badgeTexto = ($estado_pago === 'confirmada') ? 'Completado' : 'Rechazado';
$mensajeIntroduccionHTML = ($estado_pago === 'confirmada') ? "Confirmación de pago." : "Problema con el pago.";
$pagoExitoso = ($estado_pago === 'confirmada');

// 1. Prepara las variables simples antes del bloque HTML
$pagoExitoso_titulo = $pagoExitoso ? '¡Todo listo! Tu reservación está confirmada' : '⚠️ Atención: Pago Rechazado / Pendiente';
$descCabana = $datosExtraCabana['descripcion'];
$caracCabana = $datosExtraCabana['caracteristicas'];
$amenCabana = $datosExtraCabana['amenidades'];

// 2. Bloque Heredoc (Nota: sin llaves, solo $variable)
$htmlCliente = <<<EOD
<div style="background-color: #fcfaf7; padding: 30px 15px; color: #4a3e3d;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(139, 69, 19, 0.05); border: 1px solid #f3e9dc;">

    <div style="background-color: #ff8B64; padding: 35px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px;">Cabañas Flores de la Luna</h1>
    </div>

    <div style="padding: 30px 30px 15px 30px;">
      <h2 style="color: #5c2c16; font-size: 20px;">$pagoExitoso_titulo</h2>
      <p>$mensajeIntroduccionHTML</p>
    </div>

    <div style="padding: 0 30px 15px 30px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td>Cabaña:</td>
          <td>$cabin_nombre</td>
        </tr>
        <tr>
          <td>Llegada:</td>
          <td>$fecha_llegada</td>
        </tr>
        <tr>
          <td>Salida:</td>
          <td>$fecha_salida</td>
        </tr>
      </table>
    </div>

    <div style="padding: 0 30px 15px 30px;">
      <div style="background-color: #ffffff; border: 1px solid #f5eadd; padding: 22px;">
        <h3>🏡 Detalles: Cabaña $cabin_nombre</h3>
        <p style="color: #ff8B64;">$caracCabana</p>
        <p>$descCabana</p>
        <p><strong>Amenidades:</strong> $amenCabana</p>
      </div>
    </div>

    <div style="padding: 15px 30px 35px 30px;">
      <p><strong># Folio:</strong> $folioSimulado</p>
      <p><strong>Monto Total:</strong> $$montoFormateado MXN</p>
    </div>

  </div>
</div>
EOD;


// 1. Preparar textos dinámicos para el admin
$adminTitulo = $pagoExitoso ? '🚨 Nueva Reservación Registrada' : '⚠️ ALERTA: Intento de Reserva Fallida';
$adminColorFondo = $pagoExitoso ? '#5c2c16' : '#991b1b';
$adminIntro = $pagoExitoso
    ? 'Se ha recibido y procesado con éxito una nueva reserva a través de la plataforma web. Los fondos correspondientes ya han sido validados en PayPal.'
    : 'Se registró un intento de reserva en el sistema, pero el proceso de pago fue <strong>RECHAZADO o FALLIDO</strong> por el procesador bancario. No se han liberado fondos.';

$adminInstruccion = $pagoExitoso
    ? 'Por favor, actualice el estatus de preparación física y limpieza de la cabaña.'
    : '⚠️ Verifique con el cliente antes de apartar las fechas físicas en el calendario manual.';

// 2. Bloque Heredoc del Admin
$htmlAdmin = <<<EOD
<div style="background-color: #fcfaf7; padding: 30px 15px; color: #4a3e3d;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #f3e9dc;">

    <div style="background-color: $adminColorFondo; padding: 30px; text-align: center;">
      <span style="background-color: #ba4a23; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Notificación de Sistema</span>
      <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px; font-weight: 700;">$adminTitulo</h1>
    </div>

    <div style="padding: 30px 30px 15px 30px;">
      <p style="margin: 0; color: #6b5b55; line-height: 1.6; font-size: 15px;">$adminIntro</p>
    </div>

    <div style="padding: 0 30px 15px 30px;">
      <h3 style="color: #ff8B64; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #f5eadd; padding-bottom: 5px;">Datos del Huésped</h3>
      <table style="width: 100%; font-size: 14px;">
        <tr><td style="color: #8e7a74; width: 35%;">Nombre:</td><td style="font-weight: 600;">$nombre</td></tr>
        <tr><td style="color: #8e7a74;">Correo:</td><td style="font-weight: 600;">$email</td></tr>
        <tr><td style="color: #8e7a74;">Teléfono:</td><td style="font-weight: 600;">$telefono</td></tr>
        <tr><td style="color: #8e7a74;">Fecha Pago:</td><td style="font-weight: 600;">$fechaRecibo</td></tr>
      </table>
    </div>

    <div style="padding: 0 30px 30px 30px;">
      <h3 style="color: #ff8B64; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #f5eadd; padding-bottom: 5px;">Detalles del Hospedaje</h3>
      <div style="background-color: #fdfbf9; border: 1px solid #f5eadd; border-radius: 12px; padding: 20px;">
        <table style="width: 100%; font-size: 14px; line-height: 1.8;">
          <tr><td>Cabaña:</td><td style="text-align: right; font-weight: bold;">$cabin_nombre</td></tr>
          <tr><td>Check-In:</td><td style="text-align: right;">$fecha_llegada</td></tr>
          <tr><td>Check-Out:</td><td style="text-align: right;">$fecha_salida</td></tr>
          <tr><td>Noches:</td><td style="text-align: right;">$noches</td></tr>
          <tr><td>Estatus:</td><td style="text-align: right; background-color: $badgeColor; color: $badgeTextoColor; border-radius: 30px; padding: 0 10px;">$badgeTexto</td></tr>
          <tr><td style="padding-top: 10px; font-weight: bold;">Monto Total:</td><td style="padding-top: 10px; text-align: right; font-weight: 800; font-size: 16px;">$$montoFormateado MXN</td></tr>
        </table>
      </div>
    </div>

    <div style="background-color: #fdfbf9; padding: 20px; text-align: center; border-top: 1px solid #f5eadd; font-size: 11px; color: #8e7a74;">
      <p style="margin: 0;">$adminInstruccion</p>
    </div>
  </div>
</div>
EOD;




function enviarCorreo($dest, $asunto, $html) {
    if (empty($html)) {
        error_log("Error: El contenido del correo (HTML) está vacío para $dest");
        return false;
    }
    $mail = new PHPMailer(true);
    // try {
    //     $mail->isSMTP();
    //     $mail->Host = 'mail.floresdelaluna.mx';
    //     $mail->SMTPDebug = 0;
    //     $mail->Debugoutput = 'html';
    //     $mail->SMTPAuth = true;
    //     $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    //     $mail->Port = 465;
    //     $mail->IsHTML(true);
    //     $mail->Username = 'reservas@floresdelaluna.mx';
    //     $mail->Password = 'FloresLuna1+';
    //     $mail->setFrom('reservas@floresdelaluna.mx', 'Reservaciones Flores de la Luna');
    //     $mail->Subject = $asunto;
    //     $mail->Body = $html;
    //     $mail->addAddress($dest);
    //     $mail->CharSet = 'UTF-8';
    //     return $mail->send();
    // } catch (Exception $e) {
    //     throw new Exception($mail->ErrorInfo);
    //  }

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
        error_log("Error al enviar con isMail: " . $mail->ErrorInfo);
        throw new Exception($mail->ErrorInfo);
     }
}

try{
//ENVIAR CLIENTE
$c = enviarCorreo($email, 'Confirmación de Reserva', $htmlCliente);
//ENVIAR ADMINISTRADOR
$a = enviarCorreo('cabanasfloresdeluna@gmail.com', 'Nueva Reserva', $htmlAdmin);

responder(['success' => true, 'correosEnviados' => ($c && $a)]);
}
catch( Exception $e){
responder(['success' => false, 'error_smtp' => $e->getMessage()], 500);
}

?>
