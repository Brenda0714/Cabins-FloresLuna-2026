<?php
//login.php
// Configuración de CORS
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");
// ESTO ES LO QUE ESTÁ FALTANDO Y ES CRÍTICO
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
include 'config.php';

// Leer los datos que Angular envía en formato JSON
$data = json_decode(file_get_contents("php://input"), true);

$correo = isset($data['correo']) ? trim($data['correo']) : '';
$contrasena = isset($data['contrasena']) ? trim($data['contrasena']) : '';

// 🔐 Usamos la misma lógica SHA2(?, 256) que tenías en Node.js
$query = "SELECT id, nombre_completo, correo, rol
          FROM usuarios
          WHERE correo = ? AND contraseña = SHA2(?, 256)";

$stmt = $conn->prepare($query);
$stmt->bind_param("ss", $correo, $contrasena);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    // Si no encuentra nada, loguea en la consola del navegador por qué
    // (Solo haz esto temporalmente para depurar)
    error_log("Intento de login fallido para: " . $correo);
}

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        "success" => true,
        "message" => "¡Login exitoso!",
        "user" => $row
    ]);
} else {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "El correo electrónico o la contraseña son incorrectos."
    ]);
}

$stmt->close();
$conn->close();
?>
