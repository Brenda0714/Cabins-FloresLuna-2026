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
  host: process.env.EMAIL_HOST, // mail.ethos.com.mx
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, // cabinsfloresdeluna@ethos.com.mx
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Evita bloqueos en entornos compartidos
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
      IFNULL(u.nombre_completo, 'Huésped Temporal') AS nombre_completo,
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
app.post('/api/reservas/enviar-confirmacion', (req, res) => {
  const { nombre, email, telefono, cabin_nombre, fecha_llegada, fecha_salida, noches, monto_total, folio_pago } = req.body;

  const queryUsuario = `
    INSERT INTO usuarios (nombre_completo, correo, telefono, contraseña, rol)
    VALUES (?, ?, ?, SHA2('GuestPass123!', 256), 'cliente')
    ON DUPLICATE KEY UPDATE telefono = VALUES(telefono), id = LAST_INSERT_ID(id)
  `;

  db.query(queryUsuario, [nombre, email, telefono], (err, userResult) => {
    if (err) {
      console.error('❌ Error al gestionar usuario:', err);
      return res.status(500).json({ success: false, error: 'Error al procesar el usuario.' });
    }

    const usuarioId = userResult.insertId;
    const precioUnitario = parseFloat(monto_total) / parseInt(noches);
    const folioReal = folio_pago && folio_pago !== 'N/A' ? folio_pago : 'FL-' + Math.floor(Math.random() * 90000 + 10000);

    const queryReserva = `
      INSERT INTO reservas (usuario_id, cabin_nombre, fecha_llegada, fecha_salida, noches, precio_unitario, monto_total, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'APROBADO')
    `;

    db.query(queryReserva, [usuarioId, cabin_nombre, fecha_llegada, fecha_salida, noches, precioUnitario, monto_total], (err, reservaResult) => {
      if (err) {
        console.error('❌ Error al insertar en reservas:', err);
        return res.status(500).json({ success: false, error: 'Error al registrar la reserva.' });
      }

      // Opcional: Insertar en tu tabla de pagos el folioReal aquí si lo requieres

      // Plantillas HTML de correos
      const htmlCliente = `<div style="font-family: sans-serif; padding: 20px;"><h1>Flores de la Luna</h1><p>Hola ${nombre}, tu reserva para <strong>${cabin_nombre}</strong> está lista.</p></div>`;
      const htmlAdmin = `<div style="font-family: sans-serif; padding: 20px;"><h2>🌲 Nueva Reserva</h2><p>Cabaña: ${cabin_nombre} - Cliente: ${nombre}</p></div>`;

      const mailCliente = transporter.sendMail({
        from: `"Flores de la Luna" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🌲 ¡Confirmación de tu Reserva!',
        html: htmlCliente
      });

      const mailAdmin = transporter.sendMail({
        from: `"Notificaciones Sistema" <${process.env.EMAIL_USER}>`,
        to: 'cabanasfloresdeluna@gmail.com',
        subject: `🚨 Nueva Reservación: Cabaña ${cabin_nombre}`,
        html: htmlAdmin
      });

      Promise.all([mailCliente, mailAdmin])
        .then(() => {
          res.json({ success: true, message: 'Reserva guardada y correos enviados con éxito.' });
        })
        .catch((mailErr) => {
          console.error('⚠️ Detalle con los correos:', mailErr);
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
