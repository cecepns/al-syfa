-- Database Schema for ALSYFA Sales Management App
-- Generated for MySQL

CREATE DATABASE IF NOT EXISTS `alsyifa_sales_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `alsyifa_sales_db`;

-- Drop tables in reverse order of foreign keys
DROP TABLE IF EXISTS `operational_allowances`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `promotions`;
DROP TABLE IF EXISTS `attendances`;
DROP TABLE IF EXISTS `sales_locations`;
DROP TABLE IF EXISTS `visits`;
DROP TABLE IF EXISTS `van_stock_logs`;
DROP TABLE IF EXISTS `van_stocks`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `product_categories`;
DROP TABLE IF EXISTS `route_customers`;
DROP TABLE IF EXISTS `routes`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `users`;

-- 17. Company Settings (Pengaturan Modal Kas & Cadangan Usaha Owner)
CREATE TABLE `company_settings` (
  `setting_key` VARCHAR(50) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `company_settings` (`setting_key`, `setting_value`) VALUES
('additional_cash_capital', '0');
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('owner', 'admin', 'supervisor', 'sales') NOT NULL DEFAULT 'sales',
  `phone` VARCHAR(25) NULL,
  `avatar` VARCHAR(255) NULL,
  `vehicle_type` ENUM('motor', 'van', 'mobil_box') DEFAULT 'van',
  `vehicle_number` VARCHAR(30) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Customers Table (Toko / Outlet: KOTA - KECAMATAN - DESA)
CREATE TABLE `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(30) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `owner_name` VARCHAR(100) NULL,
  `shop_type` ENUM('ritel', 'grosir', 'agen', 'apotek_klinik') NOT NULL DEFAULT 'ritel',
  `phone` VARCHAR(25) NOT NULL,
  `address` TEXT NOT NULL,
  `province_code` VARCHAR(20) NULL,
  `province_name` VARCHAR(100) NULL,
  `regency_code` VARCHAR(20) NULL,
  `regency_name` VARCHAR(100) NULL,
  `district_code` VARCHAR(20) NULL,
  `district_name` VARCHAR(100) NULL,
  `village_code` VARCHAR(30) NULL,
  `village_name` VARCHAR(100) NULL,
  `latitude` DECIMAL(10, 8) NULL,
  `longitude` DECIMAL(11, 8) NULL,
  `image` VARCHAR(255) NULL,
  `credit_limit` DECIMAL(15, 2) DEFAULT 0.00,
  `current_balance` DECIMAL(15, 2) DEFAULT 0.00,
  `notes` TEXT NULL,
  `sales_id` INT NULL,
  `created_by` INT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Routes Table (Pengaturan Rute Harian Senin - Minggu)
CREATE TABLE `routes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sales_id` INT NOT NULL,
  `day_of_week` ENUM('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu') NOT NULL,
  `province_name` VARCHAR(100) DEFAULT 'Jawa Barat',
  `regency_name` VARCHAR(100) DEFAULT 'Kabupaten Bogor',
  `district_code` VARCHAR(20) NULL,
  `district_name` VARCHAR(100) NOT NULL,
  `village_codes` TEXT NULL,
  `village_names` TEXT NULL,
  `notes` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Route Customers Junction Table
CREATE TABLE `route_customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `route_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `visit_order` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Product Categories Table (SNACK COKLAT, SNACK LAINNYA, dll.)
CREATE TABLE `product_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Products Table (Produk Snack Coklat & Snack Lainnya)
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(30) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'SNACK COKLAT',
  `unit` VARCHAR(20) NOT NULL DEFAULT 'pcs',
  `cost_price` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `price` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `warehouse_stock` INT NOT NULL DEFAULT 0,
  `image` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Van Stocks Table (Manajemen Stok Kendaraan Sales)
CREATE TABLE `van_stocks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sales_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `initial_stock` INT NOT NULL DEFAULT 0,
  `sold_stock` INT NOT NULL DEFAULT 0,
  `current_stock` INT NOT NULL DEFAULT 0,
  `stock_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_sales_product_date` (`sales_id`, `product_id`, `stock_date`),
  FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Van Stock Logs Table
CREATE TABLE `van_stock_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sales_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `type` ENUM('in_allocation', 'out_sale', 'return_warehouse', 'adjustment') NOT NULL,
  `qty` INT NOT NULL,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Visits Table (GPS Check-In / Check-Out)
CREATE TABLE `visits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sales_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `visit_date` DATE NOT NULL,
  `check_in_time` TIME NOT NULL,
  `check_in_lat` DECIMAL(10, 8) NOT NULL,
  `check_in_lng` DECIMAL(11, 8) NOT NULL,
  `check_in_image` VARCHAR(255) NULL,
  `check_out_time` TIME NULL,
  `check_out_lat` DECIMAL(10, 8) NULL,
  `check_out_lng` DECIMAL(11, 8) NULL,
  `duration_minutes` INT DEFAULT 0,
  `status` ENUM('in_progress', 'completed', 'cancelled') DEFAULT 'in_progress',
  `result_type` ENUM('order', 'follow_up', 'toko_tutup', 'stok_penuh') NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Sales Real-time Location Log
CREATE TABLE `sales_locations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sales_id` INT NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `battery_level` INT NULL,
  `accuracy` DECIMAL(8, 2) NULL,
  `address_note` VARCHAR(255) NULL,
  `recorded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Attendances Table (Absensi Sales 08.00 - 15.00)
CREATE TABLE `attendances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sales_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `clock_in_time` TIME NOT NULL,
  `clock_in_lat` DECIMAL(10, 8) NOT NULL,
  `clock_in_lng` DECIMAL(11, 8) NOT NULL,
  `clock_in_address` VARCHAR(255) NULL,
  `clock_in_image` VARCHAR(255) NULL,
  `clock_out_time` TIME NULL,
  `clock_out_lat` DECIMAL(10, 8) NULL,
  `clock_out_lng` DECIMAL(11, 8) NULL,
  `clock_out_address` VARCHAR(255) NULL,
  `clock_out_image` VARCHAR(255) NULL,
  `status` ENUM('hadir', 'terlambat', 'izin') DEFAULT 'hadir',
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_sales_attendance_date` (`sales_id`, `date`),
  FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Promotions Table (Program Promo Pusat)
CREATE TABLE `promotions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `banner_image` VARCHAR(255) NULL,
  `description` TEXT NOT NULL,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `min_order_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Orders Table (Pencatatan Pesanan & Faktur)
CREATE TABLE `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_number` VARCHAR(50) NOT NULL UNIQUE,
  `sales_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `visit_id` INT NULL,
  `promo_id` INT NULL,
  `order_date` DATE NOT NULL,
  `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `payment_method` ENUM('tunai', 'transfer', 'tempo') NOT NULL DEFAULT 'tunai',
  `payment_status` ENUM('lunas', 'sebagian', 'belum_lunas') NOT NULL DEFAULT 'lunas',
  `paid_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `due_date` DATE NULL,
  `status` ENUM('pending', 'approved', 'delivered', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  `approval_notes` VARCHAR(255) NULL,
  `approved_by` INT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`visit_id`) REFERENCES `visits` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`promo_id`) REFERENCES `promotions` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Order Items Table
CREATE TABLE `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(150) NOT NULL,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'pcs',
  `price` DECIMAL(15, 2) NOT NULL,
  `cost_price` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `qty` INT NOT NULL,
  `discount_percent` DECIMAL(5, 2) DEFAULT 0.00,
  `total_price` DECIMAL(15, 2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Payments Table (Sistem Akuntansi & Pembukuan Kas Masuk)
CREATE TABLE `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_number` VARCHAR(50) NOT NULL UNIQUE,
  `order_id` INT NOT NULL,
  `sales_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `payment_date` DATE NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `payment_method` ENUM('tunai', 'transfer') NOT NULL DEFAULT 'tunai',
  `proof_image` VARCHAR(255) NULL,
  `notes` VARCHAR(255) NULL,
  `received_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Operational Allowances Table (Tunjangan Operasional Sales Rp 30.000 / Hari: BBM Rp 20rb, Sewa Motor Rp 10rb)
CREATE TABLE `operational_allowances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sales_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `bbm_amount` DECIMAL(15, 2) NOT NULL DEFAULT 20000.00,
  `motor_rent_amount` DECIMAL(15, 2) NOT NULL DEFAULT 10000.00,
  `total_amount` DECIMAL(15, 2) NOT NULL DEFAULT 30000.00,
  `status` ENUM('pending', 'approved', 'paid') NOT NULL DEFAULT 'approved',
  `paid_date` DATE NULL,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_sales_allowance_date` (`sales_id`, `date`),
  FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- SEED DATA
-- ========================================================

-- Product Categories
INSERT INTO `product_categories` (`id`, `name`, `description`) VALUES
(1, 'SNACK COKLAT', 'Aneka produk olahan coklat premium Alsyfa'),
(2, 'SNACK LAINNYA', 'Aneka cemilan gurih dan snack renyah pelengkap');

-- Users (Termasuk Akun Khusus Owner)
INSERT INTO `users` (`id`, `name`, `username`, `email`, `password`, `role`, `phone`, `avatar`, `vehicle_type`, `vehicle_number`, `is_active`) VALUES
(1, 'Cecep Hendrawan (Sales Manager)', 'admin', 'admin@alsyfa.com', '$2b$10$qT41M6v7xN7QZ5nCgJbBSu9q7d2C4M0R9KxT8J6yP5.sYlW9wK5Gy', 'admin', '081234567890', '/uploads/avatar-admin.png', 'mobil_box', 'B 1001 ADM', 1),
(2, 'Hendra Wijaya (Supervisor)', 'supervisor', 'supervisor@alsyfa.com', '$2b$10$qT41M6v7xN7QZ5nCgJbBSu9q7d2C4M0R9KxT8J6yP5.sYlW9wK5Gy', 'supervisor', '081234567891', '/uploads/avatar-spv.png', 'van', 'B 2002 SPV', 1),
(3, 'Ahmad Fauzi (Sales Motoris)', 'sales1', 'ahmad@alsyfa.com', '$2b$10$qT41M6v7xN7QZ5nCgJbBSu9q7d2C4M0R9KxT8J6yP5.sYlW9wK5Gy', 'sales', '085648292343', '/uploads/avatar-sales1.png', 'motor', 'F 4521 ABC', 1),
(4, 'Budi Santoso (Van Sales 1)', 'sales2', 'budi@alsyfa.com', '$2b$10$qT41M6v7xN7QZ5nCgJbBSu9q7d2C4M0R9KxT8J6yP5.sYlW9wK5Gy', 'sales', '081298765432', '/uploads/avatar-sales2.png', 'van', 'B 9182 SFA', 1),
(5, 'Doni Pratama (Van Sales 2)', 'sales3', 'doni@alsyfa.com', '$2b$10$qT41M6v7xN7QZ5nCgJbBSu9q7d2C4M0R9KxT8J6yP5.sYlW9wK5Gy', 'sales', '087811223344', '/uploads/avatar-sales3.png', 'van', 'B 8820 KDA', 1),
(6, 'Bapak H. Alamsyah (Owner ALSYFA)', 'owner', 'owner@alsyfa.com', '$2b$10$qT41M6v7xN7QZ5nCgJbBSu9q7d2C4M0R9KxT8J6yP5.sYlW9wK5Gy', 'owner', '081122334455', '/uploads/avatar-spv.png', 'mobil_box', 'B 1 ALSYFA', 1);

-- Products (Produk Snack Coklat & Snack Lainnya ALSYFA)
INSERT INTO `products` (`id`, `code`, `name`, `category`, `unit`, `cost_price`, `price`, `warehouse_stock`, `image`, `description`) VALUES
(1, 'PRD-001', 'Alsyfa Choco Bar Crispy 50g', 'SNACK COKLAT', 'pcs', 6000.00, 10000.00, 1500, '/uploads/madu-500g.png', 'Coklat batang lezat dengan rice crispy renyah sensasi gurih manis.'),
(2, 'PRD-002', 'Alsyfa Wafer Roll Coklat Box', 'SNACK COKLAT', 'box', 18000.00, 28000.00, 850, '/uploads/madu-1kg.png', 'Wafer roll renyah panjang berisi pasta coklat leleh padat.'),
(3, 'PRD-003', 'Alsyfa Choco Ball Crunch 150g', 'SNACK COKLAT', 'pouch', 12000.00, 18000.00, 950, '/uploads/habbat-100s.png', 'Biskuit bola salut coklat tebal sensasi lumer crunchy di mulut.'),
(4, 'PRD-004', 'Alsyfa Choco Cookies Chunks 200g', 'SNACK COKLAT', 'kotak', 15000.00, 24000.00, 700, '/uploads/zaitun-250ml.png', 'Kue kering coklat lezat dengan taburan choco chips premium.'),
(5, 'PRD-005', 'Alsyfa Coklat Truffle Melted 100g', 'SNACK COKLAT', 'box', 22000.00, 35000.00, 600, '/uploads/sari-kurma.png', 'Coklat truffle lembut dengan lelehan coklat murni premium.'),
(6, 'PRD-006', 'Alsyfa Keripik Coklat Lumer 120g', 'SNACK COKLAT', 'pouch', 9000.00, 15000.00, 800, '/uploads/propolis.png', 'Keripik pisang dan singkong renyah dibalut coklat kental khas Alsyfa.'),
(7, 'PRD-007', 'Alsyfa Makaroni Pedas Gurih 100g', 'SNACK LAINNYA', 'pouch', 5000.00, 9000.00, 1100, '/uploads/madu-anak.png', 'Makaroni goreng bumbu pedas daun jeruk gurih dan renyah.'),
(8, 'PRD-008', 'Alsyfa Kacang Almond Panggang 80g', 'SNACK LAINNYA', 'pouch', 16000.00, 25000.00, 500, '/uploads/teh-bidara.png', 'Kacang almond panggang asin gurih renyah cemilan sehat kaya energi.');

-- Customers (Toko, Grosir, Ritel: Data KOTA - KECAMATAN - DESA & Penanggung Jawab Sales)
INSERT INTO `customers` (`id`, `code`, `name`, `owner_name`, `shop_type`, `phone`, `address`, `province_code`, `province_name`, `regency_code`, `regency_name`, `district_code`, `district_name`, `village_code`, `village_name`, `latitude`, `longitude`, `image`, `credit_limit`, `current_balance`, `notes`, `sales_id`, `created_by`) VALUES
(1, 'CST-001', 'Toko Snack Berkah Cibinong', 'H. Sulaiman', 'grosir', '081234567890', 'Jl. Raya Mayor Oking No. 45, Cibinong', '32', 'Jawa Barat', '32.01', 'Kabupaten Bogor', '32.01.01', 'Cibinong', '32.01.01.1001', 'Pondok Rajeg', -6.47890000, 106.85230000, '/uploads/toko-berkah.png', 10000000.00, 2500000.00, 'Toko langganan grosir snack coklat, tempo 14 hari lancar.', 4, 1),
(2, 'CST-002', 'Minimarket Alsyfa Sehat Farma', 'Dra. Hj. Nurul', 'apotek_klinik', '085648292343', 'Jl. Sukaraja Raya No. 12, Sukaraja', '32', 'Jawa Barat', '32.01', 'Kabupaten Bogor', '32.01.04', 'Sukaraja', '32.01.04.2001', 'Cikeas', -6.53420000, 106.84120000, '/uploads/apotek-alsyifa.png', 15000000.00, 0.00, 'Toko modern, rutin ambil Choco Bar dan Wafer Roll.', 3, 1),
(3, 'CST-003', 'Toko Grosir Barokah Sentosa', 'Bpk. Hendra Gunawan', 'grosir', '081388776655', 'Jl. Mercedes Benz No. 88, Cicadas', '32', 'Jawa Barat', '32.01', 'Kabupaten Bogor', '32.01.02', 'Gunungputri', '32.01.02.2003', 'Cicadas', -6.45210000, 106.91450000, '/uploads/toko-barokah.png', 20000000.00, 5000000.00, 'Outlet grosir utama jalur Gunungputri.', 5, 2),
(4, 'CST-004', 'Warung Snack Ritel Al-Munawwarah', 'Ust. Ahmad Dahlan', 'ritel', '087712349988', 'Jl. Pahlawan No. 23, Sanja', '32', 'Jawa Barat', '32.01', 'Kabupaten Bogor', '32.01.03', 'Citeureup', '32.01.03.2004', 'Sanja', -6.49500000, 106.87900000, '/uploads/toko-munawwarah.png', 5000000.00, 1200000.00, 'Toko ritel langganan, repeat order snack coklat tiap Selasa.', 4, 1),
(5, 'CST-005', 'Minimarket Madina Mart', 'Ibu Siti Aminah', 'ritel', '081987654321', 'Jl. Karadenan No. 10, Karadenan', '32', 'Jawa Barat', '32.01', 'Kabupaten Bogor', '32.01.01', 'Cibinong', '32.01.01.1002', 'Karadenan', -6.50500000, 106.81800000, '/uploads/madina-mart.png', 8000000.00, 0.00, 'Minimarket muslim, transaksi selalu tunai langsung di kasir.', 4, 1),
(6, 'CST-006', 'Toko Sentosa Snack & Bakery', 'dr. Farhan Rusydi', 'ritel', '082133445566', 'Jl. Sentul Selatan No. 5, Citaringgul', '32', 'Jawa Barat', '32.01', 'Kabupaten Bogor', '32.01.05', 'Babakan Madang', '32.01.05.2002', 'Citaringgul', -6.56100000, 106.87200000, '/uploads/klinik-sehat.png', 12000000.00, 3100000.00, 'Sering memesan Choco Ball dan Choco Cookies.', 5, 2),
(7, 'CST-007', 'Toko Ritel Coklat Al-Kautsar', 'Bpk. Yusuf Ramli', 'ritel', '085711223344', 'Jl. Harapanjaya No. 7, Harapanjaya', '32', 'Jawa Barat', '32.01', 'Kabupaten Bogor', '32.01.01', 'Cibinong', '32.01.01.1003', 'Harapanjaya', -6.48200000, 106.84500000, '/uploads/toko-kautsar.png', 4000000.00, 0.00, 'Ritel snack baru, perputaran produk cepat.', 3, 1);

-- Routes (Pemetaan rute kerja dari hari Senin – Minggu: Kecamatan & Desa)
INSERT INTO `routes` (`id`, `sales_id`, `day_of_week`, `province_name`, `regency_name`, `district_code`, `district_name`, `village_codes`, `village_names`, `notes`) VALUES
(1, 4, 'senin', 'Jawa Barat', 'Kabupaten Bogor', '32.01.01', 'Cibinong', '["32.01.01.1001", "32.01.01.1002", "32.01.01.1003"]', 'Pondok Rajeg, Karadenan, Harapanjaya', 'Rute Senin Van Sales 1: Wilayah Cibinong sentral'),
(2, 4, 'selasa', 'Jawa Barat', 'Kabupaten Bogor', '32.01.03', 'Citeureup', '["32.01.03.2001", "32.01.03.2004"]', 'Citeureup, Sanja', 'Rute Selasa Van Sales 1: Wilayah Citeureup dan Sanja'),
(3, 4, 'rabu', 'Jawa Barat', 'Kabupaten Bogor', '32.01.04', 'Sukaraja', '["32.01.04.2001", "32.01.04.2002"]', 'Cikeas, Sukaraja', 'Rute Rabu Van Sales 1: Jalur Sukaraja Cikeas'),
(4, 4, 'kamis', 'Jawa Barat', 'Kabupaten Bogor', '32.01.02', 'Gunungputri', '["32.01.02.2001", "32.01.02.2003"]', 'Gunungputri, Cicadas', 'Rute Kamis Van Sales 1: Jalur Industri Gunungputri'),
(5, 4, 'jumat', 'Jawa Barat', 'Kabupaten Bogor', '32.01.05', 'Babakan Madang', '["32.01.05.2001", "32.01.05.2002"]', 'Babakan Madang, Citaringgul', 'Rute Jumat Van Sales 1: Kawasan Sentul Babakan Madang'),
(6, 4, 'sabtu', 'Jawa Barat', 'Kabupaten Bogor', '32.01.01', 'Cibinong', '["32.01.01.1004", "32.01.01.1005"]', 'Nanggewer, Pabuaran', 'Rute Sabtu Van Sales 1: Follow up grosir & re-order weekend'),
(7, 4, 'minggu', 'Jawa Barat', 'Kabupaten Bogor', '32.01.01', 'Cibinong', '["32.01.01.1001", "32.01.01.1002"]', 'Pondok Rajeg, Karadenan', 'Rute Minggu: Toko wisata & restock ritel akhir pekan'),
(8, 3, 'senin', 'Jawa Barat', 'Kabupaten Bogor', '32.01.01', 'Cibinong', '["32.01.01.1002", "32.01.01.1003"]', 'Karadenan, Harapanjaya', 'Rute Motoris Senin: Cibinong gang & ritel'),
(9, 3, 'selasa', 'Jawa Barat', 'Kabupaten Bogor', '32.01.04', 'Sukaraja', '["32.01.04.2001"]', 'Cikeas', 'Rute Motoris Selasa: Sukaraja');

-- Route Customers
INSERT INTO `route_customers` (`route_id`, `customer_id`, `visit_order`) VALUES
(1, 1, 1),
(1, 5, 2),
(1, 7, 3),
(2, 4, 1),
(3, 2, 1),
(4, 3, 1),
(5, 6, 1),
(7, 1, 1),
(7, 5, 2),
(8, 5, 1),
(8, 7, 2);

-- Promotions (Agenda Promo Bulanan Pusat)
INSERT INTO `promotions` (`id`, `title`, `code`, `banner_image`, `description`, `discount_type`, `discount_value`, `min_order_amount`, `start_date`, `end_date`, `is_active`) VALUES
(1, 'Super Promo Awal Pekan Snack Coklat', 'PROMO-AWAL-PEKAN', '/uploads/promo-berkah.png', 'Dapatkan potongan 10% untuk setiap pembelanjaan produk snack coklat minimal Rp 300.000.', 'percentage', 10.00, 300000.00, '2026-11-01', '2026-11-30', 1),
(2, 'Grosir Champion Choco Wafer Roll', 'PROMO-WAFER-50K', '/uploads/promo-zaitun.png', 'Potongan langsung Rp 50.000 untuk pembelian grosir minimal transaksi Rp 800.000.', 'fixed', 50000.00, 800000.00, '2026-11-10', '2026-12-10', 1),
(3, 'Flash Sale Choco Ball Crunch Hemat', 'FLASH-CHOCO-15', '/uploads/promo-propolis.png', 'Diskon spesial 15% khusus pembelian Choco Ball Alsyfa minimal 10 pouch atau Rp 150.000.', 'percentage', 15.00, 150000.00, '2026-11-15', '2026-11-30', 1);

-- Van Stocks (Stok Kendaraan Sales Van 1 & Motoris untuk hari ini)
INSERT INTO `van_stocks` (`sales_id`, `product_id`, `initial_stock`, `sold_stock`, `current_stock`, `stock_date`) VALUES
(4, 1, 50, 15, 35, CURRENT_DATE()),
(4, 2, 30, 8, 22, CURRENT_DATE()),
(4, 3, 40, 12, 28, CURRENT_DATE()),
(4, 4, 25, 6, 19, CURRENT_DATE()),
(4, 5, 20, 5, 15, CURRENT_DATE()),
(4, 6, 30, 8, 22, CURRENT_DATE()),
(3, 1, 25, 10, 15, CURRENT_DATE()),
(3, 3, 20, 8, 12, CURRENT_DATE()),
(3, 7, 30, 14, 16, CURRENT_DATE());

-- Van Stock Logs
INSERT INTO `van_stock_logs` (`sales_id`, `product_id`, `type`, `qty`, `notes`, `created_at`) VALUES
(4, 1, 'in_allocation', 50, 'Alokasi stok pagi Gudang Utama', NOW() - INTERVAL 4 HOUR),
(4, 2, 'in_allocation', 30, 'Alokasi stok pagi Gudang Utama', NOW() - INTERVAL 4 HOUR),
(4, 3, 'in_allocation', 40, 'Alokasi stok pagi Gudang Utama', NOW() - INTERVAL 4 HOUR),
(4, 1, 'out_sale', 15, 'Terjual di Toko Snack Berkah (INV-202611-0001)', NOW() - INTERVAL 2 HOUR);

-- Attendances (Absensi Sales 08.00 - 15.00)
INSERT INTO `attendances` (`sales_id`, `date`, `clock_in_time`, `clock_in_lat`, `clock_in_lng`, `clock_in_address`, `clock_in_image`, `clock_out_time`, `clock_out_lat`, `clock_out_lng`, `clock_out_address`, `clock_out_image`, `status`, `notes`) VALUES
(4, CURRENT_DATE(), '07:55:00', -6.48010000, 106.85050000, 'Jl. Raya Jakarta-Bogor Km 45, Cibinong', '/uploads/selfie-clockin-budi.png', NULL, NULL, NULL, NULL, NULL, 'hadir', 'Tiba tepat waktu, briefing pagi selesai.'),
(3, CURRENT_DATE(), '08:05:00', -6.48150000, 106.84900000, 'Jl. Raya Bogor Km 44, Cibinong', '/uploads/selfie-clockin-ahmad.png', NULL, NULL, NULL, NULL, NULL, 'terlambat', 'Terlambat 5 menit karena macet jalan raya.'),
(4, CURRENT_DATE() - INTERVAL 1 DAY, '07:50:00', -6.48010000, 106.85050000, 'Depo Alsyfa Cibinong', '/uploads/selfie-in.png', '15:15:00', -6.48020000, 106.85060000, 'Depo Alsyfa Cibinong', '/uploads/selfie-out.png', 'hadir', 'Absen pulang setelah jam 15:00 sukses diverifikasi.');

-- Visits (Check-In / Check-Out Kunjungan Toko)
INSERT INTO `visits` (`id`, `sales_id`, `customer_id`, `visit_date`, `check_in_time`, `check_in_lat`, `check_in_lng`, `check_in_image`, `check_out_time`, `check_out_lat`, `check_out_lng`, `duration_minutes`, `status`, `result_type`, `notes`) VALUES
(1, 4, 1, CURRENT_DATE(), '08:45:00', -6.47890000, 106.85230000, '/uploads/visit-berkah.png', '09:25:00', -6.47891000, 106.85231000, 40, 'completed', 'order', 'Kunjungan sukses, toko memesan Choco Bar dan Wafer Roll.'),
(2, 4, 5, CURRENT_DATE(), '09:40:00', -6.50500000, 106.81800000, '/uploads/visit-madina.png', '10:15:00', -6.50501000, 106.81801000, 35, 'completed', 'order', 'Minimarket Madina restock Choco Ball dan Cookies.'),
(3, 4, 7, CURRENT_DATE(), '10:45:00', -6.48200000, 106.84500000, '/uploads/visit-kautsar.png', NULL, NULL, NULL, 0, 'in_progress', NULL, 'Sedang presentasi produk varian baru Choco Truffle.');

-- Sales Locations (Real-time GPS Tracking)
INSERT INTO `sales_locations` (`sales_id`, `latitude`, `longitude`, `battery_level`, `accuracy`, `address_note`, `recorded_at`) VALUES
(4, -6.48200000, 106.84500000, 85, 4.5, 'Dekat Toko Coklat Al-Kautsar, Harapanjaya, Cibinong', NOW()),
(3, -6.53420000, 106.84120000, 72, 5.0, 'Dekat Minimarket Alsyfa Sehat Farma, Sukaraja', NOW()),
(5, -6.45210000, 106.91450000, 91, 3.8, 'Kawasan Cicadas Gunungputri', NOW());

-- Orders (Pencatatan Pesanan & Faktur)
INSERT INTO `orders` (`id`, `invoice_number`, `sales_id`, `customer_id`, `visit_id`, `promo_id`, `order_date`, `subtotal`, `discount_amount`, `tax_amount`, `grand_total`, `payment_method`, `payment_status`, `paid_amount`, `due_date`, `status`, `notes`) VALUES
(1, 'INV-202611-0001', 4, 1, 1, 1, CURRENT_DATE(), 630000.00, 63000.00, 0.00, 567000.00, 'tempo', 'belum_lunas', 0.00, CURRENT_DATE() + INTERVAL 14 DAY, 'approved', 'Pesanan reguler mingguan Toko Snack Berkah Cibinong'),
(2, 'INV-202611-0002', 4, 5, 2, NULL, CURRENT_DATE(), 360000.00, 0.00, 0.00, 360000.00, 'tunai', 'lunas', 360000.00, NULL, 'approved', 'Pembayaran tunai lunas di tempat oleh kasir'),
(3, 'INV-202611-0003', 3, 2, NULL, 2, CURRENT_DATE() - INTERVAL 1 DAY, 840000.00, 50000.00, 0.00, 790000.00, 'transfer', 'lunas', 790000.00, NULL, 'delivered', 'Order Minimarket Alsyfa Sehat Farma telah diterima');

-- Order Items
INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `unit`, `price`, `cost_price`, `qty`, `discount_percent`, `total_price`) VALUES
(1, 1, 'Alsyfa Choco Bar Crispy 50g', 'pcs', 10000.00, 6000.00, 35, 0.00, 350000.00),
(1, 2, 'Alsyfa Wafer Roll Coklat Box', 'box', 28000.00, 18000.00, 10, 0.00, 280000.00),
(2, 3, 'Alsyfa Choco Ball Crunch 150g', 'pouch', 18000.00, 12000.00, 10, 0.00, 180000.00),
(2, 4, 'Alsyfa Choco Cookies Chunks 200g', 'kotak', 24000.00, 15000.00, 7, 0.00, 168000.00),
(3, 2, 'Alsyfa Wafer Roll Coklat Box', 'box', 28000.00, 18000.00, 30, 0.00, 840000.00);

-- Payments (Sistem Akuntansi & Setoran Kas Masuk)
INSERT INTO `payments` (`id`, `payment_number`, `order_id`, `sales_id`, `customer_id`, `payment_date`, `amount`, `payment_method`, `proof_image`, `notes`, `received_by`) VALUES
(1, 'PAY-202611-0001', 2, 4, 5, CURRENT_DATE(), 360000.00, 'tunai', '/uploads/kwitansi-001.png', 'Setoran kas penjualan langsung Minimarket Madina', 1),
(2, 'PAY-202611-0002', 3, 3, 2, CURRENT_DATE() - INTERVAL 1 DAY, 790000.00, 'transfer', '/uploads/bukti-transfer-bca.png', 'Transfer bank BCA No. Ref 98218731', 1);

-- Operational Allowances (Tunjangan Operasional Sales Rp 30.000 / Hari: BBM Rp 20rb, Sewa Motor Rp 10rb)
INSERT INTO `operational_allowances` (`id`, `sales_id`, `date`, `bbm_amount`, `motor_rent_amount`, `total_amount`, `status`, `paid_date`, `notes`) VALUES
(1, 4, CURRENT_DATE(), 20000.00, 10000.00, 30000.00, 'approved', NULL, 'Tunjangan operasional harian Van Sales 1'),
(2, 3, CURRENT_DATE(), 20000.00, 10000.00, 30000.00, 'approved', NULL, 'Tunjangan operasional harian Sales Motoris'),
(3, 4, CURRENT_DATE() - INTERVAL 1 DAY, 20000.00, 10000.00, 30000.00, 'paid', CURRENT_DATE() - INTERVAL 1 DAY, 'Tunjangan operasional cair'),
(4, 3, CURRENT_DATE() - INTERVAL 1 DAY, 20000.00, 10000.00, 30000.00, 'paid', CURRENT_DATE() - INTERVAL 1 DAY, 'Tunjangan operasional cair');


-- 18. Sales Targets (Target Mingguan & Bulanan Sales)
CREATE TABLE IF NOT EXISTS `sales_targets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sales_id` INT NOT NULL,
  `month` VARCHAR(7) NOT NULL,
  `week_number` TINYINT NOT NULL,
  `target_pack` INT NOT NULL DEFAULT 0,
  `target_dus` INT NOT NULL DEFAULT 0,
  `target_rupiah` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_sales_month_week` (`sales_id`, `month`, `week_number`),
  FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. City Targets (Target & Akumulasi Bulanan per Kategori Kota)
CREATE TABLE IF NOT EXISTS `city_targets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `city_name` VARCHAR(100) NOT NULL,
  `month` VARCHAR(7) NOT NULL,
  `target_pack` INT NOT NULL DEFAULT 0,
  `target_dus` INT NOT NULL DEFAULT 0,
  `target_rupiah` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_city_month` (`city_name`, `month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Daily Deposits (Setoran Harian Sales & Potongan Tunjangan Ops)
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
