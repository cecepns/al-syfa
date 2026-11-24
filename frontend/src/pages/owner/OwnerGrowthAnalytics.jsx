import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  RefreshCw,
  Calendar,
  DollarSign,
  PieChart,
  ArrowUpRight,
  LineChart as LineChartIcon,
  Layers
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

// Chart.js & React-Chartjs-2
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

export default function OwnerGrowthAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChartTab, setActiveChartTab] = useState('monthly'); // 'monthly' | 'yearly'
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line'

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

  // Summary of active periods
  const totalPeriodRevenue = activeGrowthData.reduce((sum, d) => sum + Number(d.revenue || 0), 0);
  const totalPeriodCogs = activeGrowthData.reduce((sum, d) => {
    const cogsVal = d.cogs !== undefined ? Number(d.cogs || 0) : Math.max(0, Number(d.revenue || 0) - Number(d.profit || 0));
    return sum + cogsVal;
  }, 0);
  const totalPeriodProfit = activeGrowthData.reduce((sum, d) => sum + Number(d.profit || 0), 0);
  const avgMargin = totalPeriodRevenue > 0 ? ((totalPeriodProfit / totalPeriodRevenue) * 100).toFixed(1) : 0;

  // Prepare Data for Chart.js
  const chartLabels = activeGrowthData.map((d) => d.label || d.period || d.year);
  const revenueSeries = activeGrowthData.map((d) => Number(d.revenue || 0));
  const cogsSeries = activeGrowthData.map((d) =>
    d.cogs !== undefined ? Number(d.cogs || 0) : Math.max(0, Number(d.revenue || 0) - Number(d.profit || 0))
  );
  const profitSeries = activeGrowthData.map((d) => Number(d.profit || 0));

  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Omzet Penjualan',
        data: revenueSeries,
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        borderColor: '#2563eb',
        borderWidth: 1.5,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(37, 99, 235, 1)',
      },
      {
        label: 'Modal HPP Produk',
        data: cogsSeries,
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        borderColor: '#d97706',
        borderWidth: 1.5,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(217, 119, 6, 1)',
      },
      {
        label: 'Laba Bersih',
        data: profitSeries,
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderColor: '#059669',
        borderWidth: 1.5,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(5, 150, 105, 1)',
      },
    ],
  };

  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Omzet Penjualan',
        data: revenueSeries,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#2563eb',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Modal HPP Produk',
        data: cogsSeries,
        borderColor: '#d97706',
        backgroundColor: 'rgba(217, 119, 6, 0.08)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#d97706',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Laba Bersih',
        data: profitSeries,
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.15)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#059669',
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          font: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 12,
            weight: '600',
          },
          color: '#334155',
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12, family: 'monospace' },
        padding: 12,
        cornerRadius: 10,
        boxPadding: 6,
        callbacks: {
          label: function (context) {
            const val = context.raw || 0;
            return ` ${context.dataset.label}: Rp ${Number(val).toLocaleString('id-ID')}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            weight: '600',
          },
        },
      },
      y: {
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            family: 'monospace',
          },
          callback: function (val) {
            if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)} Jt`;
            if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)} Rb`;
            return `Rp ${val}`;
          },
        },
      },
    },
  };

  // Doughnut Composition Data (HPP vs Laba Bersih)
  const doughnutData = {
    labels: ['Modal HPP', 'Laba Bersih'],
    datasets: [
      {
        data: [totalPeriodCogs, totalPeriodProfit],
        backgroundColor: ['rgba(245, 158, 11, 0.85)', 'rgba(16, 185, 129, 0.85)'],
        borderColor: ['#d97706', '#059669'],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          font: { size: 11, weight: '600' },
          color: '#475569',
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: function (context) {
            const val = context.raw || 0;
            const pct = totalPeriodRevenue > 0 ? ((val / totalPeriodRevenue) * 100).toFixed(1) : 0;
            return ` ${context.label}: Rp ${Number(val).toLocaleString('id-ID')} (${pct}%)`;
          },
        },
      },
    },
  };

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
      <div className="space-y-6">
        {/* Header & Action Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Grafik Pertumbuhan & Analitik Bisnis
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <BarChart3 className="h-3 w-3" /> Chart Interaktif
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Visualisasi tren keuangan dan performa bisnis ALSYFA (Omzet vs Modal HPP vs Laba Bersih) menggunakan engine grafik interaktif.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Monthly vs Yearly */}
            <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-sm">
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
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-sm shadow-emerald-200 transition-all shrink-0"
              title="Download CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-sm transition-all shrink-0"
              title="Cetak Laporan"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          </div>
        </div>

        {/* KPI Cards Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Omzet Periode</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 font-mono tracking-tight">
              Rp {totalPeriodRevenue.toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Akumulasi omzet periode {activeChartTab === 'monthly' ? 'bulanan' : 'tahunan'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Modal HPP</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <PieChart className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 font-mono tracking-tight">
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
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
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
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              +{avgMargin}%
            </h3>
            <p className="text-[11px] text-emerald-700 font-bold mt-1">
              Rasio laba terhadap total omzet
            </p>
          </div>
        </div>

        {/* Charts Section: Main Growth Chart + Doughnut Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Chart (Bar / Line) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  Grafik Pertumbuhan Finansial ({activeChartTab === 'monthly' ? 'Bulanan' : 'Tahunan'})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbandingan Omzet, Beban HPP Produk, dan Laba Bersih secara interaktif.
                </p>
              </div>

              {/* Chart Style Switcher (Bar vs Line) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                    chartType === 'bar'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Batang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('line')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                    chartType === 'line'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LineChartIcon className="h-3.5 w-3.5" />
                  <span>Garis Area</span>
                </button>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="h-72 sm:h-80 w-full relative">
              {activeGrowthData.length > 0 ? (
                chartType === 'bar' ? (
                  <Bar data={barChartData} options={chartOptions} />
                ) : (
                  <Line data={lineChartData} options={chartOptions} />
                )
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Belum ada data riwayat analitik untuk grafik ini.
                </div>
              )}
            </div>
          </div>

          {/* Doughnut Chart: Komposisi Finansial */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-amber-500" />
                Struktur Omzet & Margin
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rasio Modal HPP vs Laba Bersih
              </p>
            </div>

            <div className="h-52 w-full my-3 relative flex items-center justify-center">
              {totalPeriodRevenue > 0 ? (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              ) : (
                <p className="text-xs text-slate-400">Belum ada transaksi</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200/60 text-center">
                <span className="text-[10px] text-amber-700 font-bold block uppercase">Modal HPP</span>
                <span className="text-xs font-black text-amber-900 font-mono">
                  {totalPeriodRevenue > 0 ? ((totalPeriodCogs / totalPeriodRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/60 text-center">
                <span className="text-[10px] text-emerald-700 font-bold block uppercase">Laba Bersih</span>
                <span className="text-xs font-black text-emerald-900 font-mono">
                  +{avgMargin}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Growth Breakdown Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                Tabel Rincian Tren Historis ({activeChartTab === 'monthly' ? 'Bulanan' : 'Tahunan'})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Data terakumulasi dari pesanan faktur transaksi sales ALSYFA
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
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
                        <td className="px-4 py-3.5 text-right font-black text-slate-900 font-mono">
                          Rp {rev.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-slate-500 font-mono">
                          Rp {cogsVal.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-emerald-700 font-mono">
                          Rp {profit.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 font-black text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
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
      </div>
    </AdminLayout>
  );
}
