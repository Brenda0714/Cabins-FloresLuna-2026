<?php
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$idUsuario = isset($data['id']) ? intval($data['id']) : 0;

if ($idUsuario === 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de usuario requerido."]);
    exit;
}

$conn->begin_transaction();

try {
    // 1. Borrar pagos asociados a las reservaciones del usuario
    // Usamos un subquery: borra los pagos cuyo reserva_id pertenezca a este usuario
    $stmt1 = $conn->prepare("DELETE FROM pagos WHERE reserva_id IN (SELECT id FROM reservas WHERE usuario_id = ?)");
    $stmt1->bind_param("i", $idUsuario);
    $stmt1->execute();

    // 2. Borrar las reservaciones del usuario
    $stmt2 = $conn->prepare("DELETE FROM reservas WHERE usuario_id = ?");
    $stmt2->bind_param("i", $idUsuario);
    $stmt2->execute();

    // 3. Borrar al usuario
    $stmt3 = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
    $stmt3->bind_param("i", $idUsuario);
    $stmt3->execute();

    $conn->commit();
    echo json_encode(["success" => true, "message" => "Cuenta, historial y pagos eliminados correctamente."]);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error al eliminar la cuenta: " . $e->getMessage()]);
}

$conn->close();
?>
