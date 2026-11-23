# Alsyifa Sales Management System

Aplikasi mobile-first (PWA) dan Dashboard Manajemen Sales Lapangan untuk distribusi produk herbal dan consumer goods PT Alsyifa Sehat Herbal Indonesia.

Aplikasi ini dikembangkan sesuai pedoman arsitektur clean-code pada `AGENTS.md`, spesifikasi `FITUR Aplikasi Mobile untuk Sales.docx`, dan integrasi data wilayah Indonesia via [wilayah.id](https://wilayah.id/).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite (JSX)
- **PWA (Progressive Web App)**: `vite-plugin-pwa` (Workbox)
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Notifications & Dialogs**: `react-hot-toast` (Alert, Confirm, Success, Error)
- **Routing**: `react-router-dom` v6
- **HTTP Client**: Axios (dengan arsitektur util terpusat: `src/utils/api.js`, `src/utils/endpoints.js`, `src/utils/request.js`)
- **Map & Geolocation**: Leaflet & Geolocation API
- **Printing**: Mobile Thermal Bluetooth Printing (58mm/80mm ESC/POS compatible)

### Backend
- **Framework**: Express.js
- **Database**: MySQL (`mysql2/promise`)
- **API Style**: REST API dengan format respon standar, paginasi, pencarian debounce, sorting & filtering
- **File Uploads**: Multer (`backend/uploads-alsyifa/`)
- **Security & Auth**: JWT (JSON Web Tokens), `bcryptjs`, CORS, Dotenv, SQL Injection Prevention via Parameterized Queries
- **Integrasi Wilayah**: Endpoint proxy backend ke `https://wilayah.id/api/` dengan in-memory cache dan fallback lokal

---

## 📱 Fitur Utama Aplikasi

### 1. Aplikasi Mobile untuk Sales (Mobile-First PWA)
1. **GPS Tracking & Check-In/Check-Out Kunjungan**:
   - Deteksi titik lokasi toko/outlet (latitude, longitude, akurasi GPS).
   - Pengambilan foto fisik toko / selfie kunjungan.
   - Durasi kunjungan dan pencatatan hasil kunjungan (*Closing Order*, *Follow Up*, *Toko Tutup*, dsb).
2. **Pemetaan & Optimasi Rute (Senin – Sabtu)**:
   - Pengaturan area kerja dari hari Senin – Sabtu.
   - Pilihan Kecamatan dan Desa/Kelurahan terintegrasi `wilayah.id`.
   - Jalur kunjungan toko terurut dan terhindar dari tumpang tindih.
3. **Pencatatan Pesanan (Order Capturing) & Faktur**:
   - Pembuatan nota pesanan langsung di toko saat kunjungan.
   - Pilihan stok produk dari kendaraan (Van) atau gudang.
   - Diskon otomatis jika memenuhi syarat agenda promo pusat.
   - Pilihan pembayaran: Tunai (Cash), Transfer Bank, atau Tempo (Kredit).
4. **Pencetakan Bukti Pesanan/Faktur (Mobile Printing)**:
   - Format struk mini thermal printer Bluetooth (58mm/80mm).
   - Opsi direct print dialog browser dan salin teks format nota thermal.
5. **Manajemen Stok Kendaraan (Van Sales & Motoris)**:
   - Pencatatan stok awal hari, barang laku/terjual, dan sisa stok fisik di kendaraan.
   - Fitur retur / pengembalian sisa stok ke gudang di akhir hari.
6. **Database Pelanggan (Contact Database)**:
   - Data toko lengkap: nama, foto, alamat, jenis toko (Ritel, Grosir, Agen, Apotek/Klinik).
   - Riwayat belanja dan interaksi sebelumnya.
   - Tombol satu-klik langsung terhubung ke **WhatsApp** dengan pesan template otomatis.
7. **Fitur Promosi Pusat**:
   - Sales melihat katalog program promo aktif dari kantor pusat.
8. **Absensi Lapangan (08.00 – 15.00)**:
   - Jam masuk mulai 08.00 WIB dengan foto selfie dan koordinat GPS.
   - **Ketentuan Khusus**: Sales **tidak bisa absen pulang sebelum pukul 15.00 WIB** di area kerja.

### 2. Dashboard untuk Supervisor dan Manajemen (Office Panel)
1. **Monitoring Real-Time (Peta Digital GPS)**:
   - Memantau lokasi terkini sales di peta interaktif, level baterai HP, dan jumlah kunjungan harian.
2. **Manajemen Wilayah & Rute (Territory Management)**:
   - Membagi zona kerja Senin – Sabtu antar-sales (Kecamatan & Desa).
3. **Validasi & Persetujuan Pesanan**:
   - Review faktur order yang masuk dari sales sebelum diproses gudang/pengiriman.
4. **Laporan Otomatis & KPI**:
   - Rasio *Hit Rate* (kunjungan vs transaksi closing order).
   - Performa penjualan harian & bulanan per sales.
   - Cetak laporan PDF/print view.
5. **Sistem Akuntansi & Pembukuan**:
   - Catatan arus kas masuk dari setoran tunai & transfer sales.
   - Rekapitulasi piutang tempo toko dan jatuh tempo pembayaran.
6. **Agenda Promo Bulanan**:
   - Tambah, edit, dan atur periode promo bulanan beserta diskonnya.
7. **Monitoring Absensi Seluruh Cabang**:
   - Rekap absensi masuk/pulang seluruh sales dengan foto selfie & titik GPS.

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Database MySQL
Pastikan MySQL aktif di komputer lokal (`127.0.0.1:3306`). File SQL export telah tersedia di:
```bash
sql/database.sql
```
Untuk mengimpor database:
```bash
mysql -u root < sql/database.sql
```

### 2. Menjalankan Backend API
```bash
cd backend
npm install
npm start
# Server berjalan di http://localhost:5001
```

### 3. Menjalankan Frontend PWA
```bash
cd frontend
npm install
npm run dev
# Aplikasi dapat diakses di http://localhost:5173
```

---

## 👥 Akun Demo Pengujian

Semua akun menggunakan password: `password123`

| Username | Role | Nama Petugas | Keterangan |
| :--- | :--- | :--- | :--- |
| `admin` | Admin / Sales Manager | Cecep Hendrawan | Akses penuh dashboard manajemen |
| `supervisor` | Supervisor | Hendra Wijaya | Monitoring sales lapangan & approval |
| `sales2` | Sales Lapangan (Van 1) | Budi Santoso | Sales Mobil Van (B 9182 SFA) |
| `sales1` | Sales Lapangan (Motoris) | Ahmad Fauzi | Sales Motoris (F 4521 ABC) |
| `sales3` | Sales Lapangan (Van 2) | Doni Pratama | Sales Mobil Box (B 8820 KDA) |

---

## 📂 Struktur Folder Proyek

```
alsyifa-sales/
├── .gitignore                      # Git ignore standar
├── AGENTS.md                       # Pedoman aturan arsitektur & coding
├── FITUR Aplikasi Mobile untuk Sales.docx
├── README.md                       # Dokumentasi lengkap proyek
├── sql/
│   └── database.sql                # Skema tabel lengkap & seed data
├── backend/
│   ├── .env                        # Environment variable (DB, JWT, Port)
│   ├── package.json
│   ├── uploads-alsyifa/            # Folder upload gambar toko & selfie absensi
│   └── server.js                   # 1 file server utama Express + MySQL REST API
└── frontend/
    ├── .env                        # VITE_API_URL
    ├── package.json
    ├── vite.config.js              # Konfigurasi Vite & PWA
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                 # Routing sistem
        ├── index.css
        ├── hooks/
        │   ├── useDebounce.js      # Debounce search minimal 350ms
        │   └── useGeolocation.js   # GPS location hook
        ├── utils/
        │   ├── api.js              # Axios instance
        │   ├── endpoints.js        # Daftar endpoint terpusat
        │   └── request.js          # Reusable HTTP helpers
        ├── components/
        │   ├── common/
        │   │   ├── Modal.jsx       # Modal dialog form
        │   │   ├── Pagination.jsx  # Paginasi tabel
        │   │   ├── SearchInput.jsx # Input pencarian realtime debounce
        │   │   ├── ConfirmDialog.jsx
        │   │   ├── ReceiptModal.jsx# Format struk thermal bluetooth
        │   │   └── CameraCapture.jsx# Kamera selfie absensi & check-in
        │   └── layout/
        │       ├── AdminLayout.jsx # Layout dashboard supervisor
        │       └── MobileLayout.jsx# Layout mobile-first sales
        └── pages/
            ├── Login.jsx
            ├── admin/              # Panel Supervisor & Manajemen
            │   ├── Dashboard.jsx
            │   ├── LiveTracking.jsx
            │   ├── TerritoryRoutes.jsx
            │   ├── OrdersApproval.jsx
            │   ├── SalesReports.jsx
            │   ├── AccountingFinance.jsx
            │   ├── Customers.jsx
            │   ├── Products.jsx
            │   ├── VanStockManagement.jsx
            │   ├── Promotions.jsx
            │   └── AttendanceMonitor.jsx
            └── sales/              # Aplikasi Mobile Sales
                ├── SalesHome.jsx
                ├── Attendance.jsx
                ├── RouteSchedule.jsx
                ├── CustomerList.jsx
                ├── VisitCheckIn.jsx
                ├── OrderCapture.jsx
                ├── VanStock.jsx
                └── PromoCatalog.jsx
```
# al-syfa
