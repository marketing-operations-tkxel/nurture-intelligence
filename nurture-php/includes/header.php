<?php
require_once __DIR__ . '/auth.php';
$user = currentUser();
$currentPage = basename($_SERVER['PHP_SELF']);
$currentPath = $_SERVER['REQUEST_URI'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title><?= htmlspecialchars($pageTitle ?? 'Nurture Intelligence') ?></title>
  <link rel="stylesheet" href="/assets/css/style.css" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>

<!-- Sidebar -->
<aside class="sidebar">
  <div class="sidebar-logo">
    <h1>Nurture Intel</h1>
    <p>Marketing Intelligence</p>
  </div>

  <nav>
    <div class="nav-section">
      <div class="nav-label">Overview</div>
      <a href="/pages/executive.php" class="nav-link <?= str_contains($currentPath, 'executive') ? 'active' : '' ?>">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
        Executive
      </a>
    </div>

    <div class="nav-section">
      <div class="nav-label">Operations</div>
      <a href="/pages/ops/contacts.php" class="nav-link <?= str_contains($currentPath, 'contacts') ? 'active' : '' ?>">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
        Contacts
      </a>
      <a href="/pages/ops/funnel.php" class="nav-link <?= str_contains($currentPath, 'funnel') ? 'active' : '' ?>">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 18h4v-2h-4v2zm-7-6v2h18v-2H3zM6 8v2h12V8H6z"/></svg>
        Funnel
      </a>
      <a href="/pages/ops/segments.php" class="nav-link <?= str_contains($currentPath, 'segments') ? 'active' : '' ?>">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
        Segments
      </a>
      <a href="/pages/ops/sequences.php" class="nav-link <?= str_contains($currentPath, 'sequences') ? 'active' : '' ?>">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        Sequences
      </a>
    </div>

    <?php if (in_array($user['role'] ?? '', ['SUPER_ADMIN','ADMIN'])): ?>
    <div class="nav-section">
      <div class="nav-label">Admin</div>
      <a href="/pages/admin/benchmarks.php" class="nav-link <?= str_contains($currentPath, 'benchmarks') ? 'active' : '' ?>">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
        Benchmarks
      </a>
      <a href="/pages/admin/users.php" class="nav-link <?= str_contains($currentPath, 'users') ? 'active' : '' ?>">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        Users
      </a>
    </div>
    <?php endif; ?>
  </nav>

  <div class="sidebar-footer">
    <div><?= htmlspecialchars($user['name'] ?? '') ?></div>
    <div style="font-size:10px;margin-top:2px;text-transform:uppercase;letter-spacing:.05em"><?= htmlspecialchars($user['role'] ?? '') ?></div>
    <a href="/logout.php" style="display:inline-block;margin-top:8px;color:var(--red);font-size:12px;text-decoration:none;">Sign out</a>
  </div>
</aside>

<div class="main-wrap">
  <div class="page-header">
    <div>
      <h2><?= htmlspecialchars($pageTitle ?? '') ?></h2>
      <p><?= htmlspecialchars($pageSubtitle ?? '') ?></p>
    </div>
    <span class="user-badge"><?= htmlspecialchars($user['role'] ?? '') ?></span>
  </div>
  <div class="page-content">
