<?php
require_once __DIR__ . '/../../../includes/auth.php';
require_once __DIR__ . '/../../../config/db.php';
requireRole(['SUPER_ADMIN','ADMIN']);

$pageTitle    = 'Benchmark Thresholds';
$pageSubtitle = 'Signal & alert configuration';
$success = '';
$error   = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['benchmarks'])) {
    try {
        $db   = getDb();
        $stmt = $db->prepare("UPDATE benchmarks SET warning_threshold=?, critical_threshold=? WHERE metric=?");
        foreach ($_POST['benchmarks'] as $metric => $vals) {
            $warn = isset($vals['warning'])  ? (float)$vals['warning']  : null;
            $crit = isset($vals['critical']) ? (float)$vals['critical'] : null;
            $stmt->execute([$warn, $crit, $metric]);
        }
        $success = 'Benchmarks updated successfully.';
    } catch (Exception $e) {
        $error = 'Save failed: ' . htmlspecialchars($e->getMessage());
    }
}

$benchmarks = [];
try {
    $benchmarks = getDb()->query("SELECT * FROM benchmarks ORDER BY id")->fetchAll();
} catch (Exception $e) {
    $error = 'Could not load benchmarks: ' . htmlspecialchars($e->getMessage());
}

require_once __DIR__ . '/../../../includes/header.php';
?>

<?php if ($success): ?>
<div class="alert-success mb-6"><?= $success ?></div>
<?php endif; ?>
<?php if ($error): ?>
<div class="alert-warning mb-6"><?= $error ?></div>
<?php endif; ?>

<form method="POST">
<div class="section-label">Signal Thresholds</div>
<div class="card mb-6" style="overflow:hidden">
  <table class="data-table">
    <thead>
      <tr>
        <th>Metric</th>
        <th>Label</th>
        <th class="text-right">Warning Threshold</th>
        <th class="text-right">Critical Threshold</th>
        <th class="text-right">Last Updated</th>
      </tr>
    </thead>
    <tbody>
      <?php if (empty($benchmarks)): ?>
      <tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px">No benchmarks found. Run setup.sql first.</td></tr>
      <?php else: ?>
      <?php foreach ($benchmarks as $b): ?>
      <tr>
        <td><code style="font-size:11px;color:var(--text-muted)"><?= htmlspecialchars($b['metric']) ?></code></td>
        <td><?= htmlspecialchars($b['label'] ?? '') ?></td>
        <td class="text-right">
          <input
            type="number"
            step="0.1"
            name="benchmarks[<?= htmlspecialchars($b['metric']) ?>][warning]"
            value="<?= htmlspecialchars($b['warning_threshold'] ?? '') ?>"
            style="width:80px;background:var(--surface-2);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:var(--text);padding:4px 8px;text-align:right;font-family:monospace"
          >
        </td>
        <td class="text-right">
          <input
            type="number"
            step="0.1"
            name="benchmarks[<?= htmlspecialchars($b['metric']) ?>][critical]"
            value="<?= htmlspecialchars($b['critical_threshold'] ?? '') ?>"
            style="width:80px;background:var(--surface-2);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:var(--text);padding:4px 8px;text-align:right;font-family:monospace"
          >
        </td>
        <td class="mono text-right" style="font-size:12px;color:var(--text-muted)">
          <?= $b['updated_at'] ? date('M d, Y H:i', strtotime($b['updated_at'])) : '—' ?>
        </td>
      </tr>
      <?php endforeach; ?>
      <?php endif; ?>
    </tbody>
  </table>
</div>

<?php if (!empty($benchmarks)): ?>
<div style="display:flex;gap:12px">
  <button type="submit" class="btn-primary">Save Changes</button>
  <a href="benchmarks.php" class="btn-secondary">Reset</a>
</div>
<?php endif; ?>
</form>

<!-- Reference card -->
<div class="section-label" style="margin-top:32px">Reference</div>
<div class="card" style="padding:24px">
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
    <div>
      <div class="kpi-label" style="margin-bottom:6px">Hot Signal</div>
      <div style="font-size:13px;color:var(--text-muted)">Open rate ≥ warning_threshold for <em>signal_hot_threshold</em>. Sequence is performing strongly.</div>
    </div>
    <div>
      <div class="kpi-label" style="margin-bottom:6px">Warm Signal</div>
      <div style="font-size:13px;color:var(--text-muted)">Open rate ≥ <em>signal_warm_threshold</em>. Acceptable engagement, monitor closely.</div>
    </div>
    <div>
      <div class="kpi-label" style="margin-bottom:6px">Cold Signal</div>
      <div style="font-size:13px;color:var(--text-muted)">Open rate ≥ <em>signal_cold_threshold</em>. Low engagement, consider optimising subject lines.</div>
    </div>
    <div>
      <div class="kpi-label" style="margin-bottom:6px">At Risk</div>
      <div style="font-size:13px;color:var(--text-muted)">Bounce rate ≥ <em>signal_atrisk_bounce</em> or open rate below cold threshold. Immediate review needed.</div>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/../../../includes/footer.php'; ?>
