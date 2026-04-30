<?php
require_once __DIR__ . '/env.php';

use Google\Cloud\BigQuery\BigQueryClient;

function getBqClient(): BigQueryClient {
    static $client = null;
    if ($client) return $client;

    $projectId   = $_ENV['BQ_PROJECT_ID'] ?? '';
    $credentials = json_decode($_ENV['BQ_CREDENTIALS_JSON'] ?? '{}', true);

    $client = new BigQueryClient([
        'projectId' => $projectId,
        'keyFile'   => $credentials,
    ]);
    return $client;
}

function bqTable(string $table): string {
    $project = $_ENV['BQ_PROJECT_ID'] ?? '';
    $dataset = $_ENV['BQ_DATASET_ID'] ?? '';
    return "`{$project}.{$dataset}.{$table}`";
}

function bqQuery(string $sql): array {
    try {
        $bq      = getBqClient();
        $results = $bq->runQuery($bq->query($sql));
        $rows    = [];
        foreach ($results as $row) $rows[] = $row;
        return $rows;
    } catch (Exception $e) {
        error_log('[BigQuery] ' . $e->getMessage());
        return [];
    }
}

function bqCount(string $sql): int {
    $rows = bqQuery($sql);
    return (int)($rows[0]['n'] ?? 0);
}

function bqSum(string $sql): float {
    $rows = bqQuery($sql);
    return (float)($rows[0]['n'] ?? 0);
}

function bqIsConfigured(): bool {
    return !empty($_ENV['BQ_PROJECT_ID']) && !empty($_ENV['BQ_DATASET_ID']);
}

function pct(float $num, float $den, int $decimals = 1): float {
    if (!$den) return 0;
    return round(($num / $den) * 100, $decimals);
}

// Email activity type conditions for pardot_userActivities
const IS_EMAIL_SENT   = "LOWER(type_name) IN ('email','sent email','send email','email sent','list email sent','mass email sent','email send')";
const IS_EMAIL_OPEN   = "LOWER(type_name) IN ('email open','email opened','view email','viewed email','email view','open email')";
const IS_EMAIL_CLICK  = "LOWER(type_name) IN ('email click','email clicked','click email','clicked email','email link click')";
const IS_EMAIL_BOUNCE = "LOWER(type_name) IN ('email bounce','bounced email','hard bounce','soft bounce','email hard bounce','email soft bounce','bounce email')";
const IS_EMAIL_UNSUB  = "LOWER(type_name) IN ('email unsubscribe','email unsubscribed','unsubscribe email','opt out','email opt out')";
const IS_EMAIL_SPAM   = "LOWER(type_name) LIKE '%spam%'";
