<?php
//perfil.php

header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit();

include 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// 🟢 GET: Traer perfil
if ($method === 'GET') {
    $idUsuario = isset($_GET['usuarioId']) ? intval($_GET['usuarioId']) : 0;

    $query = "SELECT nombre_completo, correo, telefono FROM usuarios WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $idUsuario);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        echo json_encode($row);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Usuario no encontrado."]);
    }
}

// 🟢 POST (Actúa como PUT): Actualizar perfil
// Usamos POST en Angular para evitar problemas de compatibilidad en XAMPP
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $idUsuario = $data['id'] ?? 0;
    $nombre = $data['nombre'] ?? '';
    $telefono = $data['telefono'] ?? '';
    $contrasena = $data['contrasenia'] ?? null; // Puede ser null

    if (empty($nombre) || empty($telefono)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Campos obligatorios vacíos."]);
        exit;
    }

    if ($contrasena) {
        // Actualiza con contraseña
        $query = "UPDATE usuarios SET nombre_completo = ?, telefono = ?, contraseña = SHA2(?, 256) WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("sssi", $nombre, $telefono, $contrasenia, $idUsuario);
    } else {
        // Actualiza sin contraseña
        $query = "UPDATE usuarios SET nombre_completo = ?, telefono = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ssi", $nombre, $telefono, $idUsuario);
    }

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Datos actualizados."]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al actualizar."]);
    }
}
?>
