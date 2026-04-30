<?php
require_once __DIR__ . '/config/db.php';

if (session_status() === PHP_SESSION_NONE) session_start();
if (!empty($_SESSION['user_id'])) {
    header('Location: /pages/executive.php');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($email && $password) {
        $stmt = getDb()->prepare('SELECT id, name, email, password, role FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id']   = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_role'] = $user['role'];
            header('Location: /pages/executive.php');
            exit;
        }
    }
    $error = 'Invalid email or password.';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sign In — Nurture Intelligence</title>
  <link rel="stylesheet" href="/assets/css/style.css" />
</head>
<body>
<div class="login-wrap">
  <div class="login-card">
    <h1>Nurture Intel</h1>
    <p>Sign in to your account</p>

    <?php if ($error): ?>
      <div class="error-msg"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <form method="POST">
      <div class="mb-4">
        <label class="form-label">Email</label>
        <input type="email" name="email" class="form-control" placeholder="you@example.com" required
               value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" />
      </div>
      <div class="mb-4">
        <label class="form-label">Password</label>
        <input type="password" name="password" class="form-control" placeholder="••••••••" required />
      </div>
      <button type="submit" class="btn-primary">Sign In</button>
    </form>
  </div>
</div>
</body>
</html>
