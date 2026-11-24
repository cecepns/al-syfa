import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  LogOut,
  Smartphone,
  LayoutDashboard,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function OwnerDashboard() {
  const navigate = useNavigate();
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

  const handleLogout = () => {
    localStorage.removeItem('alsyifa_token');
    localStorage.removeItem('alsyifa_user');
    toast.success('Berhasil keluar');
    navigate('/login');
  };

  const capital = data?.capital || {};
  const financials = data?.global_profit || {};
  const branchCities = data?.branch_performance || [];
  const monthlyGrowth = data?.growth_chart?.monthly || [];
  const yearlyGrowth = data?.growth_chart?.yearly || [];

  const activeGrowthData = activeChartTab === 'monthly' ? monthlyGrowth : yearlyGrowth;
  const maxRevenue = Math.max(...activeGrowthData.map((d) => Number(d.revenue || 0)), 1);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-lg shadow-emerald-950/50">
            <div className="h-full w-full bg-slate-950 rounded-[14px] p-1 flex items-center justify-center">
              <img
                src="/logo-transparent.png"
                alt="Logo ALSYFA"
                className="h-full w-full object-contain filter drop-shadow"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                ALSYFA <span className="text-emerald-400 font-extrabold text-xs uppercase bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">Owner Executive</span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400">
              {user.name} • Laporan Keuangan Global & Analitik Bisnis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOwnerAnalytics}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Segarkan Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <Link
            to="/admin"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-emerald-400" />
            <span>Ke Panel Supervisor</span>
          </Link>

          <Link
            to="/sales"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
          >
            <Smartphone className="h-3.5 w-3.5 text-blue-400" />
            <span>Simulasi Sales Mobile</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-xs font-bold text-red-300 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Welcome Greeting */}
        <div className="bg-gradient-to-r from-emerald-900/60 via-slate-900 to-slate-900 p-6 rounded-3xl border border-emerald-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              <Shield className="h-4 w-4" /> Ikhtisar Eksekutif Perusahaan
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Laporan Keuangan & Kinerja Bisnis ALSYFA
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Pantau total modal aktif, laba kotor & bersih global, kontribusi performa per cabang kota, serta pertumbuhan bisnis secara transparan.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 p-3 rounded-2xl shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Status Margin Bersih</span>
              <span className="text-lg font-black text-emerald-400">
                +{financials.net_margin_percent || 0}%
              </span>
            </div>
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* 4 Core Financial Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Modal Keseluruhan */}
          <div className="bg-slate-950/60 rounded-3xl p-5 border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Modal (Kapital)
              </span>
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white font-mono">
              Rp {Number(capital.grand_total_capital || 0).toLocaleString('id-ID')}
            </h3>
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Stok Gudang Pusat:</span>
                <span className="text-slate-200 font-semibold font-mono">
                  Rp {Number(capital.warehouse_inventory || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Stok di Kendaraan:</span>
                <span className="text-slate-200 font-semibold font-mono">
                  Rp {Number(capital.van_inventory || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Beban Tunjangan:</span>
                <span className="text-slate-200 font-semibold font-mono">
                  Rp {Number(capital.total_allowance_capital || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Omzet Penjualan (Revenue) */}
          <div className="bg-slate-950/60 rounded-3xl p-5 border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Omzet Penjualan
              </span>
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white font-mono">
              Rp {Number(financials.total_revenue || 0).toLocaleString('id-ID')}
            </h3>
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Total Transaksi Order:</span>
                <span className="text-slate-200 font-semibold font-mono">
                  {financials.total_orders || 0} Faktur
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Harga Pokok (HPP Modal):</span>
                <span className="text-slate-200 font-semibold font-mono">
                  Rp {Number(financials.total_cogs || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Gross Margin:</span>
                <span className="text-blue-400 font-bold">
                  {financials.gross_margin_percent || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Laba Kotor Global */}
          <div className="bg-slate-950/60 rounded-3xl p-5 border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Laba Kotor (Gross Profit)
              </span>
              <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl">
                <PieChart className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-teal-400 font-mono">
              Rp {Number(financials.gross_profit || 0).toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Selisih Omzet Penjualan dengan Modal HPP Produk
            </p>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Margin terhadap Omzet:</span>
              <span className="font-bold text-teal-300">
                {financials.gross_margin_percent || 0}%
              </span>
            </div>
          </div>

          {/* Card 4: Laba Bersih Global */}
          <div className="bg-gradient-to-br from-emerald-950/80 via-slate-950 to-slate-950 rounded-3xl p-5 border border-emerald-600/50 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Laba Bersih (Net Profit)
              </span>
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-emerald-400 font-mono">
              Rp {Number(financials.net_profit || 0).toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-emerald-200/80 mt-1">
              Laba Bersih setelah beban Tunjangan Operasional (BBM + Sewa Motor)
            </p>
            <div className="mt-3 pt-3 border-t border-emerald-800/40 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Net Profit Margin:</span>
              <span className="font-extrabold text-emerald-400 text-xs">
                {financials.net_margin_percent || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Laporan Keuangan Tiap Cabang / Kota */}
        <div className="bg-slate-950/60 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-extrabold text-white">
                  Laporan Keuangan Tiap Cabang / Kota
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rincian omzet, modal produk (HPP), dan laba bersih per wilayah Kabupaten / Kota operasional.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              {branchCities.length} Wilayah Cabang
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Nama Cabang / Wilayah Kota</th>
                  <th className="px-4 py-3 text-center">Outlet / Toko</th>
                  <th className="px-4 py-3 text-center">Faktur Pesanan</th>
                  <th className="px-4 py-3 text-right">Omzet Penjualan</th>
                  <th className="px-4 py-3 text-right">Modal HPP</th>
                  <th className="px-4 py-3 text-right">Laba Wilayah</th>
                  <th className="px-4 py-3 text-center">Margin Laba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {branchCities.length > 0 ? (
                  branchCities.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <strong className="text-white text-xs block font-bold">
                              {b.branch_city}
                            </strong>
                            <span className="text-[10px] text-slate-500">Distribusi Aktif ALSYFA</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-200">
                        {b.total_customers} Toko
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-200">
                        {b.total_orders} Order
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-white font-mono">
                        Rp {Number(b.revenue || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-400 font-mono">
                        Rp {Number(b.cogs || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-400 font-mono">
                        Rp {Number(b.profit || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {b.margin_percent}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Belum ada data transaksi cabang kota.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Visual Growth Chart (Monthly & Yearly) */}
        <div className="bg-slate-950/60 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-extrabold text-white">
                  Grafik Pertumbuhan & Perbandingan (Omzet vs Modal vs Laba)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualisasi tren pertumbuhan keuangan bulanan (12-Bulan) dan tahunan bisnis ALSYFA.
              </p>
            </div>

            {/* Toggle Monthly vs Yearly */}
            <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveChartTab('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeChartTab === 'monthly'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
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
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tahunan
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-4 pt-2">
            {activeGrowthData.length > 0 ? (
              activeGrowthData.map((d, i) => {
                const label = d.label || d.period || d.year;
                const cogsVal = d.cogs !== undefined ? Number(d.cogs || 0) : Math.max(0, Number(d.revenue || 0) - Number(d.profit || 0));
                const revPct = Math.min(100, Math.round((Number(d.revenue || 0) / maxRevenue) * 100));
                const cogsPct = Math.min(100, Math.round((cogsVal / maxRevenue) * 100));
                const profitPct = Math.min(100, Math.round((Number(d.profit || 0) / maxRevenue) * 100));

                return (
                  <div key={i} className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-white font-mono">{label}</span>
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className="text-blue-400 font-bold">
                          Omzet: Rp {Number(d.revenue || 0).toLocaleString('id-ID')}
                        </span>
                        <span className="text-amber-400 font-semibold">
                          Modal: Rp {Number(cogsVal).toLocaleString('id-ID')}
                        </span>
                        <span className="text-emerald-400 font-black">
                          Laba: Rp {Number(d.profit || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Multi-layered progress bars */}
                    <div className="space-y-1.5 pt-1">
                      {/* Revenue Bar */}
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-[10px] text-slate-400">Omzet</span>
                        <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-blue-500 h-2.5 rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(revPct, 4)}%` }}
                          />
                        </div>
                      </div>

                      {/* COGS (Modal) Bar */}
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-[10px] text-slate-400">Modal</span>
                        <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-amber-500/80 h-2.5 rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(cogsPct, 3)}%` }}
                          />
                        </div>
                      </div>

                      {/* Profit Bar */}
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-[10px] text-slate-400 font-bold text-emerald-400">Laba</span>
                        <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(profitPct, 3)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-8 text-xs text-slate-500">
                Belum ada data riwayat pertumbuhan pada periode ini.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
