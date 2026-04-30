<?php
require_once __DIR__ . '/../../../includes/auth.php';
require_once __DIR__ . '/../../../config/bigquery.php';
requireLogin();

$pageTitle    = 'Contact Intelligence';
$isLive       = false;
$prospects    = [];
$buckets      = ['hot'=>0,'warm'=>0,'cold'=>0,'inactive'=>0,'suppression'=>0,'recycle'=>0];

if (bqIsConfigured()) {
    try {
        $P = bqTable('pardot_prospects'); $T = bqTable('Leads');
        $rows = bqQuery("
            SELECT p.id, p.email, p.first_name, p.last_name, p.job_title,
                   COALESCE(p.score,0) AS score, COALESCE(p.grade,'') AS grade,
                   COALESCE(p.last_activity_at,'') AS last_activity_at,
                   COALESCE(p.pardot_segments,'') AS pardot_segments,
                   COALESCE(p.pardot_nurture_step,'') AS pardot_nurture_step,
                   COALESCE(l.Normalize_Title_del__c,'') AS normalized_title
            FROM $P p
            LEFT JOIN $T l ON LOWER(p.email)=LOWER(l.Email) AND l.OQL__c=TRUE
            ORDER BY score DESC
            LIMIT 500
        ");

        $now = time();
        foreach ($rows as $p) {
            $score = (int)$p['score'];
            $lastMs = $p['last_activity_at'] ? strtotime($p['last_activity_at']) : null;
            $days = $lastMs ? ($now - $lastMs) / 86400 : 999;

            if ($score < 0)                        { $buckets['suppression']++; }
            elseif ($score >= 100 || $days <= 7)   { $buckets['hot']++; }
            elseif ($score >= 50  || $days <= 30)  { $buckets['warm']++; }
            elseif ($score >= 10  || $days <= 90)  { $buckets['cold']++; }
            elseif ($score >= 1   && $score < 10)  { $buckets['recycle']++; }
            else                                   { $buckets['inactive']++; }
        }

        $prospects = array_slice($rows, 0, 50);
        $isLive = true;
    } catch (Exception $e) { error_log($e->getMessage()); }
}

$pageSubtitle = $isLive ? 'Live BigQuery Data' : 'Configure BigQuery to see contact intelligence';
require_once __DIR__ . '/../../../includes/header.php';

$bucketConfig = [
    ['key'=>'hot',        'label'=>'Hot',                   'color'=>'text-red',   'desc'=>'Highly engaged, ready for sales action'],
    ['key'=>'warm',       'label'=>'Warm',                  'color'=>'text-muted', 'desc'=>'Moderate engagement, nurture active'],
    ['key'=>'cold',       'label'=>'Cold',                  'color'=>'text-blue',  'desc'=>'Low recent engagement'],
    ['key'=>'inactive',   'label'=>'Inactive',              'color'=>'text-muted', 'desc'=>'No activity in defined window'],
    ['key'=>'suppression','label'=>'Suppression Candidates','color'=>'text-red',   'desc'=>'Bounced, unsubbed, or chronic non-responders'],
    ['key'=>'recycle',    'label'=>'Recycle Candidates',    'color'=>'text-green', 'desc'=>'Aged contacts eligible for re-engagement'],
];
?>

<?php if (!$isLive): ?>
<div class="alert-warning mb-6">No data — configure <code>BQ_PROJECT_ID</code> and <code>BQ_DATASET_ID</code>.</div>
<?php endif; ?>

<!-- Bucket cards -->
<div class="section-label">Engagement Buckets</div>
<div class="grid-3 mb-6">
  <?php foreach ($bucketConfig as $b): ?>
  <div class="kpi-card">
    <div class="kpi-label <?= $b['color'] ?>"><?= $b['label'] ?></div>
    <div class="kpi-value"><?= number_format($buckets[$b['key']]) ?></div>
    <div class="kpi-sub"><?= $b['desc'] ?></div>
  </div>
  <?php endforeach; ?>
</div>

<!-- Prospect table -->
<div class="section-label">Prospect Activity (Top 50)</div>
<div class="card" style="overflow:hidden">
  <table class="data-table">
    <thead>
      <tr>
        <th>#</th><th>Name</th><th>Title</th><th>Score</th><th>Grade</th>
        <th>Last Activity</th><th>Segment</th><th>Nurture Step</th>
      </tr>
    </thead>
    <tbody>
      <?php if (empty($prospects)): ?>
      <tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:32px">No prospects found.</td></tr>
      <?php else: ?>
      <?php foreach ($prospects as $i => $p): ?>
      <?php
        $score = (int)$p['score'];
        $status = $score >= 150 ? 'Engaged' : ($score >= 75 ? 'Warm' : ($score >= 25 ? 'Low Click' : 'Dark'));
        $statusColor = $score >= 150 ? 'text-green' : ($score >= 75 ? 'text-muted' : 'text-muted');
        $name = trim(($p['first_name'].' '.$p['last_name'])) ?: ($p['email'] ?: 'Prospect '.$p['id']);
      ?>
      <tr>
        <td class="mono text-muted"><?= $i+1 ?></td>
        <td><?= htmlspecialchars($name) ?></td>
        <td style="color:var(--text-muted)"><?= htmlspecialchars($p['job_title'] ?: '—') ?></td>
        <td class="mono text-blue"><?= $score ?></td>
        <td class="mono"><?= htmlspecialchars($p['grade'] ?: '—') ?></td>
        <td class="mono" style="font-size:12px;color:var(--text-muted)"><?= $p['last_activity_at'] ? date('M d, Y', strtotime($p['last_activity_at'])) : '—' ?></td>
        <td style="font-size:12px;color:var(--text-muted)"><?= htmlspecialchars($p['pardot_segments'] ?: '—') ?></td>
        <td style="font-size:12px;color:var(--text-muted)"><?= htmlspecialchars($p['pardot_nurture_step'] ?: '—') ?></td>
      </tr>
      <?php endforeach; ?>
      <?php endif; ?>
    </tbody>
  </table>
</div>

<?php require_once __DIR__ . '/../../../includes/footer.php'; ?>
