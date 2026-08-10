<?php
//ventas-admin.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

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
                p.monto1,
                DATE_FORMAT(p.fecha_pago1, '%Y-%m-%d') AS fecha_pago1,
                p.monto2,
                DATE_FORMAT(p.fecha_pago2, '%Y-%m-%d') AS fecha_pago2,
                p.monto AS monto_total,
                IFNULL(p.estado_pago, r.estado) AS estado,
                r.estado,
                p.folio,
                DATE_FORMAT(IFNULL(p.fecha_pago, r.fecha_creacion), '%d-%m-%Y') AS fecha_pago,
                IFNULL(p.metodo_pago, 'transferencia') AS metodo_pago,
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

    if ($reservaId === 0) {
        http_response_code(400);
        echo json_encode(["error" => "Datos insuficientes."]);
        exit;
    }

// 1. Caso: Actualización desde el Select (Estado general manual)
    if (isset($data['nuevoEstado']) && !empty($data['nuevoEstado'])) {
        $nuevoEstado = $conn->real_escape_string($data['nuevoEstado']);

        $conn->query("UPDATE reservas SET estado = '$nuevoEstado' WHERE id = $reservaId");
        $conn->query("UPDATE pagos SET estado_pago = '$nuevoEstado' WHERE reserva_id = $reservaId");

        echo json_encode(["success" => true, "message" => "Estado actualizado manual."]);
        exit;
    }

// 2. Caso: Guardar Montos (monto1 y/o monto2)
    if (array_key_exists('monto1', $data) || array_key_exists('monto2', $data)) {
        $monto1 = (isset($data['monto1']) && $data['monto1'] !== '' && $data['monto1'] !== null) ? floatval($data['monto1']) : null;
        $monto2 = (isset($data['monto2']) && $data['monto2'] !== '' && $data['monto2'] !== null) ? floatval($data['monto2']) : null;

        // Consultar el monto_total original almacenado en la tabla pagos
        $resTotal = $conn->query("SELECT monto FROM pagos WHERE reserva_id = $reservaId OR id = $reservaId");
        $pagoRow = $resTotal ? $resTotal->fetch_assoc() : null;
        $montoTotal = floatval($pagoRow['monto'] ?? 0);

        $valM1 = $monto1 ?? 0;
        $valM2 = $monto2 ?? 0;
        $sumaAbonos = $valM1 + $valM2;

        // Recalcular estado automáticamente según los abonos vs el costo total
        $nuevoEstado = ($montoTotal > 0 && $sumaAbonos >= $montoTotal) ? 'confirmada' : 'pendiente';

        $sqlM1 = is_null($monto1) ? "NULL" : $monto1;
        $sqlM2 = is_null($monto2) ? "NULL" : $monto2;

        // Actualizar la tabla 'pagos'
        $queryPagos = "UPDATE pagos SET
            monto1 = $sqlM1,
            fecha_pago1 = IF($sqlM1 IS NULL, NULL, IFNULL(fecha_pago1, NOW())),
            monto2 = $sqlM2,
            fecha_pago2 = IF($sqlM2 IS NULL, NULL, IFNULL(fecha_pago2, NOW())),
            estado_pago = '$nuevoEstado'
            WHERE reserva_id = $reservaId";

        if (!$conn->query($queryPagos)) {
            http_response_code(500);
            echo json_encode(["error" => "Error SQL en tabla pagos: " . $conn->error]);
            exit;
        }

        // 💡 Sincronización Doble en la tabla 'reservas' (Por ID directo y por reserva_id)
        $conn->query("UPDATE reservas SET estado = '$nuevoEstado' WHERE id = $reservaId");

        // Consultar fechas actualizadas
        $resFechas = $conn->query("SELECT DATE_FORMAT(fecha_pago1, '%Y-%m-%d') as fecha_pago1, DATE_FORMAT(fecha_pago2, '%Y-%m-%d') as fecha_pago2 FROM pagos WHERE reserva_id = $reservaId");
        $fechasBD = $resFechas ? $resFechas->fetch_assoc() : [];

        echo json_encode([
            "success" => true,
            "nuevoEstado" => $nuevoEstado,
            "fecha_pago1" => $fechasBD['fecha_pago1'] ?? null,
            "fecha_pago2" => $fechasBD['fecha_pago2'] ?? null,
            "message" => "Base de datos y estado de reserva actualizados con éxito."
        ]);
        exit;
    }




}
?>
