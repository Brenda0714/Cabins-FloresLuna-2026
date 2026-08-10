<?php
// api/promociones.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 📅 Configuración de la campaña actual
$promocionConfig = [
    'nombre' => '¡Promoción por Tiempo Limitado!',
    'descuento_porcentaje' => 30,
    'fecha_inicio' => '2026-08-01 00:00:00', // Modifica estas fechas según la vigencia
    'fecha_fin'    => '2026-08-31 23:59:59',
    'activa'       => true // Interruptor manual maestro
];

// Comprobar la fecha actual del servidor
$ahora = date('Y-m-d H:i:s');
$estaVigente = $promocionConfig['activa'] &&
               ($ahora >= $promocionConfig['fecha_inicio'] && $ahora <= $promocionConfig['fecha_fin']);

// Retornar estado dinámico
echo json_encode([
    'promocion_activa' => $estaVigente,
    'nombre' => $estaVigente ? $promocionConfig['nombre'] : null,
    'descuento' => $estaVigente ? $promocionConfig['descuento_porcentaje'] : 0
]);
?>
