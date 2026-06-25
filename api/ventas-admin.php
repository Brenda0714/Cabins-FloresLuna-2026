<?php
//ventas-admin.php

header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// 🟢 GET: Obtener ventas (Ruta 7)
if ($method === 'GET') {
    $query = "SELECT
                r.id,
                r.usuario_id,
                u.nombre_completo,
                r.cabin_nombre,
                DATE_FORMAT(r.fecha_llegada, '%Y-%m-%d') AS fecha_llegada,
                DATE_FORMAT(r.fecha_salida, '%Y-%m-%d') AS fecha_salida,
                r.noches,
                r.monto_total,
                r.estado,
                p.folio,
                p.metodo_pago,
                IFNULL(p.estado_pago, 'pendiente') AS estado_pago
              FROM pagos p
              LEFT JOIN reservas r ON p.reserva_id = r.id
              LEFT JOIN usuarios u ON r.usuario_id = u.id
              ORDER BY p.id DESC";

    $result = $conn->query($query);
    $ventas = [];
    while ($row = $result->fetch_assoc()) {
        $ventas[] = $row;
    }
    echo json_encode($ventas);
}

// 🟢 POST: Actualizar estado (Ruta 8 - Reemplaza PUT)
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $reservaId = isset($data['reservaId']) ? intval($data['reservaId']) : 0;
    $nuevoEstado = $data['nuevoEstado'] ?? '';

    if ($reservaId === 0 || empty($nuevoEstado)) {
        http_response_code(400);
        echo json_encode(["error" => "Datos insuficientes."]);
        exit;
    }

    // 1. Verificar si existe
    $stmtVerificar = $conn->prepare("SELECT id FROM reservas WHERE id = ?");
    $stmtVerificar->bind_param("i", $reservaId);
    $stmtVerificar->execute();
    $result = $stmtVerificar->get_result();

    if ($result->num_rows > 0) {
        // 2. Actualizar
        $stmtUpdate = $conn->prepare("UPDATE reservas SET estado = ? WHERE id = ?");
        $stmtUpdate->bind_param("si", $nuevoEstado, $reservaId);

        if ($stmtUpdate->execute()) {
            echo json_encode(["success" => true, "message" => "Estado actualizado correctamente."]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al actualizar."]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["error" => "La reserva especificada no existe."]);
    }
}
?>
