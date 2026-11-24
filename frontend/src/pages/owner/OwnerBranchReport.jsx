import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Download,
  Printer,
  RefreshCw,
  Search,
  TrendingUp,
  Store,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function OwnerBranchReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');

  useEffect(() => {
    fetchBranchAnalytics();
  }, [selectedCity]);

  const fetchBranchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.OWNER.ANALYTICS, {
        city: selectedCity !== 'all' ? selectedCity : undefined
      });
      setData(res.data);
    } catch (err) {
      toast.error(err.message || 'Gagal memuat laporan cabang');
    } finally {
      setLoading(false);
    }
  };

  const branches = data?.branch_performance || [];
  const availableCities = data?.available_cities || Array.from(new Set(branches.map(b => b.branch_city)));
  const selectedCityData = selectedCity !== 'all' 
    ? (data?.selected_city_data || branches.find(b => b.branch_city.toLowerCase() === selectedCity.toLowerCase())) 
    : null;

  // Summary Metrics
  const totalBranches = branches.length;
  const totalOutlets = branches.reduce((sum, b) => sum + Number(b.total_customers || 0), 0);
  const totalOrders = branches.reduce((sum, b) => sum + Number(b.total_orders || 0), 0);
  const totalRevenue = branches.reduce((sum, b) => sum + Number(b.revenue || 0), 0);
  const totalCogs = branches.reduce((sum, b) => sum + Number(b.cogs || 0), 0);
  const totalProfit = totalRevenue - totalCogs;
  const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Filtered branches
  const filteredBranches = useMemo(() => {
    if (!search.trim()) return branches;
    const q = search.toLowerCase();
    return branches.filter((b) => b.branch_city.toLowerCase().includes(q));
  }, [branches, search]);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (branches.length === 0) {
      toast.error('Tidak ada data untuk diunduh');
      return;
    }

    const headers = [
      'No',
      'Nama Cabang / Kota',
      'Total Toko / Outlet',
      'Total Faktur Pesanan',
      'Omzet Penjualan (Rp)',
      'Modal HPP (Rp)',
      'Laba Wilayah (Rp)',
      'Margin Laba (%)',
      'Kontribusi Omzet (%)'
    ];

    const rows = branches.map((b, idx) => {
      const rev = Number(b.revenue || 0);
      const contribution = totalRevenue > 0 ? ((rev / totalRevenue) * 100).toFixed(1) : '0';
      return [
        idx + 1,
        `"${b.branch_city.replace(/"/g, '""')}"`,
        b.total_customers,
        b.total_orders,
        rev,
        Number(b.cogs || 0),
        Number(b.profit || 0),
        `"${b.margin_percent}%"`,
        `"${contribution}%"`
      ].join(',');
    });

    // Summary row
    rows.push([
      'TOTAL',
      '"SEMUA CABANG"',
      totalOutlets,
      totalOrders,
      totalRevenue,
      totalCogs,
      totalProfit,
      `"${avgMargin}%"`,
      '"100%"'
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_Cabang_ALSYFA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Laporan Cabang berhasil diunduh (CSV)');
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminLayout>
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Laporan Keuangan & Kontribusi Tiap Cabang
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              <Building2 className="h-3 w-3" /> Laporan Eksekutif
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Analisis omzet penjualan, modal produk (HPP), dan laba bersih per wilayah Kabupaten / Kota operasional ALSYFA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBranchAnalytics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            title="Segarkan Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-sm shadow-emerald-200 transition-all"
            title="Download Spreadsheet CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-sm transition-all"
            title="Cetak Laporan"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </div>

      {/* City Category Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Kategori Kota / Cabang yang Mau Dilihat:
            </h4>
            <p className="text-[11px] text-slate-500">Pilih kategori kota untuk melihat rincian laba spesifik atau pantau seluruh cabang</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">-- Semua Cabang ({branches.length} Wilayah Kota) --</option>
            {availableCities.map((cName) => (
              <option key={cName} value={cName}>
                📍 {cName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Spotlight Selected City Profit Card */}
      {selectedCityData && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-5 text-white shadow-lg mb-6 border border-emerald-600/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-emerald-700/40 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wider border border-emerald-400/30">
                Laba Kategori Kota
              </span>
              <h3 className="text-lg font-black text-white tracking-tight">{selectedCityData.branch_city}</h3>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-400 text-slate-900 shadow-sm self-start sm:self-auto">
              Margin Laba: +{selectedCityData.margin_percent}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] text-slate-400">Omzet Penjualan:</span>
              <p className="text-base font-black text-white font-mono mt-0.5">
                Rp {Number(selectedCityData.revenue).toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-emerald-300 mt-0.5">{selectedCityData.total_orders} Pesanan Faktur</p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] text-slate-400">Modal HPP Produk:</span>
              <p className="text-base font-black text-amber-300 font-mono mt-0.5">
                Rp {Number(selectedCityData.cogs).toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Total beban modal</p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] text-slate-400">Laba Bersih Wilayah:</span>
              <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
                Rp {Number(selectedCityData.profit).toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-emerald-300 font-bold mt-0.5">Margin: +{selectedCityData.margin_percent}%</p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] text-slate-400">Total Outlet Aktif:</span>
              <p className="text-base font-black text-white font-mono mt-0.5">
                {selectedCityData.total_customers} Toko
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Terdaftar di cabang ini</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wilayah Cabang</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 font-mono">
            {totalBranches} Kota / Kab
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Tersebar di {totalOutlets} Outlet Terdaftar
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Omzet Cabang</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 font-mono">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Dari {totalOrders} total pesanan faktur
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modal HPP Produk</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <PieChart className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 font-mono">
            Rp {totalCogs.toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Biaya Pokok Barang Terjual
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/70 to-white p-5 rounded-2xl border border-emerald-300 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Laba Bersih Cabang</span>
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-700 font-mono">
            Rp {totalProfit.toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-emerald-700 font-bold mt-1">
            Rata-rata Margin: +{avgMargin}%
          </p>
        </div>
      </div>

      {/* City Category Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Kategori Kota / Cabang yang Mau Dilihat:
            </h4>
            <p className="text-[11px] text-slate-500">Pilih kategori kota untuk melihat rincian laba spesifik atau pantau seluruh cabang</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">-- Semua Cabang ({branches.length} Wilayah Kota) --</option>
            {availableCities.map((cName) => (
              <option key={cName} value={cName}>
                📍 {cName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Spotlight Selected City Profit Card */}
      {selectedCityData && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-5 text-white shadow-lg mb-6 border border-emerald-600/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-emerald-700/40 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wider border border-emerald-400/30">
                Laba Kategori Kota
              </span>
              <h3 className="text-lg font-black text-white tracking-tight">{selectedCityData.branch_city}</h3>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-400 text-slate-900 shadow-sm self-start sm:self-auto">
              Margin Laba: +{selectedCityData.margin_percent}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] text-slate-400">Omzet Penjualan:</span>
              <p className="text-base font-black text-white font-mono mt-0.5">
                Rp {Number(selectedCityData.revenue).toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-emerald-300 mt-0.5">{selectedCityData.total_orders} Pesanan Faktur</p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] text-slate-400">Modal HPP Produk:</span>
              <p className="text-base font-black text-amber-300 font-mono mt-0.5">
                Rp {Number(selectedCityData.cogs).toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Total beban modal</p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] text-slate-400">Laba Bersih Wilayah:</span>
              <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
                Rp {Number(selectedCityData.profit).toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-emerald-300 font-bold mt-0.5">Margin: +{selectedCityData.margin_percent}%</p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] text-slate-400">Total Outlet Aktif:</span>
              <p className="text-base font-black text-white font-mono mt-0.5">
                {selectedCityData.total_customers} Toko
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Terdaftar di cabang ini</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                Tabel Rincian Kinerja Finansial Tiap Cabang
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan omzet, HPP, laba, dan kontribusi omzet terhadap total penjualan perusahaan.
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64 relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama kota / cabang..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5">Nama Cabang / Wilayah Kota</th>
                <th className="px-4 py-3.5 text-center">Outlet / Toko</th>
                <th className="px-4 py-3.5 text-center">Faktur Pesanan</th>
                <th className="px-4 py-3.5 text-right">Omzet Penjualan</th>
                <th className="px-4 py-3.5 text-right">Modal HPP</th>
                <th className="px-4 py-3.5 text-right">Laba Wilayah</th>
                <th className="px-4 py-3.5 text-center">Margin Laba</th>
                <th className="px-4 py-3.5 text-center">Kontribusi</th>
                <th className="px-4 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBranches.length > 0 ? (
                filteredBranches.map((b, idx) => {
                  const rev = Number(b.revenue || 0);
                  const contribution = totalRevenue > 0 ? ((rev / totalRevenue) * 100).toFixed(1) : 0;
                  const isTopContributor = Number(contribution) >= 40;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
                            {idx + 1}
                          </div>
                          <div>
                            <strong className="text-slate-800 text-xs block font-bold">
                              {b.branch_city}
                            </strong>
                            <span className="text-[10px] text-slate-400">Distribusi Aktif ALSYFA</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                        {b.total_customers} Toko
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                        {b.total_orders} Order
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 font-mono">
                        Rp {rev.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-500 font-mono">
                        Rp {Number(b.cogs || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-600 font-mono">
                        Rp {Number(b.profit || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {b.margin_percent}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold font-mono text-slate-700">
                        {contribution}%
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {isTopContributor ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            <CheckCircle2 className="h-3 w-3" /> Utama
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Aktif
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                    {search ? 'Tidak ada cabang kota yang cocok dengan kata kunci pencarian.' : 'Belum ada data transaksi cabang kota.'}
                  </td>
                </tr>
              )}
            </tbody>
            {/* Footer Summary Row */}
            {filteredBranches.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-800">
                <tr>
                  <td className="px-4 py-3">TOTAL SELURUH CABANG</td>
                  <td className="px-4 py-3 text-center">{totalOutlets} Toko</td>
                  <td className="px-4 py-3 text-center">{totalOrders} Order</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-900">
                    Rp {totalRevenue.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    Rp {totalCogs.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700 font-black">
                    Rp {totalProfit.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-center text-emerald-700">+{avgMargin}%</td>
                  <td className="px-4 py-3 text-center">100%</td>
                  <td className="px-4 py-3 text-center">-</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
