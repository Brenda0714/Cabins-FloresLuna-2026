<?php
//mis-compras.php

// Cabeceras CORS
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Manejo de pre-vuelo
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'config.php';

// Obtener el ID del usuario desde la URL (?usuarioId=1)
$usuarioId = isset($_GET['usuarioId']) ? intval($_GET['usuarioId']) : 0;

if ($usuarioId === 0) {
    http_response_code(400);
    echo json_encode(["error" => "ID de usuario inválido."]);
    exit;
}

// Query SQL (idéntica a la de Node.js)
$query = "SELECT
            r.id,
            r.cabin_nombre,
            DATE_FORMAT(r.fecha_llegada, '%Y-%m-%d') AS fecha_llegada,
            DATE_FORMAT(r.fecha_salida, '%Y-%m-%d') AS fecha_salida,
            r.noches,
            r.monto_total,
            r.estado,
            p.referencia_pago,
            p.metodo_pago,
            p.folio,
            p.estado_pago
          FROM reservas r
          LEFT JOIN pagos p ON r.id = p.reserva_id
          WHERE r.usuario_id = ?
          ORDER BY r.fecha_llegada ASC";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $usuarioId);
$stmt->execute();
$result = $stmt->get_result();

$compras = [];
while ($row = $result->fetch_assoc()) {
    $compras[] = $row;
}

echo json_encode($compras);

$stmt->close();
$conn->close();
?>
