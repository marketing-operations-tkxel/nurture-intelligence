<?php
require_once __DIR__ . '/../../../includes/auth.php';
require_once __DIR__ . '/../../../config/bigquery.php';
require_once __DIR__ . '/../../../config/db.php';
requireLogin();

$pageTitle = 'Sequence Performance';
$isLive    = false;
$sequences = [];
$subjectLines  = [];
$prospectTitles = [];

$SEGMENT_MAP = [
    'CIO_NT_MM'=>'CIOs & Tech Leaders | Non-Tech | $50–$500M','CEO_NT'=>'CEOs & Non-Tech Leaders | Non-Tech',
    'CEO_T_U50'=>'CEOs & Non-Tech Leaders | Tech | Under $50M','CTO_T_U50'=>'CTOs & Tech Leaders | Tech | Under $50M',
    'CTO_FTS'=>'CTOs & Tech Leaders | Funded Tech Startups','PE_MP'=>'Managing Partners | Private Equity',
    'CIO_NT_U50'=>'CIOs & Tech Leaders | Non-Tech | Under $50M new',
];
$SEGMENT_ORDER = ['CIO_NT_MM','CIO_NT_U50','CEO_T_U50','CTO_T_U50','CEO_NT','CTO_FTS','PE_MP'];

function extractCode2(string $name, array $order, array $map): string {
    $parts = explode(' | ', $name);
    if (count($parts) >= 2 && trim($parts[0]) === 'NS') { $code = trim($parts[1]); if (isset($map[$code])) return $code; }
    foreach ($order as $code) { if (str_contains($name, $code)) return $code; }
    return '';
}

// Load signal thresholds from MySQL
$thresholds = ['hot'=>20,'warm'=>12,'cold'=>5,'atRiskBounce'=>5];
try {
    $stmt = getDb()->query("SELECT metric, warning_threshold FROM benchmarks WHERE metric IN ('signal_hot_threshold','signal_warm_threshold','signal_cold_threshold','signal_atrisk_bounce')");
    foreach ($stmt->fetchAll() as $row) {
        match($row['metric']) {
            'signal_hot_threshold'  => $thresholds['hot']          = (float)$row['warning_threshold'],
            'signal_warm_threshold' => $thresholds['warm']         = (float)$row['warning_threshold'],
            'signal_cold_threshold' => $thresholds['cold']         = (float)$row['warning_threshold'],
            'signal_atrisk_bounce'  => $thresholds['atRiskBounce'] = (float)$row['warning_threshold'],
            default => null,
        };
    }
} catch (Exception $e) {}

function getSignal(float $openRate, float $bounceRate, array $t): string {
    if ($bounceRate >= $t['atRiskBounce']) return 'At Risk';
    if ($openRate >= $t['hot'])  return 'Hot';
    if ($openRate >= $t['warm']) return 'Warm';
    if ($openRate >= $t['cold']) return 'Cold';
    return 'At Risk';
}

if (bqIsConfigured()) {
    try {
        $A = bqTable('pardot_userActivities');
        $P = bqTable('pardot_prospects');

        $campaignRows = bqQuery("
            SELECT campaign_name,
                   COUNTIF(".IS_EMAIL_SENT.")   AS sent,
                   COUNTIF(".IS_EMAIL_OPEN.")   AS opens,
                   COUNTIF(".IS_EMAIL_CLICK.")  AS clicks,
                   COUNTIF(".IS_EMAIL_BOUNCE.") AS bounces,
                   COUNTIF(".IS_EMAIL_UNSUB.")  AS unsubs,
                   COUNTIF(".IS_EMAIL_SPAM.")   AS spam,
                   MIN(CAST(created_at AS STRING)) AS min_created_at
            FROM $A
            WHERE campaign_name IS NOT NULL AND campaign_name != ''
              AND NOT (LOWER(campaign_name) LIKE '%copy%' OR LOWER(campaign_name) LIKE '% test%' OR LOWER(campaign_name) LIKE '%testing%')
            GROUP BY campaign_name
            HAVING COUNTIF(".IS_EMAIL_SENT.") >= 10
            ORDER BY opens DESC LIMIT 200
        ");

        $prospectRows = bqQuery("SELECT job_title, COALESCE(score,0) AS score FROM $P WHERE job_title IS NOT NULL AND job_title!='' LIMIT 1000");

        foreach ($campaignRows as $r) {
            $sent      = (int)$r['sent'];
            $opens     = (int)$r['opens'];
            $clicks    = (int)$r['clicks'];
            $bounces   = (int)$r['bounces'];
            $unsubs    = (int)$r['unsubs'];
            $spam      = (int)$r['spam'];
            $delivered = max(0, $sent - $bounces);
            $openRate  = pct($opens, $delivered);
            $clickRate = pct($clicks, $delivered);
            $bounceRate = pct($bounces, $sent);
            $segCode   = extractCode2($r['campaign_name'], $SEGMENT_ORDER, $SEGMENT_MAP);
            $sequences[] = [
                'name'        => $r['campaign_name'],
                'segmentCode' => $segCode,
                'segment'     => $SEGMENT_MAP[$segCode] ?? $segCode,
                'sent'        => $sent, 'delivered' => $delivered,
                'opens'       => $opens, 'clicks'   => $clicks,
                'bounces'     => $bounces, 'unsubs'  => $unsubs, 'spam' => $spam,
                'deliveryRate'=> pct($delivered,$sent),
                'openRate'    => $openRate,
                'clickRate'   => $clickRate,
                'ctr'         => pct($clicks,$opens),
                'bounceRate'  => $bounceRate,
                'unsubRate'   => pct($unsubs,$delivered),
                'signal'      => getSignal($openRate,$bounceRate,$thresholds),
                'sentAt'      => $r['min_created_at'],
            ];
        }

        // NS | only, else all
        $nsOnly = array_filter($sequences, fn($s) => str_starts_with($s['name'],'NS |'));
        if (!empty($nsOnly)) $sequences = array_values($nsOnly);
        usort($sequences, fn($a,$b) => $b['openRate'] <=> $a['openRate']);

        // Subject lines (top 20 by opens)
        $byOpens = $sequences;
        usort($byOpens, fn($a,$b) => $b['opens'] <=> $a['opens']);
        $subjectLines = array_slice($byOpens, 0, 20);

        // Prospect titles
        $titleMap = [];
        foreach ($prospectRows as $p) {
            $title = trim($p['job_title']) ?: 'Unknown';
            if (!isset($titleMap[$title])) $titleMap[$title] = ['delivered'=>0,'opens'=>0,'clicks'=>0];
            $titleMap[$title]['delivered']++;
            if ((int)$p['score'] > 50)  $titleMap[$title]['opens']++;
            if ((int)$p['score'] > 100) $titleMap[$title]['clicks']++;
        }
        arsort($titleMap);
        foreach (array_slice($titleMap,0,15,true) as $title => $v) {
            $prospectTitles[] = [
                'title'    => $title, 'delivered' => $v['delivered'],
                'opens'    => $v['opens'], 'openRate' => pct($v['opens'],$v['delivered']),
                'clicks'   => $v['clicks'], 'clickRate' => pct($v['clicks'],$v['delivered']),
            ];
        }
        usort($prospectTitles, fn($a,$b) => $b['delivered'] <=> $a['delivered']);
        $isLive = true;
    } catch (Exception $e) { error_log($e->getMessage()); }
}

$pageSubtitle = $isLive ? 'Live BigQuery Data' : 'Configure BigQuery to see sequence performance';
require_once __DIR__ . '/../../../includes/header.php';

$signalColors = ['Hot'=>'badge-hot','Warm'=>'badge-warm','Cold'=>'badge-cold','At Risk'=>'badge-atrisk'];
?>

<?php if (!$isLive): ?>
<div class="alert-warning mb-6">No data — configure <code>BQ_PROJECT_ID</code> and <code>BQ_DATASET_ID</code>.</div>
<?php endif; ?>

<!-- Sequences table -->
<div class="section-label">Email Sequences</div>
<div class="card mb-6" style="overflow:hidden">
  <table class="data-table">
    <thead>
      <tr>
        <th>Name</th><th>Signal</th><th class="text-right">Sent</th>
        <th class="text-right">Opens</th><th class="text-right">Open Rate</th>
        <th class="text-right">Click Rate</th><th class="text-right">Bounce Rate</th>
        <th class="text-right">Unsub Rate</th>
      </tr>
    </thead>
    <tbody>
      <?php if (empty($sequences)): ?>
      <tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:32px">No sequence data.</td></tr>
      <?php else: ?>
      <?php foreach ($sequences as $s): ?>
      <tr>
        <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="<?= htmlspecialchars($s['name']) ?>">
          <?= htmlspecialchars($s['name']) ?>
        </td>
        <td><span class="<?= $signalColors[$s['signal']] ?? 'badge-cold' ?>"><?= htmlspecialchars($s['signal']) ?></span></td>
        <td class="mono text-right"><?= number_format($s['sent']) ?></td>
        <td class="mono text-right"><?= number_format($s['opens']) ?></td>
        <td class="mono text-right text-blue"><?= $s['openRate'] ?>%</td>
        <td class="mono text-right"><?= $s['clickRate'] ?>%</td>
        <td class="mono text-right"><?= $s['bounceRate'] ?>%</td>
        <td class="mono text-right"><?= $s['unsubRate'] ?>%</td>
      </tr>
      <?php endforeach; ?>
      <?php endif; ?>
    </tbody>
  </table>
</div>

<!-- Top subject lines -->
<?php if (!empty($subjectLines)): ?>
<div class="section-label">Top Subject Lines by Opens</div>
<div class="card mb-6" style="overflow:hidden">
  <table class="data-table">
    <thead>
      <tr><th>Subject</th><th class="text-right">Delivered</th><th class="text-right">Opens</th><th class="text-right">Open Rate</th><th class="text-right">Clicks</th></tr>
    </thead>
    <tbody>
      <?php foreach ($subjectLines as $s): ?>
      <tr>
        <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><?= htmlspecialchars($s['name']) ?></td>
        <td class="mono text-right"><?= number_format($s['delivered']) ?></td>
        <td class="mono text-right"><?= number_format($s['opens']) ?></td>
        <td class="mono text-right text-blue"><?= $s['openRate'] ?>%</td>
        <td class="mono text-right"><?= number_format($s['clicks']) ?></td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php endif; ?>

<!-- Prospect titles -->
<?php if (!empty($prospectTitles)): ?>
<div class="section-label">Engagement by Job Title</div>
<div class="card" style="overflow:hidden">
  <table class="data-table">
    <thead>
      <tr><th>Title</th><th class="text-right">Prospects</th><th class="text-right">High Score</th><th class="text-right">Open Rate (est)</th><th class="text-right">Click Rate (est)</th></tr>
    </thead>
    <tbody>
      <?php foreach ($prospectTitles as $t): ?>
      <tr>
        <td><?= htmlspecialchars($t['title']) ?></td>
        <td class="mono text-right"><?= number_format($t['delivered']) ?></td>
        <td class="mono text-right"><?= number_format($t['opens']) ?></td>
        <td class="mono text-right text-blue"><?= $t['openRate'] ?>%</td>
        <td class="mono text-right"><?= $t['clickRate'] ?>%</td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php endif; ?>

<?php require_once __DIR__ . '/../../../includes/footer.php'; ?>
