-- =======================================================================
-- MIGRATION SCRIPT: REVISI FITUR & STRUKTUR TABEL ALSYFA (V2)
-- Sesuai Dokumen Revisi Client: "Penulisan Yang Benar ALSYFA"
-- Tanggal: 2026-11-24
-- Database: alsyifa_sales_db
-- =======================================================================

USE `alsyifa_sales_db`;

-- -----------------------------------------------------------------------
-- 1. MODIFIKASI TABEL USERS: Penambahan Role 'owner'
-- -----------------------------------------------------------------------
ALTER TABLE `users` 
  MODIFY COLUMN `role` ENUM('owner', 'admin', 'supervisor', 'sales') NOT NULL DEFAULT 'sales';

-- Tambahkan Akun Default Owner jika belum ada
INSERT INTO `users` (`id`, `name`, `username`, `email`, `password`, `role`, `phone`, `avatar`, `vehicle_type`, `vehicle_number`, `is_active`)
VALUES 
  (6, 'Bapak H. Alamsyah (Owner ALSYFA)', 'owner', 'owner@alsyfa.com', '$2a$10$wN1qVd8N1qVd8N1qVd8N1eK6g9J6QhJk3k1e5y5r5w1qVd8N1qVd.', 'owner', '081122334455', '/uploads/avatar-spv.png', 'mobil_box', 'B 1 ALSYFA', 1)
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `role` = 'owner';


-- -----------------------------------------------------------------------
-- 2. TABEL BARU: Master Kategori Produk (product_categories)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Kategori Default Snack Coklat
INSERT INTO `product_categories` (`id`, `name`, `description`)
VALUES 
  (1, 'SNACK COKLAT', 'Aneka produk olahan coklat premium ALSYFA'),
  (2, 'SNACK LAINNYA', 'Aneka cemilan gurih dan snack renyah pelengkap')
ON DUPLICATE KEY UPDATE 
  `description` = VALUES(`description`);


-- -----------------------------------------------------------------------
-- 3. MODIFIKASI TABEL CUSTOMERS: Penambahan sales_id untuk relasi Toko -> Sales
-- -----------------------------------------------------------------------
-- Cek dan tambahkan kolom sales_id jika belum ada
SET @dbname = DATABASE();
SET @tablename = 'customers';
SET @columnname = 'sales_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `customers` ADD COLUMN `sales_id` INT NULL AFTER `code`, ADD CONSTRAINT `fk_customers_sales` FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Hubungkan sample customer ke sales aktif jika masih kosong
UPDATE `customers` SET `sales_id` = 3 WHERE `sales_id` IS NULL AND `id` IN (1, 3);
UPDATE `customers` SET `sales_id` = 4 WHERE `sales_id` IS NULL AND `id` IN (2, 4);


-- -----------------------------------------------------------------------
-- 4. MODIFIKASI TABEL ROUTES: Penambahan Hari Kerja 'minggu' (Senin - Minggu)
-- -----------------------------------------------------------------------
ALTER TABLE `routes` 
  MODIFY COLUMN `day_of_week` ENUM('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu') NOT NULL;

-- Tambahkan Jadwal Rute Hari Minggu jika belum ada
INSERT INTO `routes` (`id`, `sales_id`, `day_of_week`, `province_name`, `regency_name`, `district_code`, `district_name`, `village_codes`, `village_names`, `notes`, `is_active`)
VALUES 
  (7, 4, 'minggu', 'Jawa Barat', 'Kabupaten Bogor', '32.01.01', 'Cibinong', '["32.01.01.1001", "32.01.01.1002"]', 'Cirimekar, Ciriung', 'Rute toko retail dan minimarket buka akhir pekan', 1)
ON DUPLICATE KEY UPDATE 
  `day_of_week` = 'minggu';


-- -----------------------------------------------------------------------
-- 5. TABEL BARU: Tunjangan Operasional Sales (operational_allowances)
-- Rp 30.000 / Hari (BBM Rp 20.000 + Sewa Motor Rp 10.000) Terakumulasi Bulanan
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `operational_allowances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sales_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `bbm_amount` DECIMAL(12, 2) NOT NULL DEFAULT 20000.00,
  `motor_rent_amount` DECIMAL(12, 2) NOT NULL DEFAULT 10000.00,
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 30000.00,
  `status` ENUM('pending', 'approved', 'paid') DEFAULT 'pending',
  `paid_date` TIMESTAMP NULL,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_sales_date` (`sales_id`, `date`),
  FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Sample Data Tunjangan Operasional untuk Sales
INSERT INTO `operational_allowances` (`id`, `sales_id`, `date`, `bbm_amount`, `motor_rent_amount`, `total_amount`, `status`, `paid_date`, `notes`)
VALUES 
  (1, 4, '2026-11-24', 20000.00, 10000.00, 30000.00, 'approved', NULL, 'Tunjangan operasional harian sales van'),
  (2, 3, '2026-11-24', 20000.00, 10000.00, 30000.00, 'approved', NULL, 'Tunjangan operasional harian sales motoris')
ON DUPLICATE KEY UPDATE 
  `total_amount` = 30000.00;


-- -----------------------------------------------------------------------
-- 6. PEMBARUAN DATA PRODUK: Transisi ke SNACK COKLAT ALSYFA
-- -----------------------------------------------------------------------
-- Update atau insert produk snack coklat ALSYFA
INSERT INTO `products` (`id`, `code`, `name`, `category`, `unit`, `cost_price`, `price`, `warehouse_stock`, `image`, `description`, `is_active`)
VALUES
  (1, 'SNK-001', 'ALSYFA Choco Bar Crunchy 45g', 'SNACK COKLAT', 'pcs', 7000.00, 10000.00, 500, '/uploads/product-choco-bar.png', 'Coklat batang lezat dengan rice crispy renyah berkualitas.', 1),
  (2, 'SNK-002', 'ALSYFA Wafer Roll Chocolate 120g', 'SNACK COKLAT', 'kaleng', 15000.00, 22000.00, 350, '/uploads/product-wafer-roll.png', 'Wafer roll renyah isi krim coklat tebal premium.', 1),
  (3, 'SNK-003', 'ALSYFA Choco Ball Crispy 80g', 'SNACK COKLAT', 'pouch', 9000.00, 13500.00, 420, '/uploads/product-choco-ball.png', 'Bola biskuit coklat renyah bersalut coklat manis gurih.', 1),
  (4, 'SNK-004', 'ALSYFA Biscuit Sandwich Coklat 100g', 'SNACK COKLAT', 'bungkus', 6500.00, 9500.00, 600, '/uploads/product-sandwich.png', 'Biskuit lapis dengan krim coklat nikmat untuk camilan harian.', 1),
  (5, 'SNK-005', 'ALSYFA Coklat Mete Premium Box', 'SNACK COKLAT', 'box', 32000.00, 45000.00, 180, '/uploads/product-choco-mete.png', 'Coklat spesial dengan taburan kacang mete panggang gurih.', 1),
  (6, 'SNK-006', 'ALSYFA Keripik Kentang Keju Gurih 60g', 'SNACK LAINNYA', 'pouch', 8000.00, 12000.00, 250, '/uploads/product-chips.png', 'Keripik kentang renyah dengan taburan bumbu keju spesial.', 1),
  (7, 'SNK-007', 'ALSYFA Makaroni Pedas Manis 90g', 'SNACK LAINNYA', 'pouch', 6000.00, 9000.00, 300, '/uploads/product-makaroni.png', 'Makaroni goreng renyah dengan bumbu pedas manis khas.', 1),
  (8, 'SNK-008', 'ALSYFA Cookies Dark Choco 150g', 'SNACK COKLAT', 'box', 18000.00, 26000.00, 220, '/uploads/product-cookies.png', 'Kue kering coklat hitam dengan choco chips melimpah.', 1)
ON DUPLICATE KEY UPDATE 
  `code` = VALUES(`code`),
  `name` = VALUES(`name`),
  `category` = VALUES(`category`),
  `cost_price` = VALUES(`cost_price`),
  `price` = VALUES(`price`),
  `description` = VALUES(`description`);

-- =======================================================================
-- MIGRATION SELESAI DENGAN SUKSES
-- =======================================================================
