<?php
//

// 1. Incluir la conexión a la base de datos
require_once 'config.php'; // Asegúrate de que este archivo defina $conn

// 2. Cabeceras CORS limpias (permitir cualquier origen o Angular)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Manejar la petición "preflight" OPTIONS de Angular
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Ocultar errores directos para evitar contaminar la respuesta JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

function responder($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Obtener los datos JSON recibidos
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    responder(['disponible' => false, 'error' => 'No se recibieron datos JSON válidos'], 400);
}


// Mapeo seguro de nombres de variables (soporta camelCase y snake_case desde Angular)
$cabin_nombre  = trim($data['cabin_nombre'] ?? $data['cabin'] ?? '');
$fecha_llegada = trim($data['fecha_llegada'] ?? $data['fechaLlegada'] ?? '');
$fecha_salida  = trim($data['fecha_salida'] ?? $data['fechaSalida'] ?? '');

if (empty($cabin_nombre) || empty($fecha_llegada) || empty($fecha_salida)) {
    responder([
        'disponible' => false,
        'mensaje' => 'Campos requeridos incompletos (cabaña, fecha de llegada o salida).'
    ], 400);
}

// Preparar la consulta SQL (usando sentencias preparadas para seguridad)
$query = "SELECT COUNT(*) AS total
          FROM reservas
          WHERE cabin_nombre = ?
            AND estado != 'cancelada'
            AND ? < fecha_salida
            AND ? > fecha_llegada";

$stmt = $conn->prepare($query);

if (!$stmt) {
    responder(['disponible' => false, 'error' => 'Error al preparar la consulta SQL: ' . $conn->error], 500);
}
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
