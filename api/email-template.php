<?php
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

?>
