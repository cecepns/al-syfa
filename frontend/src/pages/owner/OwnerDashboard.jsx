import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Building2,
  Package,
  Truck,
  Wallet,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function OwnerDashboard() {
  const user = JSON.parse(localStorage.getItem('alsyifa_user') || '{"name":"Owner ALSYFA","role":"owner"}');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChartTab, setActiveChartTab] = useState('monthly'); // 'monthly' | 'yearly'

  useEffect(() => {
    fetchOwnerAnalytics();
  }, []);

  const fetchOwnerAnalytics = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.OWNER.ANALYTICS);
      setData(res.data);
    } catch (err) {
      toast.error(err.message || 'Gagal memuat analitik keuangan Owner');
    } finally {
      setLoading(false);
    }
  };

  const capital = data?.capital || {};
  const financials = data?.global_profit || {};
  const branchCities = data?.branch_performance || [];
  const monthlyGrowth = data?.growth_chart?.monthly || [];
  const yearlyGrowth = data?.growth_chart?.yearly || [];

  const activeGrowthData = activeChartTab === 'monthly' ? monthlyGrowth : yearlyGrowth;
  const maxRevenue = Math.max(...activeGrowthData.map((d) => Number(d.revenue || 0)), 1);

  return (
    <AdminLayout>
      {/* Page Title & Refresh Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Dashboard Eksekutif & Analisis Keuangan
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Shield className="h-3 w-3" /> Akun Khusus Owner
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ringkasan modal aktif, laba kotor & bersih global, kontribusi performa per cabang, dan tren pertumbuhan bisnis ALSYFA.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOwnerAnalytics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            title="Segarkan Data Keuangan"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Welcome Banner Card (Clean White Aesthetic) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" /> Ikhtisar Eksekutif Perusahaan ALSYFA
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-800">
            Selamat Datang, {user.name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Data keuangan, perputaran modal produk snack coklat, margin laba operasional, dan performa cabang di seluruh wilayah tercatat secara transparan dan akurat.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-emerald-800 uppercase font-bold block">Status Margin Bersih</span>
            <span className="text-xl font-black text-emerald-700 font-mono">
              +{financials.net_margin_percent || 0}%
            </span>
          </div>
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 4 Core Financial Metrics Cards (Matching Admin KPI Layout) */}
      <div id="laba-global" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Modal Keseluruhan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Modal (Kapital)
              </span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 font-mono tracking-tight">
              Rp {Number(capital.grand_total_capital || 0).toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Stok Gudang Pusat:</span>
              <span className="text-slate-800 font-semibold font-mono">
                Rp {Number(capital.warehouse_inventory || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Stok Kendaraan:</span>
              <span className="text-slate-800 font-semibold font-mono">
                Rp {Number(capital.van_inventory || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Beban Tunjangan:</span>
              <span className="text-slate-800 font-semibold font-mono">
                Rp {Number(capital.total_allowance_capital || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Omzet Penjualan (Revenue) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Omzet Penjualan
              </span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 font-mono tracking-tight">
              Rp {Number(financials.total_revenue || 0).toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Total Pesanan:</span>
              <span className="text-slate-800 font-semibold font-mono">
                {financials.total_orders || 0} Faktur
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Modal HPP Produk:</span>
              <span className="text-slate-800 font-semibold font-mono">
                Rp {Number(financials.total_cogs || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Gross Margin:</span>
              <span className="text-blue-600 font-bold">
                {financials.gross_margin_percent || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Laba Kotor Global */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Laba Kotor (Gross Profit)
              </span>
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <PieChart className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-teal-700 font-mono tracking-tight">
              Rp {Number(financials.gross_profit || 0).toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Selisih Omzet Penjualan dikurangi Modal HPP Produk
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Margin terhadap Omzet:</span>
            <span className="font-bold text-teal-700">
              {financials.gross_margin_percent || 0}%
            </span>
          </div>
        </div>

        {/* Card 4: Laba Bersih Global */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-white p-5 rounded-2xl border border-emerald-300 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Laba Bersih (Net Profit)
              </span>
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              Rp {Number(financials.net_profit || 0).toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-emerald-700/80 mt-1">
              Laba Bersih setelah beban Tunjangan Operasional (BBM + Sewa Motor)
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Net Profit Margin:</span>
            <span className="font-extrabold text-emerald-700 font-mono text-sm">
              +{financials.net_margin_percent || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Laporan Keuangan Tiap Cabang / Kota */}
      <div id="cabang" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                Laporan Keuangan Tiap Cabang / Kota
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rincian omzet, modal produk (HPP), dan laba bersih per wilayah Kabupaten / Kota operasional.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
            {branchCities.length} Wilayah Cabang
          </span>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {branchCities.length > 0 ? (
                branchCities.map((b, idx) => (
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
                      Rp {Number(b.revenue || 0).toLocaleString('id-ID')}
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Belum ada data transaksi cabang kota.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Visual Growth Chart (Monthly & Yearly) */}
      <div id="pertumbuhan" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                Grafik Pertumbuhan & Perbandingan (Omzet vs Modal vs Laba)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualisasi tren pertumbuhan keuangan bulanan (12-Bulan) dan tahunan bisnis ALSYFA.
              </p>
            </div>
          </div>

          {/* Toggle Monthly vs Yearly */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveChartTab('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeChartTab === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan (12 Bulan)
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('yearly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeChartTab === 'yearly'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tahunan
            </button>
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div className="space-y-4 pt-4">
          {activeGrowthData.length > 0 ? (
            activeGrowthData.map((d, i) => {
              const label = d.label || d.period || d.year;
              const cogsVal = d.cogs !== undefined ? Number(d.cogs || 0) : Math.max(0, Number(d.revenue || 0) - Number(d.profit || 0));
              const revPct = Math.min(100, Math.round((Number(d.revenue || 0) / maxRevenue) * 100));
              const cogsPct = Math.min(100, Math.round((cogsVal / maxRevenue) * 100));
              const profitPct = Math.min(100, Math.round((Number(d.profit || 0) / maxRevenue) * 100));

              return (
                <div key={i} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="font-extrabold text-slate-800 font-mono text-sm">{label}</span>
                    <div className="flex items-center gap-3 text-[11px] font-mono flex-wrap">
                      <span className="text-blue-600 font-bold">
                        Omzet: Rp {Number(d.revenue || 0).toLocaleString('id-ID')}
                      </span>
                      <span className="text-amber-600 font-semibold">
                        Modal: Rp {Number(cogsVal).toLocaleString('id-ID')}
                      </span>
                      <span className="text-emerald-700 font-black">
                        Laba: Rp {Number(d.profit || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Multi-layered progress bars */}
                  <div className="space-y-1.5 pt-1">
                    {/* Revenue Bar */}
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-[10px] text-slate-500 font-medium">Omzet</span>
                      <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(revPct, 3)}%` }}
                        />
                      </div>
                    </div>

                    {/* COGS (Modal) Bar */}
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-[10px] text-slate-500 font-medium">Modal</span>
                      <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-2.5 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(cogsPct, 3)}%` }}
                        />
                      </div>
                    </div>

                    {/* Profit Bar */}
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-[10px] text-emerald-700 font-bold">Laba</span>
                      <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2.5 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(profitPct, 3)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center py-8 text-xs text-slate-400">
              Belum ada data riwayat pertumbuhan pada periode ini.
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
