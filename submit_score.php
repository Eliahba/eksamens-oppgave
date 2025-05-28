<?php
require 'db_connect.php';
session_start();

$data = json_decode(file_get_contents('php://input'), true);
$user_id = (int)($data['user_id'] ?? 0);
$score   = (int)($data['score']   ?? -1);

if ($user_id <= 0 || $score < 0) {
  http_response_code(400);
  exit('Ugyldig data');
}

$stmt = $pdo->prepare('INSERT INTO scores (user_id,score) VALUES (?,?)');
$stmt->execute([$user_id,$score]);

echo json_encode(['status'=>'ok']);
