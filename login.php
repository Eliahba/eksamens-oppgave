<?php
require 'db_connect.php';
session_start();

$data = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

// Sjekk passord hvis du har ett, her gjøres kun avg.
// For demo kan du droppe passord-verifisering:
$stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user) {
  http_response_code(401);
  exit('Feil brukernavn');
}

// Hent gjennomsnittspoeng
$stmtAvg = $pdo->prepare('SELECT AVG(score) AS avg_score FROM scores WHERE user_id = ?');
$stmtAvg->execute([$user['id']]);
$avg = $stmtAvg->fetchColumn();
$avg = $avg!==null ? round($avg,2) : 0;

echo json_encode([
  'status'    => 'ok',
  'user_id'   => $user['id'],
  'avg_score' => $avg
]);
