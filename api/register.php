<?php
//register.php
// 1. Cabeceras CORS unificadas (evita duplicar)
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// 2. Manejo de pre-vuelo para evitar ERR_FAILED
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'config.php';

// Leer los datos que Angular envía
$data = json_decode(file_get_contents("php://input"), true);

$nombre = $data['nombre_completo'] ?? '';
$correo = $data['correo'] ?? '';
$telefono = $data['telefono'] ?? '';
$contrasena = $data['contrasena'] ?? '';

// 1. Verificar si el correo ya existe
$checkQuery = "SELECT id FROM usuarios WHERE correo = ?";
$stmtCheck = $conn->prepare($checkQuery);
$stmtCheck->bind_param("s", $correo);
$stmtCheck->execute();
$resCheck = $stmtCheck->get_result();

if ($resCheck->num_rows > 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Este correo ya se encuentra registrado."]);
    exit;
}

// 2. Insertar nuevo usuario
// 🔐 Usamos SHA2(?, 256) igual que en tu lógica original
$insertQuery = "INSERT INTO usuarios (nombre_completo, correo, telefono, contraseña, rol) VALUES (?, ?, ?, SHA2(?, 256), 'cliente')";
$stmtInsert = $conn->prepare($insertQuery);
$stmtInsert->bind_param("ssss", $nombre, $correo, $telefono, $contrasena);

if ($stmtInsert->execute()) {
    http_response_code(201);
    echo json_encode(["success" => true, "message" => "¡Tu cuenta ha sido creada exitosamente!"]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "No se pudo guardar el usuario."]);
}

$stmtCheck->close();
$stmtInsert->close();
$conn->close();
?>
