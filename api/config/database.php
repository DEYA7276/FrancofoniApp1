<?php
/**
 * Configuración de base de datos - FrancofoníaApp Local
 * Conexión PDO a MySQL via XAMPP
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'francofonia';
    private $username = 'root';
    private $password = ''; // XAMPP default
    private $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
            exit;
        }
        return $this->conn;
    }
}
