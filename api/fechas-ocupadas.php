<?php
// 1. Configuración de encabezados para permitir peticiones desde Angular
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

require_once 'config.php';

// 3. Recibir el parámetro de la URL
$cabin_nombre = $_GET['cabin'] ?? '';

if (empty($cabin_nombre)) {
    echo json_encode(["error" => "Nombre de cabaña requerido"]);
    exit;
}

// 4. PASO AUTOMÁTICO: Actualizar reservas vencidas
$updateQuery = "UPDATE reservas SET estado = 'completada' WHERE fecha_salida <= NOW() AND estado = 'confirmada'";
$conn->query($updateQuery);

// 5. Consulta de fechas ocupadas
$sql = "SELECT fecha_llegada, fecha_salida
        FROM reservas
        WHERE cabin_nombre = ? AND estado = 'confirmada'";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $cabin_nombre);
$stmt->execute();
$result = $stmt->get_result();

$reservas = [];
while ($row = $result->fetch_assoc()) {
    $reservas[] = $row;
}

// 6. Retornar el JSON
echo json_encode($reservas);

$stmt->close();
$conn->close();
?>
