import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart3 as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Printer as PrinterIcon,
  RefreshCw as RefreshCwIcon,
  Calendar as CalendarIcon,
  DollarSign as DollarSignIcon,
  PieChart as PieChartIcon,
  ArrowUpRight as ArrowUpRightIcon
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function OwnerGrowthAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChartTab, setActiveChartTab] = useState('monthly'); // 'monthly' | 'yearly'

  useEffect(() => {
    fetchGrowthAnalytics();
  }, []);

  const fetchGrowthAnalytics = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.OWNER.ANALYTICS);
      setData(res.data);
    } catch (err) {
      toast.error(err.message || 'Gagal memuat analitik pertumbuhan');
    } finally {
      setLoading(false);
    }
  };

  const monthlyGrowth = data?.growth_chart?.monthly || [];
  const yearlyGrowth = data?.growth_chart?.yearly || [];
  const activeGrowthData = activeChartTab === 'monthly' ? monthlyGrowth : yearlyGrowth;

  const maxRevenue = Math.max(...activeGrowthData.map((d) => Number(d.revenue || 0)), 1);

  // Summary of active periods
  const totalPeriodRevenue = activeGrowthData.reduce((sum, d) => sum + Number(d.revenue || 0), 0);
  const totalPeriodCogs = activeGrowthData.reduce((sum, d) => {
    const cogsVal = d.cogs !== undefined ? Number(d.cogs || 0) : Math.max(0, Number(d.revenue || 0) - Number(d.profit || 0));
    return sum + cogsVal;
  }, 0);
  const totalPeriodProfit = activeGrowthData.reduce((sum, d) => sum + Number(d.profit || 0), 0);
  const avgMargin = totalPeriodRevenue > 0 ? ((totalPeriodProfit / totalPeriodRevenue) * 100).toFixed(1) : 0;

  // Export CSV Handler
  const handleExportCSV = () => {
    if (activeGrowthData.length === 0) {
      toast.error('Tidak ada data untuk diunduh');
      return;
    }

    const headers = [
      'No',
      'Periode',
      'Jumlah Faktur',
      'Omzet Penjualan (Rp)',
      'Modal HPP (Rp)',
      'Laba Bersih (Rp)',
      'Margin Laba (%)'
    ];

    const rows = activeGrowthData.map((d, idx) => {
      const label = d.label || d.period || d.year;
      const cogsVal = d.cogs !== undefined ? Number(d.cogs || 0) : Math.max(0, Number(d.revenue || 0) - Number(d.profit || 0));
      const margin = Number(d.revenue || 0) > 0 ? ((Number(d.profit || 0) / Number(d.revenue || 0)) * 100).toFixed(1) : '0';

      return [
        idx + 1,
        `"${label}"`,
        d.orders || d.order_count || 0,
        Number(d.revenue || 0),
        cogsVal,
        Number(d.profit || 0),
        `"${margin}%"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Pertumbuhan_${activeChartTab}_ALSYFA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Laporan Pertumbuhan berhasil diunduh (CSV)');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminLayout>
      {/* Header & Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Grafik Pertumbuhan & Analitik Bisnis
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              <BarChartIcon className="h-3 w-3" /> Analitik Tren
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Visualisasi tren pertumbuhan keuangan bulanan (12-Bulan) dan tahunan bisnis ALSYFA (Omzet vs Modal vs Laba).
          </p>
        </div>

        <div className="flex items-center gap-2">
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
              Bulanan
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

          <button
            onClick={fetchGrowthAnalytics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            title="Segarkan Data"
          >
            <RefreshCwIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-sm shadow-emerald-200 transition-all"
            title="Download CSV"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-sm transition-all"
            title="Cetak Laporan"
          >
            <PrinterIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Omzet Periode</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSignIcon className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 font-mono">
            Rp {totalPeriodRevenue.toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Akumulasi omzet penjualan periode {activeChartTab === 'monthly' ? 'bulanan' : 'tahunan'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Modal HPP</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <PieChartIcon className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 font-mono">
            Rp {totalPeriodCogs.toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Biaya Pokok Penjualan (HPP Modal)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Laba Bersih</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUpIcon className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 font-mono">
            Rp {totalPeriodProfit.toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            Selisih omzet dikurangi HPP
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/70 to-white p-5 rounded-2xl border border-emerald-300 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Rata-rata Margin</span>
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
              <ArrowUpRightIcon className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-700 font-mono">
            +{avgMargin}%
          </h3>
          <p className="text-[11px] text-emerald-700 font-bold mt-1">
            Rasio laba terhadap total omzet
          </p>
        </div>
      </div>

      {/* Main Visual Progress Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 mb-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Visualisasi Tren Pertumbuhan ({activeChartTab === 'monthly' ? 'Bulanan' : 'Tahunan'})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Grafik horizontal interaktif perbandingan Omzet (Biru), Modal HPP (Kuning/Amber), dan Laba (Hijau).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-slate-600">Omzet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-slate-600">Modal HPP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-emerald-600" />
              <span className="text-slate-600">Laba</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
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
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-[10px] text-slate-500 font-medium">Omzet</span>
                      <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(revPct, 3)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-12 text-[10px] text-slate-500 font-medium">Modal</span>
                      <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-2.5 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(cogsPct, 3)}%` }}
                        />
                      </div>
                    </div>

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

      {/* Historical Growth Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-800">
            Tabel Rincian Tren Historis ({activeChartTab === 'monthly' ? 'Bulanan' : 'Tahunan'})
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl">
            {activeGrowthData.length} Periode Tercatat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5">Periode</th>
                <th className="px-4 py-3.5 text-center">Faktur Pesanan</th>
                <th className="px-4 py-3.5 text-right">Omzet Penjualan</th>
                <th className="px-4 py-3.5 text-right">Modal HPP</th>
                <th className="px-4 py-3.5 text-right">Laba Bersih</th>
                <th className="px-4 py-3.5 text-center">Margin Laba</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {activeGrowthData.length > 0 ? (
                activeGrowthData.map((d, idx) => {
                  const label = d.label || d.period || d.year;
                  const cogsVal = d.cogs !== undefined ? Number(d.cogs || 0) : Math.max(0, Number(d.revenue || 0) - Number(d.profit || 0));
                  const rev = Number(d.revenue || 0);
                  const profit = Number(d.profit || 0);
                  const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-800 font-mono">
                        {label}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                        {d.orders || d.order_count || 0} Faktur
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 font-mono">
                        Rp {rev.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-500 font-mono">
                        Rp {cogsVal.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-600 font-mono">
                        Rp {profit.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          +{margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Belum ada data historis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
