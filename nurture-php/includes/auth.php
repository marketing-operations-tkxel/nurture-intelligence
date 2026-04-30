<?php
require_once __DIR__ . '/../config/db.php';

function requireLogin(): void {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (empty($_SESSION['user_id'])) {
        header('Location: /login.php');
        exit;
    }
}

function currentUser(): ?array {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (empty($_SESSION['user_id'])) return null;
    return [
        'id'   => $_SESSION['user_id'],
        'name' => $_SESSION['user_name'],
        'role' => $_SESSION['user_role'],
    ];
}

function requireRole(array $roles): void {
    requireLogin();
    if (!in_array($_SESSION['user_role'], $roles, true)) {
        http_response_code(403);
        echo '<h1>Access Denied</h1>';
        exit;
    }
}

function formatCurrency(float $value): string {
    if ($value >= 1_000_000) return '$' . round($value / 1_000_000, 1) . 'M';
    if ($value >= 1_000)     return '$' . round($value / 1_000, 1) . 'K';
    return '$' . number_format($value);
}

function formatNumber(float $value): string {
    if ($value >= 1_000_000) return round($value / 1_000_000, 1) . 'M';
    if ($value >= 1_000)     return round($value / 1_000, 1) . 'K';
    return number_format($value);
}

function formatPercent(float $value): string {
    return $value . '%';
}
