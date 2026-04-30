CREATE DATABASE IF NOT EXISTS nurture CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nurture;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('SUPER_ADMIN','ADMIN','EXECUTIVE','NURTURE_OPS','SALES_LEADERSHIP') NOT NULL DEFAULT 'NURTURE_OPS',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS benchmarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metric VARCHAR(255) NOT NULL UNIQUE,
  label VARCHAR(255),
  warning_threshold FLOAT,
  critical_threshold FLOAT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO benchmarks (metric, label, warning_threshold, critical_threshold) VALUES
  ('signal_hot_threshold',   'Hot Signal Open Rate %',    20, 30),
  ('signal_warm_threshold',  'Warm Signal Open Rate %',   12, 20),
  ('signal_cold_threshold',  'Cold Signal Open Rate %',    5, 12),
  ('signal_atrisk_bounce',   'At-Risk Bounce Rate %',      5, 10),
  ('delivery_rate_warning',  'Delivery Rate Warning %',   95, 98),
  ('bounce_rate_warning',    'Bounce Rate Warning %',      3,  5),
  ('unsub_rate_warning',     'Unsubscribe Rate Warning %', 1,  2);

-- Default admin user (password: admin123 — change immediately)
INSERT IGNORE INTO users (name, email, password, role) VALUES
  ('Admin', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'SUPER_ADMIN');
