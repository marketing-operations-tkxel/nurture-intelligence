<?php
require_once __DIR__ . '/../../../includes/auth.php';
require_once __DIR__ . '/../../../config/db.php';
requireRole(['SUPER_ADMIN','ADMIN']);

$pageTitle    = 'User Management';
$pageSubtitle = 'Create and manage dashboard users';
$success = '';
$error   = '';
$db = getDb();

$ROLES = ['SUPER_ADMIN','ADMIN','EXECUTIVE','NURTURE_OPS','SALES_LEADERSHIP'];

// Handle actions
$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if ($action === 'create') {
        $name  = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $role  = $_POST['role'] ?? 'NURTURE_OPS';
        $pass  = $_POST['password'] ?? '';

        if (!$name || !$email || !$pass) {
            $error = 'Name, email, and password are required.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = 'Invalid email address.';
        } elseif (!in_array($role, $ROLES)) {
            $error = 'Invalid role.';
        } elseif (strlen($pass) < 8) {
            $error = 'Password must be at least 8 characters.';
        } else {
            try {
                $hash = password_hash($pass, PASSWORD_BCRYPT);
                $db->prepare("INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)")
                   ->execute([$name, $email, $hash, $role]);
                $success = "User '{$name}' created successfully.";
            } catch (Exception $e) {
                $error = str_contains($e->getMessage(), 'Duplicate') ? 'Email already exists.' : 'Create failed: ' . htmlspecialchars($e->getMessage());
            }
        }
    }

    if ($action === 'update') {
        $id    = (int)($_POST['id'] ?? 0);
        $name  = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $role  = $_POST['role'] ?? '';
        $pass  = $_POST['password'] ?? '';

        if (!$id || !$name || !$email) {
            $error = 'Name and email are required.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = 'Invalid email address.';
        } elseif (!in_array($role, $ROLES)) {
            $error = 'Invalid role.';
        } elseif ($pass && strlen($pass) < 8) {
            $error = 'Password must be at least 8 characters.';
        } else {
            try {
                if ($pass) {
                    $hash = password_hash($pass, PASSWORD_BCRYPT);
                    $db->prepare("UPDATE users SET name=?, email=?, role=?, password=? WHERE id=?")
                       ->execute([$name, $email, $role, $hash, $id]);
                } else {
                    $db->prepare("UPDATE users SET name=?, email=?, role=? WHERE id=?")
                       ->execute([$name, $email, $role, $id]);
                }
                $success = "User updated successfully.";
            } catch (Exception $e) {
                $error = str_contains($e->getMessage(), 'Duplicate') ? 'Email already in use.' : 'Update failed: ' . htmlspecialchars($e->getMessage());
            }
        }
    }

    if ($action === 'delete') {
        $id = (int)($_POST['id'] ?? 0);
        $me = currentUser();
        if ($id === (int)($me['id'] ?? 0)) {
            $error = 'You cannot delete your own account.';
        } elseif ($id) {
            try {
                $db->prepare("DELETE FROM users WHERE id=?")->execute([$id]);
                $success = 'User deleted.';
            } catch (Exception $e) {
                $error = 'Delete failed: ' . htmlspecialchars($e->getMessage());
            }
        }
    }
}

$users  = $db->query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC")->fetchAll();
$editId = (int)($_GET['edit'] ?? 0);
$editUser = null;
if ($editId) {
    foreach ($users as $u) { if ((int)$u['id'] === $editId) { $editUser = $u; break; } }
}

require_once __DIR__ . '/../../../includes/header.php';

$roleColors = [
    'SUPER_ADMIN'      => 'badge-hot',
    'ADMIN'            => 'badge-warm',
    'EXECUTIVE'        => 'badge-cold',
    'NURTURE_OPS'      => 'badge-cold',
    'SALES_LEADERSHIP' => 'badge-cold',
];
?>

<?php if ($success): ?>
<div class="alert-success mb-6"><?= htmlspecialchars($success) ?></div>
<?php endif; ?>
<?php if ($error): ?>
<div class="alert-warning mb-6"><?= htmlspecialchars($error) ?></div>
<?php endif; ?>

<div style="display:grid;grid-template-columns:1fr 340px;gap:24px;align-items:start">

<!-- Users table -->
<div>
  <div class="section-label">All Users</div>
  <div class="card" style="overflow:hidden">
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($users)): ?>
        <tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px">No users found.</td></tr>
        <?php else: ?>
        <?php foreach ($users as $u): ?>
        <tr>
          <td class="mono text-muted"><?= $u['id'] ?></td>
          <td><?= htmlspecialchars($u['name']) ?></td>
          <td style="color:var(--text-muted);font-size:12px"><?= htmlspecialchars($u['email']) ?></td>
          <td><span class="<?= $roleColors[$u['role']] ?? 'badge-cold' ?>" style="font-size:10px"><?= htmlspecialchars($u['role']) ?></span></td>
          <td class="mono" style="font-size:12px;color:var(--text-muted)"><?= date('M d, Y', strtotime($u['created_at'])) ?></td>
          <td>
            <a href="?edit=<?= $u['id'] ?>" style="color:var(--blue);font-size:12px;text-decoration:none;margin-right:12px">Edit</a>
            <?php $me = currentUser(); if ((int)$u['id'] !== (int)($me['id'] ?? 0)): ?>
            <form method="POST" style="display:inline" onsubmit="return confirm('Delete <?= htmlspecialchars(addslashes($u['name'])) ?>?')">
              <input type="hidden" name="action" value="delete">
              <input type="hidden" name="id" value="<?= $u['id'] ?>">
              <button type="submit" style="background:none;border:none;color:#ef4444;font-size:12px;cursor:pointer;padding:0">Delete</button>
            </form>
            <?php endif; ?>
          </td>
        </tr>
        <?php endforeach; ?>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Create / Edit panel -->
<div>
  <?php if ($editUser): ?>
  <div class="section-label">Edit User</div>
  <div class="card" style="padding:24px">
    <form method="POST">
      <input type="hidden" name="action" value="update">
      <input type="hidden" name="id" value="<?= $editUser['id'] ?>">
      <div style="margin-bottom:16px">
        <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:6px">Name</label>
        <input type="text" name="name" value="<?= htmlspecialchars($editUser['name']) ?>" required class="form-input">
      </div>
      <div style="margin-bottom:16px">
        <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:6px">Email</label>
        <input type="email" name="email" value="<?= htmlspecialchars($editUser['email']) ?>" required class="form-input">
      </div>
      <div style="margin-bottom:16px">
        <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:6px">Role</label>
        <select name="role" class="form-input">
          <?php foreach ($ROLES as $r): ?>
          <option value="<?= $r ?>" <?= $editUser['role'] === $r ? 'selected' : '' ?>><?= $r ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div style="margin-bottom:20px">
        <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:6px">New Password <span style="opacity:.5">(leave blank to keep current)</span></label>
        <input type="password" name="password" class="form-input" autocomplete="new-password">
      </div>
      <div style="display:flex;gap:10px">
        <button type="submit" class="btn-primary">Save</button>
        <a href="users.php" class="btn-secondary">Cancel</a>
      </div>
    </form>
  </div>
  <?php else: ?>
  <div class="section-label">Create User</div>
  <div class="card" style="padding:24px">
    <form method="POST">
      <input type="hidden" name="action" value="create">
      <div style="margin-bottom:16px">
        <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:6px">Name</label>
        <input type="text" name="name" required class="form-input" placeholder="Full name">
      </div>
      <div style="margin-bottom:16px">
        <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:6px">Email</label>
        <input type="email" name="email" required class="form-input" placeholder="user@example.com">
      </div>
      <div style="margin-bottom:16px">
        <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:6px">Role</label>
        <select name="role" class="form-input">
          <?php foreach ($ROLES as $r): ?>
          <option value="<?= $r ?>"><?= $r ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div style="margin-bottom:20px">
        <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:6px">Password</label>
        <input type="password" name="password" required class="form-input" autocomplete="new-password" minlength="8">
      </div>
      <button type="submit" class="btn-primary" style="width:100%">Create User</button>
    </form>
  </div>
  <?php endif; ?>
</div>

</div>

<?php require_once __DIR__ . '/../../../includes/footer.php'; ?>
