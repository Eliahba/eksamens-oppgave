<?php
$host = 'localhost';
$db   = 'breakout_db';
$user = 'eliah';
$pass = 'U22V#yXN*ghXFFj';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
  PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
  $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
  http_response_code(500);
  exit('Databaseforbindelse feilet: ' . $e->getMessage());
}
