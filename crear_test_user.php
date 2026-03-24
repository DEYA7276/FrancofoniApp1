<?php
$conn = new PDO('mysql:host=127.0.0.1;dbname=francofonia', 'root', '');
$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$email = '23610062@utgz.edu.mx';
$password = password_hash('secreto123', PASSWORD_BCRYPT);
$id = 'u-test-999';

$stmt = $conn->prepare("INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, 'admin') ON DUPLICATE KEY UPDATE password=?");
$stmt->execute([$id, $email, $password, $password]);
echo "Exito, DB actualizada con $email";
