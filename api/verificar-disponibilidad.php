<?php
// Incluye tu archivo de conexión a la base de datos
require_once 'config.php'; // Asegúrate de que este archivo defina $conn

// Establecer cabeceras para permitir peticiones desde Angular
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

// Obtener el cuerpo de la petición
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(['error' => 'No se recibieron datos']);
    exit;
}

$cabin_nombre = $data['cabin_nombre'];
$fecha_llegada = $data['fecha_llegada'];
$fecha_salida = $data['fecha_salida'];

// Preparar la consulta SQL (usando sentencias preparadas para seguridad)
$query = "SELECT COUNT(*) AS total
          FROM reservas
          WHERE cabin_nombre = ?
            AND estado != 'cancelada'
            AND ? < fecha_salida
            AND ? > fecha_llegada";

$stmt = $conn->prepare($query);
$stmt->bind_param("sss", $cabin_nombre, $fecha_llegada, $fecha_salida);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

// Determinar disponibilidad
$estaOcupado = $row['total'] > 0;

if ($estaOcupado) {
    echo json_encode(['disponible' => false, 'mensaje' => 'Cabaña ocupada en esas fechas.']);
} else {
    echo json_encode(['disponible' => true, 'mensaje' => 'Cabaña disponible.']);
}

$stmt->close();
$conn->close();
?>
