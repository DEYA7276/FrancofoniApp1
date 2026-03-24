<?php

/**
 * Clase Database
 * Implementa un patrón similar a Singleton para la conexión a MySQL.
 * Aunque en PHP el ciclo de vida de la petición destruye y recrea la instancia,
 * centralizar la lógica de `new PDO()` asegura que todas las consultas 
 * compartan el mismo método de acceso y se gestionen los errores en un solo lugar.
 */
class Database {
    private $host = '127.0.0.1';
    private $db_name = 'francofonia';
    private $username = 'root';
    private $password = '';
    private $conn;

    /**
     * Obtiene y retorna la conexión a la base de datos usando PDO.
     * PDO (PHP Data Objects) es una capa de abstracción de acceso a datos que
     * previene inyecciones SQL mediante el uso de Prepared Statements.
     */
    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO('mysql:host=' . $this->host . ';dbname=' . $this->db_name, $this->username, $this->password);
            
            // Configurar PDO para que lance excepciones (Exception) en caso de error SQL.
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Garantizar que la conexión devuelva los datos en formato UTF-8, por ejemplo para acentos (Francofonía).
            $this->conn->exec("set names utf8");
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
            exit;
        }
        return $this->conn;
    }
}
