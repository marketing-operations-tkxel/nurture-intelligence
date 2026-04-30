<?php
require_once __DIR__ . '/../../../includes/auth.php';
require_once __DIR__ . '/../../../config/bigquery.php';
requireLogin();

$pageTitle = 'Segments & Industries';
$isLive    = false;
$segments  = [];
$industries = [];

$SEGMENT_MAP = [
    'CIO_NT_MM'  => 'CIOs & Tech Leaders | Non-Tech | $50–$500M',
    'CEO_NT'     => 'CEOs & Non-Tech Leaders | Non-Tech',
    'CEO_T_U50'  => 'CEOs & Non-Tech Leaders | Tech | Under $50M',
    'CTO_T_U50'  => 'CTOs & Tech Leaders | Tech | Under $50M',
    'CTO_FTS'    => 'CTOs & Tech Leaders | Funded Tech Startups',
    'PE_MP'      => 'Managing Partners | Private Equity',
    'CIO_NT_U50' => 'CIOs & Tech Leaders | Non-Tech | Under $50M new',
];
$SEGMENT_ORDER = ['CIO_NT_MM','CIO_NT_U50','CEO_T_U50','CTO_T_U50','CEO_NT','CTO_FTS','PE_MP'];

function extractCode(string $name, array $order, array $map): ?string {
    $parts = explode(' | ', $name);
    if (count($parts) >= 2 && trim($parts[0]) === 'NS') {
        $code = trim($parts[1]);
        if (isset($map[$code])) return $code;
    }
    foreach ($order as $code) {
        if (str_contains($name, $code)) return $code;
    }
    return null;
}

if (bqIsConfigured()) {
    try {
        $A = bqTable('pardot_userActivities');
        $T = bqTable('Leads');
        $P = bqTable('pardot_prospects');

        $campaignRows = bqQuery("
            SELECT campaign_name,
                   COUNTIF(".IS_EMAIL_SENT.")   AS sent,
                   COUNTIF(".IS_EMAIL_OPEN.")   AS opens,
                   COUNTIF(".IS_EMAIL_CLICK.")  AS clicks,
                   COUNTIF(".IS_EMAIL_BOUNCE.") AS bounces,
                   COUNTIF(".IS_EMAIL_UNSUB.")  AS unsubs
            FROM $A
            WHERE campaign_name LIKE 'NS |%' AND campaign_name IS NOT NULL
            GROUP BY campaign_name
            HAVING COUNTIF(".IS_EMAIL_SENT.") >= 10
        ");

        $memberRows = bqQuery("
            SELECT TRIM(SPLIT(pardot_segments,',')[OFFSET(0)]) AS code, COUNT(*) AS members
            FROM $P WHERE pardot_segments IS NOT NULL AND pardot_segments != ''
            GROUP BY code
        ");
        $memberMap = [];
        foreach ($memberRows as $r) $memberMap[$r['code']] = (int)$r['members'];

        $industryRows = bqQuery("
            SELECT Industry, COUNT(*) AS cnt FROM $T
            WHERE Industry IS NOT NULL AND Industry != ''
            GROUP BY Industry ORDER BY cnt DESC LIMIT 20
        ");

        // Aggregate per segment code
        $segStats = [];
        foreach ($SEGMENT_ORDER as $code) $segStats[$code] = ['sent'=>0,'delivered'=>0,'opens'=>0,'clicks'=>0,'bounces'=>0,'unsubs'=>0];

        foreach ($campaignRows as $r) {
            $code = extractCode($r['campaign_name'], $SEGMENT_ORDER, $SEGMENT_MAP);
            if (!$code) continue;
            $sent = (int)$r['sent']; $b = (int)$r['bounces'];
            $segStats[$code]['sent']     += $sent;
            $segStats[$code]['delivered'] += max(0,$sent-$b);
            $segStats[$code]['opens']    += (int)$r['opens'];
            $segStats[$code]['clicks']   += (int)$r['clicks'];
            $segStats[$code]['bounces']  += $b;
            $segStats[$code]['unsubs']   += (int)$r['unsubs'];
        }

        foreach ($SEGMENT_ORDER as $code) {
            $name    = $SEGMENT_MAP[$code];
            $members = $memberMap[$code] ?? 0;
            $st      = $segStats[$code];
            $segments[] = [
                'name'         => $name,
                'members'      => $members,
                'sent'         => $st['sent'],
                'delivered'    => $st['delivered'],
                'opens'        => $st['opens'],
                'clicks'       => $st['clicks'],
                'bounces'      => $st['bounces'],
                'deliveryRate' => pct($st['delivered'], $st['sent']),
                'openRate'     => pct($st['opens'], $st['delivered']),
                'clickRate'    => pct($st['clicks'], $st['delivered']),
                'unsubRate'    => pct($st['unsubs'], $st['delivered']),
            ];
        }
        usort($segments, fn($a,$b) => $b['members'] - $a['members']);

        foreach ($industryRows as $r) {
            $industries[] = ['name'=>$r['Industry'], 'count'=>(int)$r['cnt']];
        }

        $isLive = true;
    } catch (Exception $e) { error_log($e->getMessage()); }
}

$pageSubtitle = $isLive ? 'Live BigQuery Data' : 'Configure BigQuery to see segment performance';
require_once __DIR__ . '/../../../includes/header.php';
?>

<?php if (!$isLive): ?>
<div class="alert-warning mb-6">No data — configure <code>BQ_PROJECT_ID</code> and <code>BQ_DATASET_ID</code>.</div>
<?php endif; ?>

<!-- Segments table -->
<div class="section-label">Segment Performance</div>
<div class="card mb-6" style="overflow:hidden">
  <table class="data-table">
    <thead>
      <tr>
        <th>Segment</th><th class="text-right">Members</th>
        <th class="text-right">Sent</th><th class="text-right">Opens</th>
        <th class="text-right">Open Rate</th><th class="text-right">Click Rate</th>
        <th class="text-right">Bounce Rate</th><th class="text-right">Unsub Rate</th>
      </tr>
    </thead>
    <tbody>
      <?php if (empty($segments)): ?>
      <tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:32px">No segment data.</td></tr>
      <?php else: ?>
      <?php foreach ($segments as $s): ?>
      <tr>
        <td><?= htmlspecialchars($s['name']) ?></td>
        <td class="mono text-right"><?= number_format($s['members']) ?></td>
        <td class="mono text-right"><?= number_format($s['sent']) ?></td>
        <td class="mono text-right"><?= number_format($s['opens']) ?></td>
        <td class="mono text-right text-blue"><?= $s['openRate'] ?>%</td>
        <td class="mono text-right"><?= $s['clickRate'] ?>%</td>
        <td class="mono text-right"><?= pct($s['bounces'], $s['sent']) ?>%</td>
        <td class="mono text-right"><?= $s['unsubRate'] ?>%</td>
      </tr>
      <?php endforeach; ?>
      <?php endif; ?>
    </tbody>
  </table>
</div>

<!-- Industries table -->
<div class="section-label">Industry Breakdown (Leads)</div>
<div class="card" style="overflow:hidden">
  <table class="data-table">
    <thead>
      <tr><th>Industry</th><th class="text-right">Lead Count</th></tr>
    </thead>
    <tbody>
      <?php if (empty($industries)): ?>
      <tr><td colspan="2" style="text-align:center;color:var(--text-muted);padding:32px">No industry data.</td></tr>
      <?php else: ?>
      <?php foreach ($industries as $ind): ?>
      <tr>
        <td><?= htmlspecialchars($ind['name']) ?></td>
        <td class="mono text-right"><?= number_format($ind['count']) ?></td>
      </tr>
      <?php endforeach; ?>
      <?php endif; ?>
    </tbody>
  </table>
</div>

<?php require_once __DIR__ . '/../../../includes/footer.php'; ?>
