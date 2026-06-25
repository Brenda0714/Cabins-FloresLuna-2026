<?php
//reservas.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'config.php';

// Consulta SQL con el LEFT JOIN para obtener los datos de la reserva y del usuario
$query = "SELECT
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
          ORDER BY r.fecha_creacion DESC";

$resultado = $conn->query($query);

if ($resultado) {
    $reservas = $resultado->fetch_all(MYSQLI_ASSOC);
    echo json_encode($reservas);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error al obtener reservas: " . $conn->error]);
}

$conn->close();
?>
