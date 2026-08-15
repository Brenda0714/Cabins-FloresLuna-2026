<?php
// olvide-contraseña.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Manejo de peticiones preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
include 'config.php';


// Leer los datos que Angular envía en formato JSON
$data = json_decode(file_get_contents("php://input"), true);

$usuario = $data['usuario'] ?? null;
$nuevaPassword = $data['nuevaPassword'] ?? null;

if (empty($usuario) || empty($nuevaPassword)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Datos incompletos"]);
    exit();
}

// 1. Verificar si el usuario o correo existe
$stmtCheck = $conn->prepare("SELECT id FROM usuarios WHERE email = ? OR usuario = ?");
$stmtCheck->bind_param("ss", $usuario, $usuario);
$stmtCheck->execute();
$result = $stmtCheck->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "El usuario o correo no existe"]);
    $stmtCheck->close();
    $conn->close();
    exit();
}

$userRecord = $result->fetch_assoc();
$userId = $userRecord['id'];
$stmtCheck->close();

// 2. Encriptar la contraseña e ingresar el UPDATE
$passwordEncriptada = hash('sha256', $nuevaPassword);

$stmtUpdate = $conn->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
$stmtUpdate->bind_param("si", $passwordEncriptada, $userId);

if ($stmtUpdate->execute()) {
    echo json_encode(["status" => "success", "message" => "Contraseña actualizada exitosamente"]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Error al actualizar la contraseña"]);
}

$stmtUpdate->close();
$conn->close();
?>
