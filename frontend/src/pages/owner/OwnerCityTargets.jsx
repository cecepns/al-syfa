import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Building2,
  Calendar,
  Package,
  Boxes,
  DollarSign,
  TrendingUp,
  Download,
  Printer,
  Edit2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Award,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
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
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function OwnerCityTargets() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );

  // Modal Atur Target Kota
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    city_name: '',
    target_pack: 0,
    target_dus: 0,
    target_rupiah: 0,
    notes: '',
  });

  useEffect(() => {
    fetchCityTargets();
  }, [selectedMonth]);

  const fetchCityTargets = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.OWNER.CITY_TARGETS, {
        month: selectedMonth,
      });
      setData(res.data);
    } catch (err) {
      toast.error(err.message || 'Gagal memuat target kota');
    } finally {
      setLoading(false);
    }
  };

  const cities = data?.cities || [];
  const summary = data?.summary || {
    target_pack: 0,
    target_dus: 0,
    target_rupiah: 0,
    actual_pack: 0,
    actual_dus: 0,
    actual_rupiah: 0,
    profit: 0,
  };

  const globalPctRupiah = summary.target_rupiah > 0
    ? Math.min(200, Math.round((summary.actual_rupiah / summary.target_rupiah) * 100))
    : 0;

  // Chart Data: Target vs Realisasi Omzet per Kategori Kota
  const cityTargetChartData = useMemo(() => {
    return {
      labels: cities.map((c) => c.city_name),
      datasets: [
        {
          label: 'Target Omzet (Rp)',
          data: cities.map((c) => Number(c.target_rupiah || 0)),
          backgroundColor: 'rgba(59, 130, 246, 0.85)',
          borderColor: '#2563eb',
          borderWidth: 1.5,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(37, 99, 235, 1)',
        },
        {
          label: 'Realisasi Omzet (Rp)',
          data: cities.map((c) => Number(c.actual_rupiah || 0)),
          backgroundColor: 'rgba(16, 185, 129, 0.85)',
          borderColor: '#059669',
          borderWidth: 1.5,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(5, 150, 105, 1)',
        },
        {
          label: 'Laba Wilayah (Rp)',
          data: cities.map((c) => Number(c.profit || 0)),
          backgroundColor: 'rgba(245, 158, 11, 0.85)',
          borderColor: '#d97706',
          borderWidth: 1.5,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(217, 119, 6, 1)',
        },
      ],
    };
  }, [cities]);

  const cityTargetChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          font: { size: 11, weight: '600' },
          color: '#334155',
          padding: 14,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: function (ctx) {
            return ` ${ctx.dataset.label}: Rp ${Number(ctx.raw || 0).toLocaleString('id-ID')}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11, weight: '600' } },
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#64748b',
          font: { size: 11, family: 'monospace' },
          callback: function (val) {
            if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)} Jt`;
            if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)} Rb`;
            return `Rp ${val}`;
          },
        },
      },
    },
  };

  const handleOpenEdit = (cityItem) => {
    setEditingCity(cityItem);
    setForm({
      city_name: cityItem.city_name,
      target_pack: cityItem.target_pack,
      target_dus: cityItem.target_dus,
      target_rupiah: cityItem.target_rupiah,
      notes: cityItem.notes || '',
    });
    setModalOpen(true);
  };

  const handlePackChange = (val) => {
    const pack = parseInt(val) || 0;
    const dus = Math.floor(pack / 20);
    setForm((prev) => ({
      ...prev,
      target_pack: pack,
      target_dus: dus,
    }));
  };

  const handleSubmitCityTarget = async (e) => {
    e.preventDefault();
    if (!form.city_name) return;

    setSubmitting(true);
    try {
      await request.post(API_ENDPOINTS.OWNER.CREATE_CITY_TARGET, {
        city_name: form.city_name,
        month: selectedMonth,
        target_pack: form.target_pack,
        target_dus: form.target_dus,
        target_rupiah: form.target_rupiah,
        notes: form.notes,
      });
      toast.success(`Target bulanan kota ${form.city_name} berhasil disimpan!`);
      setModalOpen(false);
      fetchCityTargets();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan target kota');
    } finally {
      setSubmitting(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (cities.length === 0) {
      toast.error('Tidak ada data target untuk diunduh');
      return;
    }

    const headers = [
      'No',
      'Kategori Kota',
      'Bulan',
      'Target Pack',
      'Target Dus',
      'Target Rupiah (Rp)',
      'Realisasi Pack',
      'Realisasi Dus',
      'Realisasi Omzet (Rp)',
      'Laba Wilayah (Rp)',
      'Margin (%)',
      'Pencapaian (%)'
    ];

    const rows = cities.map((c, idx) => [
      idx + 1,
      `"${c.city_name.replace(/"/g, '""')}"`,
      selectedMonth,
      c.target_pack,
      c.target_dus,
      c.target_rupiah,
      c.actual_pack,
      c.actual_dus,
      c.actual_rupiah,
      c.profit,
      `"${c.margin_percent}%"`,
      `"${c.pct_rupiah}%"`
    ].join(','));

    // Summary row
    rows.push([
      'TOTAL',
      '"SEMUA KOTA"',
      selectedMonth,
      summary.target_pack,
      summary.target_dus,
      summary.target_rupiah,
      summary.actual_pack,
      summary.actual_dus,
      summary.actual_rupiah,
      summary.profit,
      '-',
      `"${globalPctRupiah}%"`
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Target_Bulanan_Kota_ALSYFA_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Laporan Target Bulanan Kota berhasil diunduh (CSV)');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Akumulasi Target Bulanan per Kategori Kota
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Target className="h-3 w-3" /> Panel Owner
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pantau akumulasi target bulanan setiap kota dalam nominal Rupiah serta jumlah produk dalam satuan Pack dan Dus (1 dus = 20 pack).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:border-emerald-500"
            />

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-sm shadow-emerald-200 transition-all shrink-0"
              title="Download CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-sm transition-all shrink-0"
              title="Cetak Laporan"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          </div>
        </div>

        {/* Global Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Target Omzet</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 font-mono">
              Rp {Number(summary.target_rupiah).toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Target akumulasi seluruh kota ({selectedMonth})
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Realisasi Omzet</span>
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-emerald-700 font-mono">
              Rp {Number(summary.actual_rupiah).toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">
              Pencapaian: {globalPctRupiah}%
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Target Pack & Dus</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Boxes className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 font-mono">
              {Number(summary.target_pack).toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">pack</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Setara <strong>{summary.target_dus} dus</strong> (Realisasi: {summary.actual_pack} pack)
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50/70 to-white p-5 rounded-2xl border border-emerald-300 shadow-sm">
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Laba Wilayah</span>
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-emerald-700 font-mono">
              Rp {Number(summary.profit).toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-emerald-700 font-bold mt-1">
              Laba kotor setelah HPP produk
            </p>
          </div>
        </div>

        {/* Chart.js Section: Target vs Realisasi Bar Chart */}
        {cities.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  Grafik Perbandingan Target vs Realisasi Omzet per Kategori Kota ({selectedMonth})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualisasi target omzet, realisasi omzet, dan laba wilayah setiap cabang kota.
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <Bar data={cityTargetChartData} options={cityTargetChartOptions} />
            </div>
          </div>
        )}

        {/* City Targets Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Rincian Akumulasi Target & Realisasi Tiap Kategori Kota
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {cities.length} Wilayah Kota Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3.5">Kategori Kota</th>
                  <th className="px-4 py-3.5 text-right bg-emerald-50/50">Target Rupiah</th>
                  <th className="px-4 py-3.5 text-center bg-emerald-50/50">Target Pack & Dus</th>
                  <th className="px-4 py-3.5 text-right">Realisasi Omzet</th>
                  <th className="px-4 py-3.5 text-center">Realisasi Qty</th>
                  <th className="px-4 py-3.5 text-right">Laba Wilayah</th>
                  <th className="px-4 py-3.5 text-center">Pencapaian</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      Memuat target bulanan kota...
                    </td>
                  </tr>
                ) : cities.length > 0 ? (
                  cities.map((city, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-emerald-600" />
                          <div>
                            <strong className="text-slate-800 font-bold block">{city.city_name}</strong>
                            <span className="text-[10px] text-slate-400">
                              {city.total_customers} Toko • {city.total_orders} Faktur
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right bg-emerald-50/30 font-black text-slate-900 font-mono">
                        Rp {Number(city.target_rupiah).toLocaleString('id-ID')}
                      </td>

                      <td className="px-4 py-3.5 text-center bg-emerald-50/30 font-bold text-slate-800">
                        {city.target_pack} pack
                        <span className="text-[10px] text-slate-400 block font-normal font-mono">
                          ({city.target_dus} dus)
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-emerald-700 font-mono">
                        Rp {Number(city.actual_rupiah).toLocaleString('id-ID')}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                        {city.actual_pack} pack
                        <span className="text-[10px] text-slate-400 block font-normal font-mono">
                          ({city.actual_dus} dus)
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold text-emerald-700 font-mono">
                        Rp {Number(city.profit).toLocaleString('id-ID')}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Margin: +{city.margin_percent}%
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${
                            city.pct_rupiah >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : city.pct_rupiah >= 60
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {city.pct_rupiah}%
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenEdit(city)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs transition-colors"
                        >
                          <Edit2 className="h-3 w-3" /> Atur Target
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      Belum ada data target kota untuk periode ini.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Table Footer Totals */}
              {cities.length > 0 && (
                <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-800">
                  <tr>
                    <td className="px-4 py-3">TOTAL SELURUH KOTA</td>
                    <td className="px-4 py-3 text-right font-mono font-black text-slate-900 bg-emerald-50/50">
                      Rp {Number(summary.target_rupiah).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center bg-emerald-50/50">
                      {summary.target_pack} pack ({summary.target_dus} dus)
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-emerald-700">
                      Rp {Number(summary.actual_rupiah).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {summary.actual_pack} pack ({summary.actual_dus} dus)
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-emerald-700">
                      Rp {Number(summary.profit).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center text-emerald-700 font-black">
                      {globalPctRupiah}%
                    </td>
                    <td className="px-4 py-3 text-right">-</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Modal Atur Target Kota */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Atur Target Bulanan Kota - ${editingCity?.city_name || 'Kota'}`}
      >
        <form onSubmit={handleSubmitCityTarget} className="space-y-4 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900">
            <p className="font-bold">Target Kota {editingCity?.city_name}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Tentukan target bulanan dalam Rupiah, Pack, dan Dus (1 dus = 20 pack). Nilai dus akan otomatis dihitung saat mengubah pack.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target Omzet (Rupiah) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={form.target_rupiah}
              onChange={(e) => setForm({ ...form, target_rupiah: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-emerald-700 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Jumlah (Pack) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={form.target_pack}
                onChange={(e) => handlePackChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Dus (1 dus = 20 pk)
              </label>
              <input
                type="number"
                min="0"
                value={form.target_dus}
                onChange={(e) => setForm({ ...form, target_dus: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan Khusus Wilayah Kota
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Catatan target pasar..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-200 disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Target Kota'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
