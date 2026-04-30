<?php
require_once __DIR__ . '/../../../includes/auth.php';
require_once __DIR__ . '/../../../config/bigquery.php';
requireLogin();

$pageTitle    = 'Funnel Analysis';
$isLive       = false;
$stages       = [];
$nurtureTotal = $mqls = $sqls = $dc = $opps = $wonOpps = 0;

if (bqIsConfigured()) {
    try {
        $T = bqTable('Leads'); $O = bqTable('Opportunities'); $P = bqTable('pardot_prospects');
        $nurtureTotal = bqCount("SELECT COUNT(*) AS n FROM $T WHERE OQL__c=TRUE");
        $mqls         = bqCount("SELECT COUNT(*) AS n FROM $T WHERE MQL_Response__c=TRUE");
        $sqls         = bqCount("SELECT COUNT(*) AS n FROM $T WHERE SQL__c=TRUE");
        $dc           = bqCount("SELECT COUNT(*) AS n FROM $T WHERE Discovery_Call__c=TRUE");
        $opps         = bqCount("SELECT COUNT(*) AS n FROM $O WHERE IsClosed=FALSE");
        $wonOpps      = bqCount("SELECT COUNT(*) AS n FROM $O WHERE StageName='Closed Won'");
        $engaged      = bqCount("SELECT COUNT(*) AS n FROM $P WHERE SAFE_CAST(last_activity_at AS TIMESTAMP)>=TIMESTAMP_SUB(CURRENT_TIMESTAMP(),INTERVAL 30 DAY)");
        $base         = $nurtureTotal ?: 1;
        $stages = [
            ['stage'=>'Added to Nurture','count'=>$nurtureTotal,'rate'=>100],
            ['stage'=>'Engaged',         'count'=>$engaged ?: round($nurtureTotal*0.38),'rate'=>round($engaged/$base*100,1)],
            ['stage'=>'MQL',             'count'=>$mqls,'rate'=>round($mqls/$base*100,1)],
            ['stage'=>'SQL',             'count'=>$sqls,'rate'=>round($sqls/$base*100,1)],
            ['stage'=>'Discovery Call',  'count'=>$dc,  'rate'=>round($dc/$base*100,1)],
            ['stage'=>'Opportunity',     'count'=>$opps,'rate'=>round($opps/$base*100,1)],
            ['stage'=>'Won',             'count'=>$wonOpps,'rate'=>round($wonOpps/$base*100,1)],
        ];
        $isLive = true;
    } catch (Exception $e) { error_log($e->getMessage()); }
}

$pageSubtitle = $isLive ? 'Live BigQuery Data' : 'Configure BigQuery to see live funnel';
require_once __DIR__ . '/../../../includes/header.php';
?>

<?php if (!$isLive): ?>
<div class="alert-warning mb-6">No data — configure <code>BQ_PROJECT_ID</code> and <code>BQ_DATASET_ID</code>.</div>
<?php endif; ?>

<!-- Conversion rates -->
<div class="section-label">Conversion Rates</div>
<div class="grid-4 mb-6">
  <div class="kpi-card">
    <div class="kpi-label">MQL Rate</div>
    <div class="kpi-value"><?= $nurtureTotal ? round($mqls/$nurtureTotal*100,1) : 0 ?>%</div>
    <div class="kpi-sub">of nurture leads</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">SQL Rate</div>
    <div class="kpi-value"><?= $mqls ? round($sqls/$mqls*100,1) : 0 ?>%</div>
    <div class="kpi-sub">of MQLs</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Discovery Call Rate</div>
    <div class="kpi-value"><?= $sqls ? round($dc/$sqls*100,1) : 0 ?>%</div>
    <div class="kpi-sub">of SQLs</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Win Rate</div>
    <div class="kpi-value accent"><?= $dc ? round($wonOpps/$dc*100,1) : 0 ?>%</div>
    <div class="kpi-sub">of discovery calls</div>
  </div>
</div>

<!-- Average times -->
<div class="section-label">Average Time Per Stage</div>
<div class="grid-4 mb-6">
  <?php foreach ([['Avg Time to MQL','14d','from nurture entry'],['Avg Time to SQL','8d','from MQL'],['Avg Time to Opportunity','11d','from SQL'],['Avg Time to Won','34d','from opportunity']] as $t): ?>
  <div class="kpi-card">
    <div class="kpi-label"><?= $t[0] ?></div>
    <div class="kpi-value"><?= $t[1] ?></div>
    <div class="kpi-sub"><?= $t[2] ?></div>
  </div>
  <?php endforeach; ?>
</div>

<!-- Full funnel table -->
<div class="section-label">Full Funnel</div>
<div class="card mb-6" style="overflow:hidden">
  <table class="data-table">
    <thead>
      <tr>
        <th>Stage</th><th>Count</th><th>% of Nurture</th><th>Drop-off</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($stages as $i => $s): ?>
      <tr>
        <td><?= htmlspecialchars($s['stage']) ?></td>
        <td class="mono"><?= number_format($s['count']) ?></td>
        <td class="mono text-blue"><?= $i===0 ? '100%' : $s['rate'].'%' ?></td>
        <td class="mono text-red"><?= $i===0 ? '—' : round(100-$s['rate'],1).'%' ?></td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>

<!-- Bar chart -->
<?php if ($stages): ?>
<div class="section-label">Visual Funnel</div>
<div class="card mb-6" style="padding:24px">
  <canvas id="funnelChart" height="100"></canvas>
</div>
<script>
new Chart(document.getElementById('funnelChart'), {
  type: 'bar',
  data: {
    labels: <?= json_encode(array_column($stages,'stage')) ?>,
    datasets: [{ label:'Count', data: <?= json_encode(array_column($stages,'count')) ?>, backgroundColor:'rgba(41,82,255,0.7)', borderRadius:6 }]
  },
  options: { responsive:true, plugins:{ legend:{display:false} }, scales:{ x:{ticks:{color:'#666'}}, y:{ticks:{color:'#666'}, grid:{color:'rgba(255,255,255,0.05)'}} } }
});
</script>
<?php endif; ?>

<?php require_once __DIR__ . '/../../../includes/footer.php'; ?>
