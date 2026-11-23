-- Database Schema for Alsyifa Sales Management App
-- Generated for MySQL

CREATE DATABASE IF NOT EXISTS `alsyifa_sales_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `alsyifa_sales_db`;

-- Drop tables in reverse order of foreign keys
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
DROP TABLE IF EXISTS `route_customers`;
DROP TABLE IF EXISTS `routes`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `users`;

-- 1. Users Table
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'supervisor', 'sales') NOT NULL DEFAULT 'sales',
  `phone` VARCHAR(25) NULL,
  `avatar` VARCHAR(255) NULL,
  `vehicle_type` ENUM('motor', 'van', 'mobil_box') DEFAULT 'van',
  `vehicle_number` VARCHAR(30) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Customers Table (Toko / Outlet)
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
  `created_by` INT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Routes Table (Pengaturan Rute Harian Senin - Sabtu)
CREATE TABLE `routes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sales_id` INT NOT NULL,
  `day_of_week` ENUM('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu') NOT NULL,
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

-- 5. Products Table
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(30) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'Herbal Alami',
  `unit` VARCHAR(20) NOT NULL DEFAULT 'botol',
  `cost_price` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `price` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `warehouse_stock` INT NOT NULL DEFAULT 0,
  `image` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Van Stocks Table (Manajemen Stok Kendaraan Sales)
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
  `unit` VARCHAR(20) NOT NULL DEFAULT 'botol',
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

-- ========================================================
-- SEED DATA
-- ========================================================

-- Users (Password is bcrypt of 'password123': $2b$10$wE99F9qW8g6xsmZ6b.jZq.gX4k26B5f0dI9f0v8y8S7W7Y7jSjKCe or standard hash)
-- For convenience with bcrypt and plaintext fallback in server:
INSERT INTO `users` (`id`, `name`, `username`, `email`, `password`, `role`, `phone`, `avatar`, `vehicle_type`, `vehicle_number`, `is_active`) VALUES
(1, 'Cecep Hendrawan (Sales Manager)', 'admin', 'admin@alsyifa.com', '$2b$10$qT41M6v7xN7QZ5nCgJbBSu9q7d2C4M0R9KxT8J6yP5.sYlW9wK5Gy', 'admin', '081234567890', '/uploads/avatar-admin.png', 'mobil_box', 'B 1001 ADM', 1),
(2, 'Hendra Wijaya (Supervisor)', 'supervisor', 'supervisor@alsyifa.com', '$2b$10$qT41M6v7xN7QZ5nCgJbBSu9q7d2C4M0R9KxT8J6yP5.sYlW9wK5Gy', 'supervisor', '081234567891', '/uploads/avatar-spv.png', 'van', 'B 2002 SPV', 1),
(3, 'Ahmad Fauzi (Sales Motoris)', 'sales1', 'ahmad@alsyifa.com', '$2b$10$qT41M6v7xN7QZ5nCgJbBSu9q7d2C4M0R9KxT8J6yP5.sYlW9wK5Gy', 'sales', '085648292343', '/uploads/avatar-sales1.png', 'motor', 'F 4521 ABC', 1),
(4, 'Budi Santoso (Van Sales 1)', 'sales2', 'budi@alsyifa.com', '$2b$10$qT41M6v7xN7QZ5nCgJbBSu9q7d2C4M0R9KxT8J6yP5.sYlW9wK5Gy', 'sales', '081298765432', '/uploads/avatar-sales2.png', 'van', 'B 9182 SFA', 1),
(5, 'Doni Pratama (Van Sales 2)', 'sales3', 'doni@alsyifa.com', '$2b$10$qT41M6v7xN7QZ5nCgJbBSu9q7d2C4M0R9KxT8J6yP5.sYlW9wK5Gy', 'sales', '087811223344', '/uploads/avatar-sales3.png', 'van', 'B 8820 KDA', 1);

-- Products (Produk Alsyifa Herbal & Consumer Goods)
INSERT INTO `products` (`id`, `code`, `name`, `category`, `unit`, `cost_price`, `price`, `warehouse_stock`, `image`, `description`) VALUES
(1, 'PRD-001', 'Madu Murni Alsyifa 500g', 'Madu Herbal', 'botol', 65000.00, 85000.00, 450, '/uploads/madu-500g.png', 'Madu murni alami kualitas premium dari nektar bunga pilihan.'),
(2, 'PRD-002', 'Madu Murni Alsyifa 1kg', 'Madu Herbal', 'botol', 120000.00, 155000.00, 280, '/uploads/madu-1kg.png', 'Madu murni alami kemasan hemat 1kg untuk keluarga sehat.'),
(3, 'PRD-003', 'Habbatussauda Softgel 100s', 'Herbal Imunitas', 'botol', 50000.00, 70000.00, 350, '/uploads/habbat-100s.png', 'Ekstrak minyak habbatussauda murni dalam kapsul lunak berkualitas.'),
(4, 'PRD-004', 'Minyak Zaitun Extra Virgin 250ml', 'Minyak Sehat', 'botol', 35000.00, 50000.00, 400, '/uploads/zaitun-250ml.png', 'Minyak zaitun perasan pertama cold pressed kualitas Grade A.'),
(5, 'PRD-005', 'Sari Kurma Alsyifa Premium 350g', 'Suplemen Alami', 'botol', 22000.00, 35000.00, 500, '/uploads/sari-kurma.png', 'Sari kurma kental alami kaya zat besi dan penambah stamina.'),
(6, 'PRD-006', 'Propolis Alsyifa Nano Drop 10ml', 'Herbal Imunitas', 'botol', 75000.00, 110000.00, 200, '/uploads/propolis.png', 'Ekstrak propolis teknologi nano cepat serap untuk daya tahan tubuh.'),
(7, 'PRD-007', 'Madu Anak Pintar Gemuk 150ml', 'Madu Anak', 'botol', 28000.00, 42000.00, 300, '/uploads/madu-anak.png', 'Formulasi madu, temulawak, dan ekstrak ikan gabus untuk nafsu makan.'),
(8, 'PRD-008', 'Teh Celup Daun Bidara Plus Herbal', 'Teh Herbal', 'kotak', 15000.00, 25000.00, 600, '/uploads/teh-bidara.png', 'Teh herbal daun bidara pilihan untuk relaksasi dan kesehatan lambung.');

-- Customers (Toko, Grosir, Apotek dengan alamat lengkap & koordinat GPS)
INSERT INTO `customers` (`id`, `code`, `name`, `owner_name`, `shop_type`, `phone`, `address`, `province_code`, `province_name`, `regency_code`, `regency_name`, `district_code`, `district_name`, `village_code`, `village_name`, `latitude`, `longitude`, `image`, `credit_limit`, `current_balance`, `notes`, `created_by`) VALUES
(1, 'CST-001', 'Toko Berkah Herbal Cibinong', 'H. Sulaiman', 'grosir', '081234567890', 'Jl. Raya Mayor Oking No. 45, Cibinong', '32', 'Jawa Barat', '32.01', 'Kabupaten Bogor', '32.01.01', 'Cibinong', '32.01.01.1001', 'Pondok Rajeg', -6.47890000, 106.85230000, '/uploads/toko-berkah.png', 10000000.00, 2500000.00, 'Toko langganan grosir, pembayaran tempo 14 hari lancar.', 1),
(2, 'CST-002', 'Apotek Alsyifa Farma Sehat', 'Dra. Hj. Nurul', 'apotek_klinik', '085648292343', 'Jl. Sukaraja Raya No. 12, Sukaraja', '32', 'Jawa Barat', '32.01', 'Kabupaten Bogor', '32.01.04', 'Sukaraja', '32.01.04.2001', 'Cikeas', -6.53420000, 106.84120000, '/uploads/apotek-alsyifa.png', 15000000.00, 0.00, 'Apotek besar, rutin ambil Madu Murni dan Habbatussauda.', 1),
(3, 'CST-003', 'Toko Grosir Barokah Sentosa', 'Bpk. Hendra Gunawan', 'grosir', '081388776655', 'Jl. Mercedes Benz No. 88, Cicadas', '32', 'Jawa Barat', '32.01', 'Kabupaten Bogor', '32.01.02', 'Gunungputri', '32.01.02.2003', 'Cicadas', -6.45210000, 106.91450000, '/uploads/toko-barokah.png', 20000000.00, 5000000.00, 'Outlet grosir utama jalur Gunungputri.', 2),
(4, 'CST-004', 'Toko Obat Herbal Al-Munawwarah', 'Ust. Ahmad Dahlan', 'ritel', '087712349988', 'Jl. Pahlawan No. 23, Sanja', '32', 'Jawa Barat', '32.01', 'Kabupaten Bogor', '32.01.03', 'Citeureup', '32.01.03.2004', 'Sanja', -6.49500000, 106.87900000, '/uploads/toko-munawwarah.png', 5000000.00, 1200000.00, 'Toko ritel herbal, selalu order tiap hari Selasa.', 1),
(5, 'CST-005', 'Minimarket Madina Mart', 'Ibu Siti Aminah', 'ritel', '081987654321', 'Jl. Karadenan No. 10, Karadenan', '32', 'Jawa Barat', '32.01', 'Kabupaten Bogor', '32.01.01', 'Cibinong', '32.01.01.1002', 'Karadenan', -6.50500000, 106.81800000, '/uploads/madina-mart.png', 8000000.00, 0.00, 'Minimarket muslim, transaksi selalu tunai langsung.', 1),
(6, 'CST-006', 'Klinik & Herbal Sehat Sentosa', 'dr. Farhan Rusydi', 'apotek_klinik', '082133445566', 'Jl. Sentul Selatan No. 5, Citaringgul', '32', 'Jawa Barat', '32.01', 'Kabupaten Bogor', '32.01.05', 'Babakan Madang', '32.01.05.2002', 'Citaringgul', -6.56100000, 106.87200000, '/uploads/klinik-sehat.png', 12000000.00, 3100000.00, 'Sering memesan Propolis dan Madu Anak.', 2),
(7, 'CST-007', 'Toko Herbal Al-Kautsar', 'Bpk. Yusuf Ramli', 'ritel', '085711223344', 'Jl. Harapanjaya No. 7, Harapanjaya', '32', 'Jawa Barat', '32.01', 'Kabupaten Bogor', '32.01.01', 'Cibinong', '32.01.01.1003', 'Harapanjaya', -6.48200000, 106.84500000, '/uploads/toko-kautsar.png', 4000000.00, 0.00, 'Ritel herbal baru buka, potensi repeat order tinggi.', 1);

-- Routes (Pemetaan area kerja dari hari Senin – Sabtu: Kecamatan & Desa)
INSERT INTO `routes` (`id`, `sales_id`, `day_of_week`, `province_name`, `regency_name`, `district_code`, `district_name`, `village_codes`, `village_names`, `notes`) VALUES
(1, 4, 'senin', 'Jawa Barat', 'Kabupaten Bogor', '32.01.01', 'Cibinong', '["32.01.01.1001", "32.01.01.1002", "32.01.01.1003"]', 'Pondok Rajeg, Karadenan, Harapanjaya', 'Rute Senin Van Sales 1: Wilayah Cibinong sentral'),
(2, 4, 'selasa', 'Jawa Barat', 'Kabupaten Bogor', '32.01.03', 'Citeureup', '["32.01.03.2001", "32.01.03.2004"]', 'Citeureup, Sanja', 'Rute Selasa Van Sales 1: Wilayah Citeureup dan Sanja'),
(3, 4, 'rabu', 'Jawa Barat', 'Kabupaten Bogor', '32.01.04', 'Sukaraja', '["32.01.04.2001", "32.01.04.2002"]', 'Cikeas, Sukaraja', 'Rute Rabu Van Sales 1: Jalur Sukaraja Cikeas'),
(4, 4, 'kamis', 'Jawa Barat', 'Kabupaten Bogor', '32.01.02', 'Gunungputri', '["32.01.02.2001", "32.01.02.2003"]', 'Gunungputri, Cicadas', 'Rute Kamis Van Sales 1: Jalur Industri Gunungputri'),
(5, 4, 'jumat', 'Jawa Barat', 'Kabupaten Bogor', '32.01.05', 'Babakan Madang', '["32.01.05.2001", "32.01.05.2002"]', 'Babakan Madang, Citaringgul', 'Rute Jumat Van Sales 1: Kawasan Sentul Babakan Madang'),
(6, 4, 'sabtu', 'Jawa Barat', 'Kabupaten Bogor', '32.01.01', 'Cibinong', '["32.01.01.1004", "32.01.01.1005"]', 'Nanggewer, Pabuaran', 'Rute Sabtu Van Sales 1: Follow up grosir & re-order weekend'),
(7, 3, 'senin', 'Jawa Barat', 'Kabupaten Bogor', '32.01.01', 'Cibinong', '["32.01.01.1002", "32.01.01.1003"]', 'Karadenan, Harapanjaya', 'Rute Motoris Senin: Cibinong gang & ritel'),
(8, 3, 'selasa', 'Jawa Barat', 'Kabupaten Bogor', '32.01.04', 'Sukaraja', '["32.01.04.2001"]', 'Cikeas', 'Rute Motoris Selasa: Sukaraja');

-- Route Customers
INSERT INTO `route_customers` (`route_id`, `customer_id`, `visit_order`) VALUES
(1, 1, 1),
(1, 5, 2),
(1, 7, 3),
(2, 4, 1),
(3, 2, 1),
(4, 3, 1),
(5, 6, 1),
(7, 5, 1),
(7, 7, 2);

-- Promotions (Agenda Promo Bulanan Pusat)
INSERT INTO `promotions` (`id`, `title`, `code`, `banner_image`, `description`, `discount_type`, `discount_value`, `min_order_amount`, `start_date`, `end_date`, `is_active`) VALUES
(1, 'Super Promo Awal Pekan Herbal Berkah', 'PROMO-AWAL-PEKAN', '/uploads/promo-berkah.png', 'Dapatkan potongan 10% untuk setiap pembelanjaan produk madu dan habbatussauda minimal Rp 500.000.', 'percentage', 10.00, 500000.00, '2026-11-01', '2026-11-30', 1),
(2, 'Grosir Champion Minyak Zaitun', 'PROMO-ZAITUN-50K', '/uploads/promo-zaitun.png', 'Potongan langsung Rp 50.000 untuk pembelian grosir minimal transaksi Rp 1.000.000.', 'fixed', 50000.00, 1000000.00, '2026-11-10', '2026-12-10', 1),
(3, 'Flash Sale Propolis Nano Imun Kuat', 'FLASH-PROPOLIS-15', '/uploads/promo-propolis.png', 'Diskon spesial 15% khusus pembelian Propolis Alsyifa minimal 5 botol atau Rp 400.000.', 'percentage', 15.00, 400000.00, '2026-11-15', '2026-11-30', 1);

-- Van Stocks (Stok Kendaraan Sales Van 1 & Motoris untuk hari ini)
INSERT INTO `van_stocks` (`sales_id`, `product_id`, `initial_stock`, `sold_stock`, `current_stock`, `stock_date`) VALUES
(4, 1, 30, 8, 22, CURRENT_DATE()),
(4, 2, 15, 3, 12, CURRENT_DATE()),
(4, 3, 25, 5, 20, CURRENT_DATE()),
(4, 4, 20, 6, 14, CURRENT_DATE()),
(4, 5, 40, 10, 30, CURRENT_DATE()),
(4, 6, 15, 2, 13, CURRENT_DATE()),
(3, 1, 10, 2, 8, CURRENT_DATE()),
(3, 3, 10, 3, 7, CURRENT_DATE()),
(3, 5, 15, 5, 10, CURRENT_DATE());

-- Van Stock Logs
INSERT INTO `van_stock_logs` (`sales_id`, `product_id`, `type`, `qty`, `notes`, `created_at`) VALUES
(4, 1, 'in_allocation', 30, 'Alokasi stok pagi Gudang Utama', NOW() - INTERVAL 4 HOUR),
(4, 2, 'in_allocation', 15, 'Alokasi stok pagi Gudang Utama', NOW() - INTERVAL 4 HOUR),
(4, 3, 'in_allocation', 25, 'Alokasi stok pagi Gudang Utama', NOW() - INTERVAL 4 HOUR),
(4, 4, 'in_allocation', 20, 'Alokasi stok pagi Gudang Utama', NOW() - INTERVAL 4 HOUR),
(4, 5, 'in_allocation', 40, 'Alokasi stok pagi Gudang Utama', NOW() - INTERVAL 4 HOUR),
(4, 6, 'in_allocation', 15, 'Alokasi stok pagi Gudang Utama', NOW() - INTERVAL 4 HOUR),
(4, 1, 'out_sale', 8, 'Terjual di Toko Berkah Herbal (INV-202611-0001)', NOW() - INTERVAL 2 HOUR);

-- Attendances (Absensi Sales 08.00 - 15.00)
INSERT INTO `attendances` (`sales_id`, `date`, `clock_in_time`, `clock_in_lat`, `clock_in_lng`, `clock_in_address`, `clock_in_image`, `clock_out_time`, `clock_out_lat`, `clock_out_lng`, `clock_out_address`, `clock_out_image`, `status`, `notes`) VALUES
(4, CURRENT_DATE(), '07:55:00', -6.48010000, 106.85050000, 'Jl. Raya Jakarta-Bogor Km 45, Cibinong', '/uploads/selfie-clockin-budi.png', NULL, NULL, NULL, NULL, NULL, 'hadir', 'Tiba tepat waktu, briefing pagi selesai.'),
(3, CURRENT_DATE(), '08:05:00', -6.48150000, 106.84900000, 'Jl. Raya Bogor Km 44, Cibinong', '/uploads/selfie-clockin-ahmad.png', NULL, NULL, NULL, NULL, NULL, 'terlambat', 'Terlambat 5 menit karena macet jalan raya.'),
(4, CURRENT_DATE() - INTERVAL 1 DAY, '07:50:00', -6.48010000, 106.85050000, 'Depo Alsyifa Cibinong', '/uploads/selfie-in.png', '15:15:00', -6.48020000, 106.85060000, 'Depo Alsyifa Cibinong', '/uploads/selfie-out.png', 'hadir', 'Absen pulang setelah jam 15:00 sukses diverifikasi.');

-- Visits (Check-In / Check-Out Kunjungan Toko)
INSERT INTO `visits` (`id`, `sales_id`, `customer_id`, `visit_date`, `check_in_time`, `check_in_lat`, `check_in_lng`, `check_in_image`, `check_out_time`, `check_out_lat`, `check_out_lng`, `duration_minutes`, `status`, `result_type`, `notes`) VALUES
(1, 4, 1, CURRENT_DATE(), '08:45:00', -6.47890000, 106.85230000, '/uploads/visit-berkah.png', '09:25:00', -6.47891000, 106.85231000, 40, 'completed', 'order', 'Kunjungan sukses, toko memesan madu 500g dan sari kurma.'),
(2, 4, 5, CURRENT_DATE(), '09:40:00', -6.50500000, 106.81800000, '/uploads/visit-madina.png', '10:15:00', -6.50501000, 106.81801000, 35, 'completed', 'order', 'Minimarket Madina restock Habbatussauda dan Minyak Zaitun.'),
(3, 4, 7, CURRENT_DATE(), '10:45:00', -6.48200000, 106.84500000, '/uploads/visit-kautsar.png', NULL, NULL, NULL, 0, 'in_progress', NULL, 'Sedang presentasi produk herbal anak.');

-- Sales Locations (Real-time GPS Tracking)
INSERT INTO `sales_locations` (`sales_id`, `latitude`, `longitude`, `battery_level`, `accuracy`, `address_note`, `recorded_at`) VALUES
(4, -6.48200000, 106.84500000, 85, 4.5, 'Dekat Toko Herbal Al-Kautsar, Harapanjaya, Cibinong', NOW()),
(3, -6.53420000, 106.84120000, 72, 5.0, 'Dekat Apotek Alsyifa Farma Sehat, Sukaraja', NOW()),
(5, -6.45210000, 106.91450000, 91, 3.8, 'Kawasan Cicadas Gunungputri', NOW());

-- Orders (Pencatatan Pesanan & Faktur)
INSERT INTO `orders` (`id`, `invoice_number`, `sales_id`, `customer_id`, `visit_id`, `promo_id`, `order_date`, `subtotal`, `discount_amount`, `tax_amount`, `grand_total`, `payment_method`, `payment_status`, `paid_amount`, `due_date`, `status`, `notes`) VALUES
(1, 'INV-202611-0001', 4, 1, 1, 1, CURRENT_DATE(), 1030000.00, 103000.00, 0.00, 927000.00, 'tempo', 'belum_lunas', 0.00, CURRENT_DATE() + INTERVAL 14 DAY, 'approved', 'Pesanan reguler mingguan Toko Berkah Cibinong'),
(2, 'INV-202611-0002', 4, 5, 2, NULL, CURRENT_DATE(), 650000.00, 0.00, 0.00, 650000.00, 'tunai', 'lunas', 650000.00, NULL, 'approved', 'Pembayaran tunai lunas di tempat oleh kasir'),
(3, 'INV-202611-0003', 3, 2, NULL, 2, CURRENT_DATE() - INTERVAL 1 DAY, 1550000.00, 50000.00, 0.00, 1500000.00, 'transfer', 'lunas', 1500000.00, NULL, 'delivered', 'Order Apotek Alsyifa Farma telah diterima');

-- Order Items
INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `unit`, `price`, `cost_price`, `qty`, `discount_percent`, `total_price`) VALUES
(1, 1, 'Madu Murni Alsyifa 500g', 'botol', 85000.00, 65000.00, 8, 0.00, 680000.00),
(1, 5, 'Sari Kurma Alsyifa Premium 350g', 'botol', 35000.00, 22000.00, 10, 0.00, 350000.00),
(2, 3, 'Habbatussauda Softgel 100s', 'botol', 70000.00, 50000.00, 5, 0.00, 350000.00),
(2, 4, 'Minyak Zaitun Extra Virgin 250ml', 'botol', 50000.00, 35000.00, 6, 0.00, 300000.00),
(3, 2, 'Madu Murni Alsyifa 1kg', 'botol', 155000.00, 120000.00, 10, 0.00, 1550000.00);

-- Payments (Sistem Akuntansi & Setoran Kas Masuk)
INSERT INTO `payments` (`id`, `payment_number`, `order_id`, `sales_id`, `customer_id`, `payment_date`, `amount`, `payment_method`, `proof_image`, `notes`, `received_by`) VALUES
(1, 'PAY-202611-0001', 2, 4, 5, CURRENT_DATE(), 650000.00, 'tunai', '/uploads/kwitansi-001.png', 'Setoran kas penjualan langsung Minimarket Madina', 1),
(2, 'PAY-202611-0002', 3, 3, 2, CURRENT_DATE() - INTERVAL 1 DAY, 1500000.00, 'transfer', '/uploads/bukti-transfer-bca.png', 'Transfer bank BCA No. Ref 98218731', 1);
