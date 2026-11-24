-- =======================================================================
-- MIGRATION SCRIPT: REVISI FITUR SALES, ADMIN & OWNER (V3)
-- Tanggal: 2026-11-24
-- Kompatibel: MySQL 5.7, MySQL 8.0, MariaDB 10.x, cPanel phpMyAdmin
-- =======================================================================

-- Aktifkan jika dijalankan di CLI lokal (opsional untuk phpMyAdmin):
-- USE `alsyifa_sales_db`;

-- -----------------------------------------------------------------------
-- 1. MODIFIKASI TABEL USERS (Opsional): Kolom google_id
-- Catatan: Login Google tidak diwajibkan sesuai note client.
-- -----------------------------------------------------------------------
-- ALTER TABLE `users` ADD COLUMN `google_id` VARCHAR(100) NULL AFTER `email`;

-- -----------------------------------------------------------------------
-- 2. TABEL BARU: Target Penjualan Mingguan & Bulanan Sales (sales_targets)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sales_targets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sales_id` INT NOT NULL,
  `month` VARCHAR(7) NOT NULL, -- Format: YYYY-MM (e.g. '2026-11')
  `week_number` TINYINT NOT NULL, -- 1, 2, 3, 4
  `target_pack` INT NOT NULL DEFAULT 0,
  `target_dus` INT NOT NULL DEFAULT 0,
  `target_rupiah` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_sales_month_week` (`sales_id`, `month`, `week_number`),
  FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Sample Target Mingguan Sales untuk November 2026
-- Budi Santoso (ID: 4) & Ahmad Fauzi (ID: 3)
INSERT INTO `sales_targets` (`sales_id`, `month`, `week_number`, `target_pack`, `target_dus`, `target_rupiah`, `notes`)
VALUES
  (4, '2026-11', 1, 350, 15, 4500000.00, 'Target Minggu 1 Wilayah Cibinong'),
  (4, '2026-11', 2, 400, 18, 5200000.00, 'Target Minggu 2 Wilayah Sukaraja'),
  (4, '2026-11', 3, 450, 20, 6000000.00, 'Target Minggu 3 Wilayah Bojonggede'),
  (4, '2026-11', 4, 500, 22, 6800000.00, 'Target Minggu 4 Wilayah Citeureup'),
  (3, '2026-11', 1, 250, 10, 3200000.00, 'Target Sales Motoris Minggu 1'),
  (3, '2026-11', 2, 300, 12, 3800000.00, 'Target Sales Motoris Minggu 2'),
  (3, '2026-11', 3, 320, 14, 4200000.00, 'Target Sales Motoris Minggu 3'),
  (3, '2026-11', 4, 380, 16, 4800000.00, 'Target Sales Motoris Minggu 4')
ON DUPLICATE KEY UPDATE
  `target_pack` = VALUES(`target_pack`),
  `target_dus` = VALUES(`target_dus`),
  `target_rupiah` = VALUES(`target_rupiah`);

-- -----------------------------------------------------------------------
-- 3. TABEL BARU: Target & Akumulasi Bulanan per Kategori Kota (city_targets)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `city_targets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `city_name` VARCHAR(100) NOT NULL,
  `month` VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  `target_pack` INT NOT NULL DEFAULT 0,
  `target_dus` INT NOT NULL DEFAULT 0,
  `target_rupiah` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_city_month` (`city_name`, `month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Sample Target Kota untuk November 2026
INSERT INTO `city_targets` (`city_name`, `month`, `target_pack`, `target_dus`, `target_rupiah`, `notes`)
VALUES
  ('Kabupaten Bogor', '2026-11', 1800, 80, 25000000.00, 'Target Bulanan Wilayah Kabupaten Bogor'),
  ('Kota Bogor', '2026-11', 1200, 55, 16500000.00, 'Target Bulanan Wilayah Kota Bogor'),
  ('Kota Depok', '2026-11', 950, 40, 13000000.00, 'Target Bulanan Wilayah Depok')
ON DUPLICATE KEY UPDATE
  `target_pack` = VALUES(`target_pack`),
  `target_dus` = VALUES(`target_dus`),
  `target_rupiah` = VALUES(`target_rupiah`);

-- -----------------------------------------------------------------------
-- 4. TABEL BARU: Setoran Harian Sales & Potongan Tunjangan (daily_deposits)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `daily_deposits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `deposit_number` VARCHAR(50) NOT NULL UNIQUE,
  `sales_id` INT NOT NULL,
  `deposit_date` DATE NOT NULL,
  `total_sales_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `operational_allowance_deduction` DECIMAL(15,2) NOT NULL DEFAULT 30000.00,
  `net_deposit_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `deposit_method` ENUM('tunai', 'transfer') NOT NULL DEFAULT 'tunai',
  `bank_name` VARCHAR(50) NULL,
  `proof_image` VARCHAR(255) NULL,
  `status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'verified',
  `verified_by` INT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Sample Data Setoran Harian
-- Contoh: Penjualan 400.000 - Tunjangan 30.000 = Setoran 360.000
INSERT INTO `daily_deposits` (`id`, `deposit_number`, `sales_id`, `deposit_date`, `total_sales_amount`, `operational_allowance_deduction`, `net_deposit_amount`, `deposit_method`, `bank_name`, `proof_image`, `status`, `notes`)
VALUES
  (1, 'DEP-202611-0001', 4, CURRENT_DATE(), 400000.00, 30000.00, 360000.00, 'tunai', NULL, NULL, 'verified', 'Setoran sore Van Sales 1 (Penjualan Rp 400.000 - Tunjangan Ops Rp 30.000)'),
  (2, 'DEP-202611-0002', 3, CURRENT_DATE(), 520000.00, 30000.00, 490000.00, 'transfer', 'BCA', '/uploads/bukti-transfer-bca.png', 'verified', 'Setoran via transfer BCA Motoris Ahmad Fauzi')
ON DUPLICATE KEY UPDATE
  `total_sales_amount` = VALUES(`total_sales_amount`),
  `net_deposit_amount` = VALUES(`net_deposit_amount`);

-- =======================================================================
-- MIGRATION V3 SELESAI
-- =======================================================================
