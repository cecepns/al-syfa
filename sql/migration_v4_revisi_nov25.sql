-- =======================================================================
-- MIGRATION SCRIPT: REVISI FITUR SALES, ADMIN & OWNER (V4)
-- Tanggal: 2026-11-25
-- Kompatibel: MySQL 5.7, MySQL 8.0, MariaDB 10.x, cPanel phpMyAdmin
-- =======================================================================

-- -----------------------------------------------------------------------
-- 1. MODIFIKASI TABEL USERS: Jadwal Jam Masuk & Pulang Per Sales
-- -----------------------------------------------------------------------
ALTER TABLE `users`
  ADD COLUMN `work_start_time` TIME NOT NULL DEFAULT '08:00:00' AFTER `vehicle_number`,
  ADD COLUMN `work_end_time` TIME NOT NULL DEFAULT '15:00:00' AFTER `work_start_time`;

-- -----------------------------------------------------------------------
-- 2. MODIFIKASI TABEL CUSTOMERS: Label Toko / Outlet Baru
-- Catatan: Kolom `is_active` (aktif/tidak aktif) & `notes` (keterangan)
-- sudah tersedia pada tabel `customers`.
-- -----------------------------------------------------------------------
ALTER TABLE `customers`
  ADD COLUMN `store_label` VARCHAR(50) NULL DEFAULT NULL AFTER `shop_type`;

-- -----------------------------------------------------------------------
-- 3. TABEL BARU: Master Kota / Cabang (branch_cities)
-- Digunakan Owner untuk menambah kota/cabang (All Jawa Timur & lainnya)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `branch_cities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `city_name` VARCHAR(100) NOT NULL UNIQUE,
  `province_name` VARCHAR(100) NOT NULL DEFAULT 'Jawa Timur',
  `regency_code` VARCHAR(20) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` VARCHAR(255) NULL,
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default wilayah aktif awal
INSERT IGNORE INTO `branch_cities` (`city_name`, `province_name`, `regency_code`, `is_active`)
VALUES
  ('Kabupaten Bogor', 'Jawa Barat', '32.01', 1),
  ('Kota Surabaya', 'Jawa Timur', '35.78', 1),
  ('Kabupaten Sidoarjo', 'Jawa Timur', '35.15', 1),
  ('Kota Malang', 'Jawa Timur', '35.73', 1);

-- =======================================================================
-- MIGRATION V4 SELESAI
-- =======================================================================
