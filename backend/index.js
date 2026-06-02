const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
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
// RUTA 1: Obtener todos los usuarios (Angular)
// ==========================================

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



// ==========================================
// RUTA 2: Login de usuarios
// ==========================================
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


// Encender el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`📡 Servidor de las cabañas corriendo en http://localhost:${PORT}`);
});
