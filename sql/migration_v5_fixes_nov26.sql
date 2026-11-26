-- =======================================================================
-- MIGRATION SCRIPT: PERBAIKAN & SINKRONISASI CABANG (V5)
-- Tanggal: 2026-11-26
-- Kompatibel: MySQL 5.7, MySQL 8.0, MariaDB 10.x, cPanel phpMyAdmin
-- =======================================================================

-- -----------------------------------------------------------------------
-- 1. MODIFIKASI TABEL branch_cities:
-- Menambahkan kolom `source` agar Owner mengetahui apakah kota/cabang
-- baru ditambahkan oleh Owner, Admin (saat membuat rute/toko), atau Sales.
-- -----------------------------------------------------------------------
ALTER TABLE `branch_cities`
  ADD COLUMN `source` VARCHAR(50) NULL DEFAULT 'owner' AFTER `notes`;

-- Catatan:
-- Fitur pelunasan piutang, target bulanan (invoice_number), tunjangan ops,
-- laporan hit rate, serta kategori toko transaksi (Tanggal/Bulan/Tahun)
-- menggunakan tabel yang sudah ada (customers, orders, payments, visits,
-- operational_allowances, sales_targets, daily_deposits) tanpa mengubah
-- struktur kolom lain.

-- =======================================================================
-- MIGRATION V5 SELESAI
-- =======================================================================
