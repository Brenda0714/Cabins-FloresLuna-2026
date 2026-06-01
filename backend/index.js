const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

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

// Encender el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`📡 Servidor de las cabañas corriendo en http://localhost:${PORT}`);
});
