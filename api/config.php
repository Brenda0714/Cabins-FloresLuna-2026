<?php
// config.php
$host = "localhost";
$user = "angelc12_cabinsluna";
$pass = "Floresdeluna1+";
$db   = "angelc12_Cabins_FloresLuna";

// Asegúrate de que esta variable sea $conn
//$conn = new mysqli($host, $user, $pass, $db);

$conn = new mysqli("localhost", "root", "", $db);



if ($conn->connect_error) {
    die(json_encode(["error" => "Conexión fallida"]));
}
$conn->set_charset("utf8mb4");
?>
