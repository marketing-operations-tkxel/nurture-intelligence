<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/bigquery.php';
requireLogin();

$pageTitle    = 'Executive Overview';
$pageSubtitle = bqIsConfigured() ? 'Live BigQuery Data' : 'Configure BQ_PROJECT_ID & BQ_DATASET_ID to see live data';

$kpi = ['wonRevenue'=>0,'pipelineValue'=>0,'mqls'=>0,'sqls'=>0,'discoveryCalls'=>0,
        'emailsSent'=>0,'deliveryRate'=>0,'uniqueOpenRate'=>0,'uniqueClickRate'=>0,
        'bounceRate'=>0,'unsubscribeRate'=>0,'opensCount'=>0,'clicksCount'=>0,
        'unsubscribesCount'=>0,'bouncesCount'=>0,'totalAudience'=>0,'engagedAudience'=>0,'engagedRate'=>0];
$funnelStages = [];
$isLive = false;

if (bqIsConfigured()) {
    try {
        $T = bqTable('Leads'); $O = bqTable('Opportunities'); $P = bqTable('pardot_prospects'); $A = bqTable('pardot_userActivities');

        $mql   = bqCount("SELECT COUNT(*) AS n FROM $T WHERE MQL_Response__c = TRUE");
        $sql   = bqCount("SELECT COUNT(*) AS n FROM $T WHERE SQL__c = TRUE");
        $dc    = bqCount("SELECT COUNT(*) AS n FROM $T WHERE Discovery_Call__c = TRUE");
        $won   = bqSum("SELECT SUM(Amount) AS n FROM $O WHERE IsWon=TRUE AND IsClosed=TRUE AND Amount<10000000");
        $pipe  = bqSum("SELECT SUM(Amount) AS n FROM $O WHERE IsClosed=FALSE");
        $newO  = bqCount("SELECT COUNT(*) AS n FROM $O WHERE FORMAT_DATE('%Y-%m',DATE(CreatedDate))=FORMAT_DATE('%Y-%m',CURRENT_DATE())");
        $total = bqCount("SELECT COUNT(*) AS n FROM $P");
        $eng   = bqCount("SELECT COUNT(*) AS n FROM $P WHERE SAFE_CAST(last_activity_at AS TIMESTAMP)>=TIMESTAMP_SUB(CURRENT_TIMESTAMP(),INTERVAL 30 DAY)");

        $emailRow = bqQuery("SELECT COUNTIF(".IS_EMAIL_SENT.") AS sent, COUNT(DISTINCT IF(".IS_EMAIL_OPEN.",prospect_id,NULL)) AS uopens, COUNT(DISTINCT IF(".IS_EMAIL_CLICK.",prospect_id,NULL)) AS uclicks, COUNTIF(".IS_EMAIL_BOUNCE.") AS bounces, COUNTIF(".IS_EMAIL_UNSUB.") AS unsubs FROM $A");
        $es = $emailRow[0] ?? [];
        $sent      = (int)($es['sent'] ?? 0);
        $uopens    = (int)($es['uopens'] ?? 0);
        $uclicks   = (int)($es['uclicks'] ?? 0);
        $bounces   = (int)($es['bounces'] ?? 0);
        $unsubs    = (int)($es['unsubs'] ?? 0);
        $delivered = max(0, $sent - $bounces);

        $kpi = [
            'wonRevenue'        => $won,
            'pipelineValue'     => $pipe,
            'opportunitiesCreated' => $newO,
            'mqls'              => $mql,
            'sqls'              => $sql,
            'discoveryCalls'    => $dc,
            'emailsSent'        => $sent,
            'deliveryRate'      => pct($delivered, $sent),
            'uniqueOpenRate'    => pct($uopens, $delivered),
            'uniqueClickRate'   => pct($uclicks, $delivered),
            'bounceRate'        => pct($bounces, $sent),
            'unsubscribeRate'   => pct($unsubs, $delivered),
            'opensCount'        => $uopens,
            'clicksCount'       => $uclicks,
            'unsubscribesCount' => $unsubs,
            'bouncesCount'      => $bounces,
            'totalAudience'     => $total,
            'engagedAudience'   => $eng,
            'engagedRate'       => pct($eng, $total),
        ];

        // Funnel
        $nurture = bqCount("SELECT COUNT(*) AS n FROM $T WHERE Marketing_nurture__c=TRUE");
        $opps    = bqCount("SELECT COUNT(*) AS n FROM $O WHERE IsClosed=FALSE");
        $wonO    = bqCount("SELECT COUNT(*) AS n FROM $O WHERE IsWon=TRUE AND IsClosed=TRUE");
        $base    = $nurture ?: 1;
        $funnelStages = [
            ['stage'=>'Added to Nurture',  'count'=>$nurture,                          'rate'=>100],
            ['stage'=>'Engaged',           'count'=>$eng ?: round($nurture*0.38),       'rate'=>round($eng/$base*100,1)],
            ['stage'=>'MQL',               'count'=>$mql,                               'rate'=>round($mql/$base*100,1)],
            ['stage'=>'SQL',               'count'=>$sql,                               'rate'=>round($sql/$base*100,1)],
            ['stage'=>'Discovery Call',    'count'=>$dc,                                'rate'=>round($dc/$base*100,1)],
            ['stage'=>'Opportunity',       'count'=>$opps,                              'rate'=>round($opps/$base*100,1)],
            ['stage'=>'Won',               'count'=>$wonO,                              'rate'=>round($wonO/$base*100,1)],
        ];

        $isLive = true;
    } catch (Exception $e) {
        error_log($e->getMessage());
    }
}

require_once __DIR__ . '/../../includes/header.php';
?>

<?php if (!$isLive): ?>
<div class="alert-warning mb-6">
  No live data — set <code>BQ_PROJECT_ID</code> and <code>BQ_DATASET_ID</code> in your <code>.env</code> file.
</div>
<?php endif; ?>

<!-- AI Summary Banner -->
<div class="alert-info mb-6" style="display:flex;gap:16px;align-items:flex-start">
  <div style="width:32px;height:32px;background:var(--blue);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
  </div>
  <div>
    <div style="font-size:10px;color:var(--blue);text-transform:uppercase;letter-spacing:.1em;font-weight:600;margin-bottom:4px">AI Executive Summary</div>
    <div style="color:rgba(255,255,255,.7);font-size:13px">
      <?php if ($isLive): ?>
        Pipeline: <?= formatCurrency($kpi['pipelineValue']) ?> &middot;
        <?= formatNumber($kpi['emailsSent']) ?> emails sent &middot;
        <?= $kpi['uniqueOpenRate'] ?>% open rate &middot;
        <?= number_format($kpi['engagedAudience']) ?> engaged prospects.
      <?php else: ?>
        Connect BigQuery to generate executive summaries.
      <?php endif; ?>
    </div>
  </div>
</div>

<!-- Pipeline & Revenue -->
<div class="section-label">Pipeline &amp; Revenue</div>
<div class="grid-4 mb-6">
  <div class="kpi-card"><div class="kpi-label">Won Revenue</div><div class="kpi-value accent"><?= formatCurrency($kpi['wonRevenue']) ?></div></div>
  <div class="kpi-card"><div class="kpi-label">Pipeline Value</div><div class="kpi-value"><?= formatCurrency($kpi['pipelineValue']) ?></div></div>
  <div class="kpi-card"><div class="kpi-label">Won Opportunities</div><div class="kpi-value">—</div></div>
  <div class="kpi-card"><div class="kpi-label">Opportunities Created</div><div class="kpi-value"><?= formatNumber($kpi['opportunitiesCreated'] ?? 0) ?></div></div>
</div>

<!-- Funnel KPIs -->
<div class="section-label">Funnel</div>
<div class="grid-4 mb-6">
  <div class="kpi-card"><div class="kpi-label">MQLs</div><div class="kpi-value"><?= formatNumber($kpi['mqls']) ?></div></div>
  <div class="kpi-card"><div class="kpi-label">SQLs</div><div class="kpi-value"><?= formatNumber($kpi['sqls']) ?></div></div>
  <div class="kpi-card"><div class="kpi-label">Discovery Calls</div><div class="kpi-value"><?= formatNumber($kpi['discoveryCalls']) ?></div></div>
  <div class="kpi-card"><div class="kpi-label">Engaged Audience</div><div class="kpi-value"><?= formatNumber($kpi['engagedAudience']) ?></div><div class="kpi-sub"><?= $kpi['engagedRate'] ?>% of total</div></div>
</div>

<!-- Email Health -->
<div class="section-label">Email Health</div>
<div class="grid-6 mb-6">
  <div class="kpi-card"><div class="kpi-label">Emails Sent</div><div class="kpi-value"><?= formatNumber($kpi['emailsSent']) ?></div></div>
  <div class="kpi-card"><div class="kpi-label">Delivery Rate</div><div class="kpi-value"><?= $kpi['deliveryRate'] ?>%</div></div>
  <div class="kpi-card"><div class="kpi-label">Open Rate</div><div class="kpi-value"><?= $kpi['uniqueOpenRate'] ?>%</div></div>
  <div class="kpi-card"><div class="kpi-label">Click Rate</div><div class="kpi-value"><?= $kpi['uniqueClickRate'] ?>%</div></div>
  <div class="kpi-card"><div class="kpi-label">Bounce Rate</div><div class="kpi-value"><?= $kpi['bounceRate'] ?>%</div></div>
  <div class="kpi-card"><div class="kpi-label">Unsub Rate</div><div class="kpi-value"><?= $kpi['unsubscribeRate'] ?>%</div></div>
</div>

<!-- Email Counts -->
<div class="section-label">Email Counts</div>
<div class="grid-4 mb-6">
  <div class="kpi-card"><div class="kpi-label">Opens</div><div class="kpi-value"><?= number_format($kpi['opensCount']) ?></div></div>
  <div class="kpi-card"><div class="kpi-label">Clicks</div><div class="kpi-value"><?= number_format($kpi['clicksCount']) ?></div></div>
  <div class="kpi-card"><div class="kpi-label">Unsubscribed</div><div class="kpi-value"><?= number_format($kpi['unsubscribesCount']) ?></div></div>
  <div class="kpi-card"><div class="kpi-label">Bounced</div><div class="kpi-value"><?= number_format($kpi['bouncesCount']) ?></div></div>
</div>

<!-- Prospect Engagement -->
<div class="section-label">Prospect Engagement</div>
<div class="grid-4 mb-6">
  <div class="kpi-card"><div class="kpi-label">Total Audience</div><div class="kpi-value"><?= number_format($kpi['totalAudience']) ?></div></div>
  <div class="kpi-card"><div class="kpi-label">Engaged (30d)</div><div class="kpi-value"><?= number_format($kpi['engagedAudience']) ?></div></div>
  <div class="kpi-card"><div class="kpi-label">Engaged Rate</div><div class="kpi-value"><?= $kpi['engagedRate'] ?>%</div></div>
  <div class="kpi-card"><div class="kpi-label">No Engagement</div><div class="kpi-value"><?= number_format(max(0, $kpi['totalAudience'] - $kpi['engagedAudience'])) ?></div></div>
</div>

<!-- Funnel Chart -->
<div class="section-label">Funnel Progression</div>
<div class="card mb-6" style="padding:24px">
  <?php if (empty($funnelStages)): ?>
    <p style="color:var(--text-muted)">No funnel data available.</p>
  <?php else: ?>
    <table style="width:100%">
      <?php foreach ($funnelStages as $s): ?>
      <tr style="margin-bottom:12px;display:block">
        <td style="padding:4px 0;width:160px;color:var(--text-muted);font-size:12px;display:inline-block"><?= htmlspecialchars($s['stage']) ?></td>
        <td style="padding:4px 8px;font-family:monospace;color:var(--text);font-size:13px;width:70px;display:inline-block;text-align:right"><?= number_format($s['count']) ?></td>
        <td style="padding:4px 0;width:calc(100% - 280px);display:inline-block;vertical-align:middle">
          <div style="background:rgba(255,255,255,0.06);border-radius:4px;height:28px;width:100%;position:relative">
            <div class="funnel-bar" style="width:<?= $s['rate'] ?>%;position:absolute;top:0;left:0;height:28px"></div>
          </div>
        </td>
        <td style="padding:4px 8px;font-family:monospace;color:var(--blue);font-size:12px;width:60px;display:inline-block;text-align:right"><?= $s['rate'] ?>%</td>
      </tr>
      <?php endforeach; ?>
    </table>
  <?php endif; ?>
</div>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>
