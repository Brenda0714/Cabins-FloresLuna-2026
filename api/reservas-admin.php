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
<div style="background-color: #fcfaf7; padding: 30px 15px; color: #4a3e3d; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #f3e9dc;">

    <!-- Encabezado Naranja -->
    <div style="background-color: #ff8b64; padding: 25px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">Cabañas Flores de la Luna</h1>
      <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Resumen de tu Estancia</p>
    </div>

    <!-- Mensaje de Bienvenida -->
    <div style="padding: 30px 30px 15px 30px;">
      <h2 style="color: #5c2c16; font-size: 20px; margin-top: 0; font-weight: 700;">$pagoExitoso_titulo</h2>
      <p style="color: #6b5b55; margin: 0; font-size: 14px;">$mensajeIntroduccionHTML</p>
    </div>

    <!-- Tabla con Filas Alternadas -->
    <div style="padding: 0 30px 20px 30px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #f0e6df;">
        <tr style="background-color: #ffffff; border-bottom: 1px solid #f0e6df;">
          <td style="padding: 12px 15px; color: #5c2c16; font-weight: 600; width: 45%;">Cabaña:</td>
          <td style="padding: 12px 15px; text-align: right; font-weight: 700; color: #333333;">$cabin_nombre</td>
        </tr>
        <tr style="background-color: #faf6f2; border-bottom: 1px solid #f0e6df;">
          <td style="padding: 12px 15px; color: #5c2c16; font-weight: 600;">Fecha de Llegada:</td>
          <td style="padding: 12px 15px; text-align: right; color: #555555;">$fecha_llegada</td>
        </tr>
        <tr style="background-color: #ffffff; border-bottom: 1px solid #f0e6df;">
          <td style="padding: 12px 15px; color: #5c2c16; font-weight: 600;">Fecha de Salida:</td>
          <td style="padding: 12px 15px; text-align: right; color: #555555;">$fecha_salida</td>
        </tr>
        <tr style="background-color: #faf6f2;">
          <td style="padding: 12px 15px; color: #5c2c16; font-weight: 600;">Estancia:</td>
          <td style="padding: 12px 15px; text-align: right; font-weight: 700; color: #333333;">$noches noches</td>
        </tr>
      </table>
    </div>

    <!-- Bloque Cabaña y Amenidades -->
    <div style="padding: 0 30px 20px 30px;">
      <div style="background-color: #ffffff; border: 1px solid #f0e6df; border-radius: 12px; padding: 20px;">
        <h3 style="margin-top: 0; color: #5c2c16; font-size: 15px; font-weight: 700;">🏡 Detalles del hospedaje: Cabaña $cabin_nombre</h3>
        <p style="color: #ff8b64; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin: 6px 0 10px 0;">$caracCabana</p>
        <p style="font-size: 13px; color: #6b5b55; line-height: 1.5; margin-bottom: 15px;">$descCabana</p>

        <div style="background-color: #fcf9f6; border-radius: 8px; padding: 12px 15px; border: 1px dashed #f0e6df;">
          <p style="color: #ff8b64; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 5px 0;">SERVICIOS E INSTALACIONES INCLUIDAS:</p>
          <p style="font-size: 12px; color: #555555; margin: 0; line-height: 1.4;">$amenCabana</p>
        </div>
      </div>
    </div>

    <!-- Tarjeta de Pago Punteada (Transferencia Bancaria) -->
    <div style="padding: 0 30px 25px 30px;">
      <div style="border: 1.5px dashed #e0d5cb; border-radius: 12px; padding: 20px; background-color: #ffffff;">
        <div style="margin-bottom: 15px;">
          <span style="font-size: 14px; font-weight: bold; color: #5c2c16;">Transferencia Bancaria <span style="color: #8e7a74; font-weight: normal; font-size: 11px;">✓ COMPROBANTE DE RESERVA</span></span>
        </div>

        <table style="width: 100%; font-size: 13px; line-height: 2;">
          <tr>
            <td style="color: #8e7a74;"># Folio:</td>
            <td style="text-align: right; font-weight: 600; color: #333333;">$folioAdmin</td>
          </tr>
          <tr>
            <td style="color: #8e7a74;">Fecha de Registro:</td>
            <td style="text-align: right; color: #555555;">$fechaRecibo</td>
          </tr>
          <tr>
            <td style="color: #8e7a74;">Método de Pago:</td>
            <td style="text-align: right; font-weight: 600; color: #333333;">Transferencia / SPEI</td>
          </tr>
          <tr>
            <td style="color: #8e7a74;">Estado:</td>
            <td style="text-align: right;">
              <span style="background-color: $badgeColor; color: $badgeTextoColor; border-radius: 20px; padding: 3px 12px; font-size: 11px; font-weight: bold;">$badgeTexto</span>
            </td>
          </tr>
        </table>

        <div style="border-top: 1px dashed #e0d5cb; margin-top: 15px; padding-top: 15px;">
          <table style="width: 100%;">
            <tr>
              <td style="font-weight: bold; color: #5c2c16; font-size: 14px;">Monto Total:</td>
              <td style="text-align: right; font-weight: 800; color: #ff8b64; font-size: 22px;">$$montoFormateado MXN</td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <!-- Pie de página con Contacto -->
    <div style="padding: 0 30px 30px 30px; text-align: center; font-size: 12px; color: #8e7a74; line-height: 1.6;">
      <p style="margin: 0 0 5px 0;">Si tienes alguna duda sobre tu reservación, ponte en contacto con nosotros.</p>
      <p style="margin: 0;"><a href="mailto:katyasandoval@editraka.com" style="color: #0066cc; text-decoration: underline; font-weight: bold;">katyasandoval@editraka.com</a></p>
      <p style="margin: 3px 0 15px 0;">Tel. +52 (812) 2329 9930</p>
      <p style="color: #ff8b64; font-weight: bold; font-size: 14px; margin: 0;">¡Te esperamos pronto en Flores de la Luna!</p>
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
<div style="background-color: #fcfaf7; padding: 30px 15px; color: #4a3e3d; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #f3e9dc;">

    <!-- Header Marrón / Oscuro -->
    <div style="background-color: $adminColorFondo; padding: 30px 20px; text-align: center;">
      <span style="background-color: #ba4a23; color: #ffffff; padding: 4px 14px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">NOTIFICACIÓN DE SISTEMA</span>
      <h1 style="color: #ffffff; margin: 12px 0 0 0; font-size: 24px; font-weight: 700;">$adminTitulo</h1>
    </div>

    <!-- Introducción -->
    <div style="padding: 25px 30px 15px 30px;">
      <p style="margin: 0; color: #6b5b55; line-height: 1.6; font-size: 13px;">$adminIntro</p>
    </div>

    <!-- Secciones: Datos del Huésped -->
    <div style="padding: 0 30px 20px 30px;">
      <h3 style="color: #ff8b64; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0; border-bottom: 1px solid #f0e6df; padding-bottom: 6px;">DATOS DEL HUÉSPED</h3>
      <table style="width: 100%; font-size: 13px; border-collapse: collapse; line-height: 2;">
        <tr>
          <td style="color: #8e7a74; width: 40%;">Nombre completo:</td>
          <td style="font-weight: 700; color: #333333;">$cliente_nombre</td>
        </tr>
        <tr>
          <td style="color: #8e7a74;">Correo electrónico:</td>
          <td style="font-weight: 700;"><a href="mailto:$cliente_correo" style="color: #0066cc; text-decoration: underline;">$cliente_correo</a></td>
        </tr>
        <tr>
          <td style="color: #8e7a74;">Teléfono de contacto:</td>
          <td style="font-weight: 700; color: #333333;">$telefono</td>
        </tr>
        <tr>
          <td style="color: #8e7a74;">Fecha de Pago:</td>
          <td style="font-weight: 700; color: #333333;">$fechaRecibo</td>
        </tr>
      </table>
    </div>

    <!-- Secciones: Detalles del Hospedaje -->
    <div style="padding: 0 30px 25px 30px;">
      <h3 style="color: #ff8b64; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; border-bottom: 1px solid #f0e6df; padding-bottom: 6px;">DETALLES DEL HOSPEDAJE</h3>

      <div style="background-color: #faf6f2; border: 1px solid #f0e6df; border-radius: 12px; padding: 20px;">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse; line-height: 2;">
          <tr>
            <td style="color: #5c2c16; font-weight: 700;">Cabaña Solicitada:</td>
            <td style="text-align: right; font-weight: 700; color: #333333;">$cabin_nombre</td>
          </tr>
          <tr>
            <td style="color: #6b5b55;">Fecha de Check-In:</td>
            <td style="text-align: right; font-weight: 700; color: #333333;">$fecha_llegada</td>
          </tr>
          <tr>
            <td style="color: #6b5b55;">Fecha de Check-Out:</td>
            <td style="text-align: right; font-weight: 700; color: #333333;">$fecha_salida</td>
          </tr>
          <tr>
            <td style="color: #6b5b55;">Total de Noches:</td>
            <td style="text-align: right; font-weight: 700; color: #333333;">$noches noches</td>
          </tr>
        </table>

        <!-- Línea Punteada Separadora -->
        <div style="border-top: 1px dashed #e0d5cb; margin: 12px 0 15px 0;"></div>

        <table style="width: 100%; font-size: 13px; border-collapse: collapse; line-height: 2;">
          <tr>
            <td style="color: #6b5b55;">Estatus Financiero:</td>
            <td style="text-align: right;">
              <span style="background-color: $badgeColor; color: $badgeTextoColor; border-radius: 20px; padding: 3px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase;">$badgeTexto</span>
            </td>
          </tr>
          <tr>
            <td style="color: #6b5b55;"># Folio:</td>
            <td style="text-align: right; color: #555555;">$folioAdmin</td>
          </tr>
        </table>

        <table style="width: 100%; margin-top: 15px;">
          <tr>
            <td style="font-weight: 700; color: #5c2c16; font-size: 14px;">Monto de la Operación:</td>
            <td style="text-align: right; font-weight: 800; color: #2e7d32; font-size: 20px;">$$montoFormateado MXN</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Pie de Página -->
    <div style="padding: 20px 30px; text-align: center; border-top: 1px solid #f5eadd; font-size: 11px; color: #8e7a74; line-height: 1.5; background-color: #ffffff;">
      <p style="margin: 0;">Este es un mensaje generado automáticamente por el servidor de Flores de la Luna.</p>
      <p style="margin: 3px 0 15px 0;">$adminInstruccion</p>
      <p style="margin: 0; color: #ff8b64; font-weight: 700;">floresdelaluna.mx</p>
      <p style="margin: 2px 0 0 0; font-size: 10px; color: #a3958f;">© 2026 FLORES DE LA LUNA — CABAÑAS & JARDÍN</p>
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
