<?php
// Cancelar Reservacion.php

// Configuración de CORS
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'config.php';

// Leer el cuerpo de la petición (donde Angular envía el { id: ... })
$data = json_decode(file_get_contents("php://input"), true);
$idReserva = isset($data['id']) ? intval($data['id']) : 0;

if ($idReserva === 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "El ID de la reservación es requerido."]);
    exit;
}

// Query para actualizar el estado
$queryCancelar = "UPDATE reservas SET estado = 'cancelada' WHERE id = ?";
$stmt = $conn->prepare($queryCancelar);
$stmt->bind_param("i", $idReserva);

if ($stmt->execute()) {
    // Verificamos si realmente se actualizó alguna fila
    if ($stmt->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "Cancelada correctamente."]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "No se encontró la reservación o ya estaba cancelada."]);
    }
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error interno del servidor."]);
}

$stmt->close();
$conn->close();
?>
