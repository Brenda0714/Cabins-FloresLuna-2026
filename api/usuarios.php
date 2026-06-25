<?php
// usuarios.php
header("Access-Control-Allow-Origin: http://localhost:4200"); // Permite a Angular acceder
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include 'config.php';

$query = "SELECT id, nombre_completo, correo, telefono, rol, fecha_registro FROM usuarios";
$resultado = $conn->query($query);

if ($resultado) {
    $usuarios = $resultado->fetch_all(MYSQLI_ASSOC);
    echo json_encode($usuarios);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Error al consultar usuarios: " . $conn->error]);
}

$conn->close();
?>
