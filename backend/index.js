const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const app = express();

app.use(cors());
app.use(express.json());

const bcrypt = require('bcrypt');

// 1. Cambiamos 'createConnection' por 'createPool' para que maneje reconexiones automáticas
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 2. Probamos el Pool haciendo una consulta rápida de verificación
db.query('SELECT 1', (err, rows) => {
  if (err) {
    console.error('❌ Error inicial conectando a HostGator:', err.message);
  } else {
    console.log('🚀 Pool de conexiones activado con éxito en HostGator');
  }
});

// ==========================================
// RUTA: PARA CORREOS
// ==========================================

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // Leerá 'smtp.gmail.com'
  port: parseInt(process.env.EMAIL_PORT || '465'), // Leerá 465
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, // Tu correo de Gmail del archivo .env
    pass: process.env.EMAIL_PASS  // 🚨 Las 16 letras de la contraseña de aplicación
  }
});

// Verificación automática al encender el servidor para asegurar que Gmail te dio acceso
transporter.verify((error, success) => {
  if (error) {
    console.error('Error de autenticación con Gmail:', error.message);
  } else {
    console.log('¡Nodemailer conectado con éxito a Gmail! Listo para despachar correos.');
  }
});

// ==============================================================================================================================
// RUTA 1: Obtener todos los usuarios (Angular)
// ==============================================================================================================================

// RUTA: Obtener todos los usuarios para mostrarlos en Angular
app.get('/api/usuarios', (req, res) => {
  const query = 'SELECT id, nombre_completo, correo, telefono, rol, fecha_registro FROM usuarios';

  // El pool automáticamente abre, usa y cierra la conexión por ti en cada clic
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al consultar usuarios:', err);
      return res.status(500).json({ error: 'Error al consultar usuarios' });
    }
    res.json(results);
  });
});



// ==============================================================================================================================
// RUTA 2: Login de usuarios
// ==============================================================================================================================
app.post('/api/usuarios', (req, res) => {
  const correo = req.body.correo ? req.body.correo.trim() : '';
  const contrasena = req.body.contrasena ? req.body.contrasena.trim() : '';

  console.log("➡️ Intento de login encriptado en SQL para:", correo);

  // 🔐 Aplicamos SHA2(?, 256) directamente en la consulta de MySQL
  const query = 'SELECT id, nombre_completo, correo, rol FROM usuarios WHERE correo = ? AND contraseña = SHA2(?, 256)';

  db.query(query, [correo, contrasena], (err, results) => {
    if (err) {
      console.error('❌ Error en la consulta de login:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    console.log("🔍 Resultados encontrados en HostGator:", results.length);

    if (results.length > 0) {
      res.json({
        success: true,
        message: '¡Login exitoso!',
        user: results[0]
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'El correo electrónico o la contraseña son incorrectos.'
      });
    }
  });
});

// ==========================================
// ✨ NUEVA RUTA 3: Registrar nuevo usuario con Bcrypt
// ==========================================
app.post('/api/usuarios/register', (req, res) => {
  const { nombre_completo, correo, telefono, contrasena } = req.body;

  // 1. Primero verificamos si el correo ya existe en tu tabla de usuarios
  const checkEmailQuery = 'SELECT id FROM usuarios WHERE correo = ?';

  db.query(checkEmailQuery, [correo], (err, results) => {
    if (err) {
      console.error('❌ Error al verificar correo:', err);
      return res.status(500).json({ success: false, message: 'Error interno en el servidor.' });
    }

    if (results.length > 0) {
      return res.status(400).json({ success: false, message: 'Este correo ya se encuentra registrado.' });
    }

    const insertQuery = `
      INSERT INTO usuarios (nombre_completo, correo, telefono, contraseña, rol)
      VALUES (?, ?, ?, SHA2(?, 256), 'cliente')
    `;

    db.query(insertQuery, [nombre_completo, correo, telefono, contrasena], (err, result) => {
      if (err) {
        console.error('❌ Error al insertar en la BD con SHA2:', contrasena);
        return res.status(500).json({ success: false, message: 'No se pudo guardar el usuario.' });
      }

      return res.status(201).json({
        success: true,
        message: '¡Tu cuenta ha sido creada exitosamente!'
      });
    });
  });
});





// ==============================================================================================================================
// 📋 RUTA 4: Ver todas las reservas (GET)
// ==============================================================================================================================
app.get('/api/reservas', (req, res) => {
  // Cambiado a LEFT JOIN por si no hay usuarios asignados correctamente, para que no falle
  const query = `
    SELECT
      r.id,
      u.nombre_completo,
      u.correo,
      r.cabin_nombre,
      r.fecha_llegada,
      r.fecha_salida,
      r.noches,
      r.precio_unitario,
      r.monto_total,
      r.estado,
      r.fecha_creacion
    FROM reservas r
    LEFT JOIN usuarios u ON r.usuario_id = u.id
    ORDER BY r.fecha_creacion DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error en MySQL:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    // Devolvemos la respuesta al navegador de forma segura
    res.json(results);
  });
});


// ==========================================
// 🌲 RUTA 5: Crear Reservación (POST)
// ==========================================
app.post('/api/reservas', (req, res) => {
  const { nombre, email, telefono, cabin_nombre, fecha_llegada, fecha_salida, noches, monto_total } = req.body;

  // Diccionario basado en tus Signals de Angular
  const infoCabanas = {
    "Orquídea": {
      descripcion: "Hermosa cabaña ideal para parejas. Un espacio íntimo y acogedor diseñado para el descanso y la reconexión en la naturaleza.",
      caracteristicas: "👥 2 Personas | 🛏️ 1 Recámara | 🚿 1 Baño | 🍳 Sala y Cocina",
      amenidades: "• Cama King Size • Smart TV • Internet • WIFI • Hermoso Mirador"
    },
    "Girasol": {
      descripcion: "Espaciosa cabaña familiar diseñada para crear recuerdos inolvidables con los tuyos, rodeados de paisajes boscoscos únicos.",
      caracteristicas: "👥 6 Personas | 🛏️ 2 Recámaras | 🚿 1 Baño | 🍳 Sala y Cocina",
      amenidades: "• Cama King Size • 4 Camas Individuales • Smart TV • Internet • WIFI • Mirador"
    },
    "Tulipán": {
      descripcion: "Estancia familiar con un diseño alpino espectacular. El balance perfecto entre confort hogareño y la magia del bosque.",
      caracteristicas: "👥 6 Personas | 🛏️ 2 Recámaras | 🚿 1 Baño | 🍳 Sala y Cocina",
      amenidades: "• Cama King Size • 4 Camas Individuales • Smart TV • Internet • WIFI • Mirador"
    },
    "Cabaña Grande": {
      descripcion: "Nuestra cabaña de máxima capacidad. Perfecta para reuniones familiares grandes o grupos que buscan vivir la experiencia de montaña al máximo.",
      caracteristicas: "👥 10-12 Personas | 🛏️ 2 Recámaras | 🚿 1 Baño | 🍳 Sala y Cocina",
      amenidades: "• 2 Camas King Size • 4 Camas Individuales • Smart TV • Internet • WIFI • Mirador"
    }
  };

  const datosExtraCabana = infoCabanas[cabin_nombre] || {
    descripcion: "Disfruta de una maravillosa estancia en Flores de la Luna rodeado de naturaleza.",
    caracteristicas: "👥 Capacidad Estándar | 🌲 Vista al Bosque",
    amenidades: "• Todos los servicios esenciales incluidos"
  };

  const queryBuscarUsuario = 'SELECT id FROM usuarios WHERE correo = ?';

  db.query(queryBuscarUsuario, [email], (err, userResults) => {
    if (err) {
      console.error('❌ Error al buscar usuario:', err);
      return res.status(500).json({ success: false, error: 'Error interno al verificar el usuario.' });
    }

    if (userResults.length === 0) {
      return res.status(401).json({
        success: false,
        requireAuth: true,
        message: 'Para realizar una reservación, primero debes iniciar sesión o crear una cuenta.'
      });
    }

    const usuarioId = userResults[0].id;
    const precioUnitario = parseFloat(monto_total) / parseInt(noches);

    // Dejamos el estado inicial en 'pendiente' o 'confirmada' según tu flujo
    const queryReserva = `
      INSERT INTO reservas (usuario_id, cabin_nombre, fecha_llegada, fecha_salida, noches, precio_unitario, monto_total, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmada')
    `;

    db.query(queryReserva, [usuarioId, cabin_nombre, fecha_llegada, fecha_salida, noches, precioUnitario, monto_total], (err, reservaResult) => {
      if (err) {
        console.error('❌ Error al insertar en reservas:', err);
        return res.status(500).json({ success: false, error: 'Error al registrar la reserva.' });
      }

      const idDeLaReservaCreada = reservaResult.insertId;
      const folioSimulado = 'FL-' + Math.floor(Math.random() * 900000 + 100000);

      // Cambiado a LET para evitar el error de asignación constante
      const pagoExitoso = Math.random() > 0.10;
      let estadoPagoDB = 'completado';
      let referenciaPayPalSimulada = 'PAYID-' + Math.random().toString(36).substring(2, 17).toUpperCase();
      let badgeColor = '#e8f5e9';
      let badgeTextoColor = '#2e7d32';
      let badgeTexto = 'Completado';

      if (!pagoExitoso) {
        estadoPagoDB = 'fallido';
        referenciaPayPalSimulada = 'N/A (Transacción派Rechazada)';
        badgeColor = '#ffebee';
        badgeTextoColor = '#c62828';
        badgeTexto = 'Rechazado / Fallido';
      }

      // Variable agregada para la fecha visible en el recibo del correo
      const fechaRecibo = new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' });

      // Corregida Query de pagos: Insertamos estadoPagoDB dinámicamente y agregamos fecha_pago NOW()
      const queryPago = `
        INSERT INTO pagos (reserva_id, folio, monto, metodo_pago, estado_pago, referencia_pago, fecha_pago)
        VALUES (?, ?, ?, 'PayPal', ?, ?, NOW())
      `;

      db.query(queryPago, [idDeLaReservaCreada, folioSimulado, monto_total, estadoPagoDB, referenciaPayPalSimulada], (pagoErr, pagoResult) => {
        if (pagoErr) {
          console.error('❌ Error al insertar en la tabla pagos:', pagoErr);
        } else {
          console.log(`💰 ¡Pago insertado con éxito! Folio: ${folioSimulado} | Estado: ${estadoPagoDB} | Reserva ID: ${idDeLaReservaCreada}`);
        }
        const montoLimpio = String(monto_total).replace(/[^0-9.]/g, '');
        const montoFormateado = Number(montoLimpio).toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

        // Variable corregida para evitar el ReferenceError de mensajeIntroduccion
        const mensajeIntroduccionHTML = pagoExitoso
          ? `Hola <strong>${nombre}</strong>, te enviamos la confirmación de tu pago y los detalles correspondientes a tu estancia.`
          : `Hola <strong>${nombre}</strong>, se generó un problema al procesar tu transacción de PayPal. Tu reserva se mantendrá congelada temporalmente, por favor contáctanos de inmediato.`;

        const htmlCliente = `
          <div style="background-color: #fcfaf7; padding: 30px 15px; color: #4a3e3d;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(139, 69, 19, 0.05); border: 1px solid #f3e9dc;">

              <div style="background-color: #ff8B64; padding: 35px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px;">Cabañas Flores de la Luna</h1>
                <p style="color: #fbeee6; margin: 6px 0 0 0; font-size: 14px; font-weight: 300;">Resumen de tu Estancia</p>
              </div>

              <div style="padding: 30px 30px 15px 30px;">
                <h2 style="color: #5c2c16; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">
                  ${pagoExitoso ? '¡Todo listo! Tu reservación está confirmada' : '⚠️ Atención: Pago Rechazado / Pendiente'}
                </h2>
                <p style="margin: 0; color: #6b5b55; line-height: 1.6; font-size: 15px;">
                  ${mensajeIntroduccionHTML}
                </p>
              </div>

              <div style="padding: 0 30px 15px 30px;">
                <table style="width: 100%; border-collapse: collapse; background-color: #fdfbf9; border-radius: 12px; border: 1px solid #f5eadd;">
                  <tr>
                    <td style="padding: 14px 18px; font-weight: 600; color: #5c2c16; border-bottom: 1px solid #f5eadd; font-size: 14px;">Cabaña:</td>
                    <td style="padding: 14px 18px; text-align: right; border-bottom: 1px solid #f5eadd; color: #2d2522; font-weight: 600; font-size: 15px;">${cabin_nombre}</td>
                  </tr>
                  <tr>
                    <td style="padding: 14px 18px; font-weight: 600; color: #5c2c16; border-bottom: 1px solid #f5eadd; font-size: 14px;">Fecha de Llegada:</td>
                    <td style="padding: 14px 18px; text-align: right; border-bottom: 1px solid #f5eadd; color: #4a3e3d; font-size: 14px;">${fecha_llegada}</td>
                  </tr>
                  <tr>
                    <td style="padding: 14px 18px; font-weight: 600; color: #5c2c16; border-bottom: 1px solid #f5eadd; font-size: 14px;">Fecha de Salida:</td>
                    <td style="padding: 14px 18px; text-align: right; border-bottom: 1px solid #f5eadd; color: #4a3e3d; font-size: 14px;">${fecha_salida}</td>
                  </tr>
                  <tr>
                    <td style="padding: 14px 18px; font-weight: 600; color: #5c2c16; font-size: 14px;">Estancia:</td>
                    <td style="padding: 14px 18px; text-align: right; color: #2d2522; font-weight: 600; font-size: 14px;">${noches} noches</td>
                  </tr>
                </table>
              </div>

              <div style="padding: 0 30px 15px 30px;">
                <div style="background-color: #ffffff; border: 1px solid #f5eadd; border-radius: 16px; padding: 22px; box-shadow: 0 4px 12px rgba(92, 44, 22, 0.02);">
                  <h3 style="margin: 0 0 4px 0; color: #5c2c16; font-size: 17px; font-weight: 700;">🏡 Detalles del hospedaje: Cabaña ${cabin_nombre}</h3>
                  <p style="margin: 0 0 12px 0; color: #ff8B64; font-size: 12px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">${datosExtraCabana.caracteristicas}</p>
                  <p style="margin: 0 0 16px 0; color: #6b5b55; font-size: 14px; line-height: 1.6;">${datosExtraCabana.descripcion}</p>
                  <div style="background-color: #fdfbf9; padding: 14px 18px; border-radius: 10px; border-left: 4px solid #ba4a23; border: 1px solid #fbf4eb;">
                    <span style="font-size: 11px; font-weight: 800; color: #ff8B64; display: block; margin-bottom: 6px; letter-spacing: 0.5px; text-transform: uppercase;">Servicios e Instalaciones Incluidas:</span>
                    <p style="margin: 0; color: #4a3e3d; font-size: 13px; line-height: 1.5; font-weight: 500;">${datosExtraCabana.amenidades}</p>
                  </div>
                </div>
              </div>

              <div style="padding: 15px 30px 35px 30px;">
                <div style="border: 2px dashed #d5c3b2; background-color: #fffdfb; border-radius: 14px; padding: 22px;">
                  <div style="margin-bottom: 18px; display: block;">
                    <span style="font-weight: 800; font-style: italic; color: #003087; font-size: 19px;">Pay<span style="color: #0079c1;">Pal</span></span>
                    <span style="font-size: 12px; color: #8e7a74; margin-left: 8px; font-weight: bold; letter-spacing: 0.5px;">✓ RECIBO DE PAGO</span>
                  </div>
                  <table style="width: 100%; font-size: 13px; color: #6b5b55; line-height: 1.9;">
                    <tr>
                      <td><strong>ID de Transacción:</strong></td>
                      <td style="text-align: right; font-size: 14px; color: #2d2522;">${referenciaPayPalSimulada}</td>
                    </tr>
                    <tr>
                      <td><strong>Fecha de Pago:</strong></td>
                      <td style="text-align: right; color: #2d2522;">${fechaRecibo}</td>
                    </tr>
                    <tr>
                      <td><strong>Estado:</strong></td>
                      <td style="text-align: right;">
                        <span style="background-color: ${badgeColor}; color: ${badgeTextoColor}; padding: 3px 10px; border-radius: 30px; font-size: 11px; font-weight: bold;">
                          ${badgeTexto}
                        </span>
                      </td>
                    </tr>
                    <tr><td colspan="2" style="padding-top: 15px; border-bottom: 1px dashed #ebdccb;"></td></tr>
                    <tr>
                      <td style="padding-top: 15px; color: #5c2c16; font-size: 15px; font-weight: bold;">Monto Total:</td>
                      <td style="padding-top: 15px; text-align: right; color: #ff8B64; font-size: 20px; font-weight: 800;">$${montoFormateado} MXN</td>
                    </tr>
                  </table>
                </div>
                <div style="background-color: #fdfbf9; padding: 25px; text-align: center; border-top: 1px solid #f5eadd; font-size: 12px; color: #8e7a74;">
                <p style="margin: 0 0 6px 0; font-size: 13px;">Si tienes alguna duda sobre tu reservación, ponte en contacto con nosotros.</p>
                <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold">Tel. +52 (812) 2329 9930</p>
                <p style="margin: 15px 0 6px 0; font-size: 14px; font-weight: bold; color: #ff8B64;">
                  ¡Te esperamos pronto en Flores de la Luna, ${nombre}!
                </p>
              </div>

              <div style="width: 100%; text-align: center; padding-top: 20px; background-color: #fcfaf7; margin-bottom: 5px;">
                <p style="color: #8e7a74; font-size: 11px; text-transform: uppercase; tracking: 2px; margin: 0;">
                  © 2026 Flores de la Luna — Cabañas & Jardín
                </p>
              </div>
              </div>



            </div>
          </div>
        `;

        const htmlAdmin = `
          <div style="background-color: #fcfaf7; padding: 30px 15px; color: #4a3e3d;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #f3e9dc;">
              <div style="background-color: ${pagoExitoso ? '#5c2c16' : '#991b1b'}; padding: 30px; text-align: center;">
                <span style="background-color: #ba4a23; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Notificación de Sistema</span>
                <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px; font-weight: 700;">
                  ${pagoExitoso ? '🚨 Nueva Reservación Registrada' : '⚠️ ALERTA: Intento de Reserva Fallida'}
                </h1>
              </div>
              <div style="padding: 30px 30px 15px 30px;">
                <p style="margin: 0; color: #6b5b55; line-height: 1.6; font-size: 15px;">
                  ${pagoExitoso
            ? 'Se ha recibido y procesado con éxito una nueva reserva a través de la plataforma web. Los fondos correspondientes ya han sido validados en PayPal.'
            : 'Se registró un intento de reserva en el sistema, pero el proceso de pago fue <strong>RECHAZADO o FALLIDO</strong> por el procesador bancario. No se han liberado fondos.'}
                </p>
              </div>
              <div style="padding: 0 30px 15px 30px;">
                <h3 style="color: #ff8B64; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0; border-bottom: 1px solid #f5eadd; padding-bottom: 5px;">Datos del Huésped</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 8px 0; color: #8e7a74; width: 35%;">Nombre completo:</td><td style="padding: 8px 0; color: #2d2522; font-weight: 600;">${nombre}</td></tr>
                  <tr><td style="padding: 8px 0; color: #8e7a74;">Correo electrónico:</td><td style="padding: 8px 0; color: #ba4a23; font-weight: 600; font-style: italic;">${email}</td></tr>
                  <tr><td style="padding: 8px 0; color: #8e7a74;">Teléfono de contacto:</td><td style="padding: 8px 0; color: #2d2522; font-weight: 600;">${telefono || 'No proporcionado'}</td></tr>
                </table>
              </div>
              <div style="padding: 0 30px 30px 30px;">
                <h3 style="color: #ff8B64; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0; border-bottom: 1px solid #f5eadd; padding-bottom: 5px;">Detalles del Hospedaje</h3>
                <div style="background-color: #fdfbf9; border: 1px solid #f5eadd; border-radius: 12px; padding: 20px; margin-top: 10px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.8;">
                    <tr><td style="font-weight: 600; color: #5c2c16;">Cabaña Solicitada:</td><td style="text-align: right; color: #2d2522; font-weight: bold; font-size: 15px;">${cabin_nombre}</td></tr>
                    <tr><td style="color: #6b5b55;">Fecha de Check-In:</td><td style="text-align: right; color: #2d2522; font-weight: 600;">${fecha_llegada}</td></tr>
                    <tr><td style="color: #6b5b55;">Fecha de Check-Out:</td><td style="text-align: right; color: #2d2522; font-weight: 600;">${fecha_salida}</td></tr>
                    <tr><td style="color: #6b5b55; padding-bottom: 10px; border-bottom: 1px dashed #ebdccb;">Total de Noches:</td><td style="text-align: right; color: #2d2522; font-weight: 600; padding-bottom: 10px; border-bottom: 1px dashed #ebdccb;">${noches} noches</td></tr>
                    <tr><td style="padding-top: 10px; color: #6b5b55;">Estatus Financiero:</td><td style="padding-top: 10px; text-align: right;"><span style="background-color: ${badgeColor}; color: ${badgeTextoColor}; padding: 3px 12px; border-radius: 30px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${badgeTexto}</span></td></tr>
                    <tr><td style="color: #8e7a74; font-size: 12px;">ID de Transacción:</td><td style="text-align: right; font-size: 12px; color: #4a3e3d;">${referenciaPayPalSimulada}</td></tr>
                    <tr><td style="padding-top: 12px; font-weight: bold; color: #5c2c16; font-size: 15px;">Monto de la Operación:</td><td style="padding-top: 12px; text-align: right; color: ${pagoExitoso ? '#2e7d32' : '#c62828'}; font-weight: 800; font-size: 18px;">$${montoFormateado} MXN</td></tr>
                  </table>
                </div>
              </div>
              <div style="padding: 0 30px 35px 30px; text-align: center;">
                <a href="http://localhost:4200/admin/dashboard" style="display: inline-block; background-color: #ff8B64; color: #ffffff; padding: 12px 25px; border-radius: 10px; font-weight: bold; text-decoration: none; font-size: 14px; box-shadow: 0 4px 10px rgba(186, 74, 35, 0.25);">Ir al Panel de Control</a>
              </div>
              <div style="background-color: #fdfbf9; padding: 20px; text-align: center; border-top: 1px solid #f5eadd; font-size: 11px; color: #8e7a74;">
                <p style="margin: 0;">Este es un mensaje generado automáticamente por el servidor de Flores de la Luna.</p>
                <p style="margin: 3px 0 0 0;">${pagoExitoso ? 'Por favor, actualice el estatus de preparación física y limpieza de la cabaña.' : '⚠️ Verifique con el cliente antes de apartar las fechas físicas en el calendario manual.'}</p>
              </div>
            </div>
          </div>
        `;

        const mailCliente = transporter.sendMail({
          from: `"Cabañas Flores de la Luna" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: pagoExitoso ? '🌲 ¡Confirmación de tu Reserva!' : '⚠️ Problema con tu Pago de Reserva',
          html: htmlCliente
        });

        const mailAdmin = transporter.sendMail({
          from: `"Reservaciones Cabañas" <${process.env.EMAIL_USER}>`,
          to: 'cabanasfloresdeluna@gmail.com',
          subject: pagoExitoso ? `🚨 Nueva Reservación: Cabaña ${cabin_nombre}` : `🚨 INTENTO FALLIDO - Cabaña ${cabin_nombre}`,
          html: htmlAdmin
        });

        Promise.all([mailCliente, mailAdmin])
          .then(() => {
            if (pagoExitoso) {
              return res.json({ success: true, pagoAprobado: true, message: 'Reserva y pago guardados; correos enviados.' });
            } else {
              return res.status(402).json({ success: false, pagoAprobado: false, message: 'La reserva se guardó, pero el pago falló.' });
            }
          })
          .catch((mailErr) => {
            console.error('Detalle con los correos:', mailErr);
            res.json({ success: true, message: 'Base de datos actualizada, pero el envío SMTP falló.' });
          });
      });
    });
  });
});




// ==============================================================================================================================
// 📋 RUTA 6: Ver todos los pagos (GET)
// ==============================================================================================================================
app.get('/api/pagos', (req, res) => {
  // Cambiado a LEFT JOIN por si no hay usuarios asignados correctamente, para que no falle
  const query = `
    SELECT
      r.id,
      u.nombre_completo,
      u.correo,
      r.cabin_nombre,
      r.fecha_llegada,
      r.fecha_salida,
      r.noches,
      r.precio_unitario,
      r.monto_total,
      r.estado,
      r.fecha_creacion
    FROM reservas r
    LEFT JOIN usuarios u ON r.usuario_id = u.id
    ORDER BY r.fecha_creacion DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error en MySQL:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    // Devolvemos la respuesta al navegador de forma segura
    res.json(results);
  });
});

// ==========================================
// 🌲 RUTA 7: Crear Pago PAYPAL (POST)
// ==========================================
app.post('/api/reservas', (req, res) => {
  const { nombre, email, telefono, cabin_nombre, fecha_llegada, fecha_salida, noches, monto_total } = req.body;

  const queryBuscarUsuario = 'SELECT id FROM usuarios WHERE correo = ?';

  db.query(queryBuscarUsuario, [email], (err, userResults) => {
    if (err) {
      console.error('❌ Error al buscar usuario:', err);
      return res.status(500).json({ success: false, error: 'Error interno al verificar el usuario.' });
    }

    // 🚨 Si no se encuentra ningún usuario con ese correo, bloqueamos la reserva
    if (userResults.length === 0) {
      return res.status(401).json({
        success: false,
        requireAuth: true,
        message: 'Para realizar una reservación, primero debes iniciar sesión o crear una cuenta.'
      });
    }

    // Si el usuario existe, tomamos su ID real directamente de la base de datos
    const usuarioId = userResults[0].id;
    const precioUnitario = parseFloat(monto_total) / parseInt(noches);
    const queryReserva = `
      INSERT INTO reservas (usuario_id, cabin_nombre, fecha_llegada, fecha_salida, noches, precio_unitario, monto_total, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmada')
    `;

    db.query(queryReserva, [usuarioId, cabin_nombre, fecha_llegada, fecha_salida, noches, precioUnitario, monto_total], (err, reservaResult) => {
      if (err) {
        console.error('❌ Error al insertar en reservas:', err);
        return res.status(500).json({ success: false, error: 'Error al registrar la reserva.' });
      }



      Promise.all([mailCliente, mailAdmin])
        .then(() => {
          res.json({ success: true, message: 'Reserva guardada y correos enviados con éxito.' });
        })
        .catch((mailErr) => {
          console.error('Detalle con los correos:', mailErr);
          res.json({ success: true, message: 'Reserva guardada, pero los correos fallaron.' });
        });
    });
  });
});

// Encender el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`📡 Servidor de las cabañas corriendo en http://localhost:${PORT}`);
});
