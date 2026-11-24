import React, { useState, useEffect } from 'react';
import {
  Target,
  Award,
  Calendar,
  Save,
  Package,
  Boxes,
  DollarSign,
  TrendingUp,
  User,
  Edit2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function SalesTargetsAdmin() {
  const [salesTargets, setSalesTargets] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingSales, setEditingSales] = useState(null);
  const [weekForms, setWeekForms] = useState([
    { week_number: 1, target_pack: 350, target_dus: 17, target_rupiah: 4500000, notes: '' },
    { week_number: 2, target_pack: 400, target_dus: 20, target_rupiah: 5200000, notes: '' },
    { week_number: 3, target_pack: 450, target_dus: 22, target_rupiah: 6000000, notes: '' },
    { week_number: 4, target_pack: 500, target_dus: 25, target_rupiah: 6800000, notes: '' },
  ]);

  useEffect(() => {
    fetchTargets();
  }, [selectedMonth]);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.TARGETS.LIST, {
        month: selectedMonth,
      });
      setSalesTargets(res.data?.sales_targets || []);
    } catch (err) {
      toast.error(err.message || 'Gagal memuat target sales');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingSales(item.sales);
    const existingWeeks = item.weeks || [];
    const formatted = [1, 2, 3, 4].map((w) => {
      const found = existingWeeks.find((ew) => ew.week_number === w);
      return {
        week_number: w,
        target_pack: found ? found.target_pack : 0,
        target_dus: found ? found.target_dus : 0,
        target_rupiah: found ? found.target_rupiah : 0,
        notes: found ? found.notes : '',
      };
    });
    setWeekForms(formatted);
    setModalOpen(true);
  };

  const handleWeekChange = (index, field, value) => {
    setWeekForms((prev) => {
      const updated = [...prev];
      const val = field === 'notes' ? value : parseFloat(value) || 0;
      updated[index] = { ...updated[index], [field]: val };

      // If pack changes, auto calculate dus (1 dus = 20 pack)
      if (field === 'target_pack') {
        updated[index].target_dus = Math.floor(val / 20);
      }
      return updated;
    });
  };

  const totalPackAccum = weekForms.reduce((sum, w) => sum + (Number(w.target_pack) || 0), 0);
  const totalDusAccum = weekForms.reduce((sum, w) => sum + (Number(w.target_dus) || 0), 0);
  const totalRupiahAccum = weekForms.reduce((sum, w) => sum + (Number(w.target_rupiah) || 0), 0);

  const handleSubmitTargets = async (e) => {
    e.preventDefault();
    if (!editingSales) return;

    setSubmitting(true);
    try {
      await request.post(API_ENDPOINTS.TARGETS.BATCH, {
        sales_id: editingSales.id,
        month: selectedMonth,
        weeks: weekForms,
      });
      toast.success(`Target bulanan untuk ${editingSales.name} berhasil disimpan!`);
      setModalOpen(false);
      fetchTargets();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan target');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Target className="h-6 w-6 text-emerald-600" />
              Kelola Target Mingguan & Akumulasi Bulanan Sales
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tentukan kuota target penjualan tiap sales dalam satuan Pack, Dus, dan Rupiah per minggu yang terakumulasi otomatis dalam 1 bulan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Sales Targets Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3.5">Nama Sales</th>
                  <th className="px-3 py-3.5 text-center">Minggu 1</th>
                  <th className="px-3 py-3.5 text-center">Minggu 2</th>
                  <th className="px-3 py-3.5 text-center">Minggu 3</th>
                  <th className="px-3 py-3.5 text-center">Minggu 4</th>
                  <th className="px-4 py-3.5 text-right bg-emerald-50/50">Total Target Bulan Ini</th>
                  <th className="px-4 py-3.5 text-right">Realisasi Omzet</th>
                  <th className="px-4 py-3.5 text-center">Pencapaian</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      Memuat target sales...
                    </td>
                  </tr>
                ) : salesTargets.length > 0 ? (
                  salesTargets.map((item) => (
                    <tr key={item.sales.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-extrabold text-slate-900">{item.sales.name}</div>
                        <p className="text-[10px] text-slate-400">
                          {item.sales.email} • {item.sales.vehicle_type || 'Sales'} ({item.sales.vehicle_number || '-'})
                        </p>
                      </td>

                      {/* 4 Weeks Mini Columns */}
                      {[0, 1, 2, 3].map((wIdx) => {
                        const w = item.weeks[wIdx];
                        return (
                          <td key={wIdx} className="px-3 py-3.5 text-center">
                            <span className="font-black text-slate-800 font-mono">
                              {w.target_pack} <span className="text-[9px] text-slate-400 font-normal">pk</span>
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ({w.target_dus} dus)
                            </p>
                            <p className="text-[10px] text-emerald-700 font-bold font-mono">
                              Rp {Number(w.target_rupiah).toLocaleString('id-ID')}
                            </p>
                          </td>
                        );
                      })}

                      {/* Accumulated Monthly Totals */}
                      <td className="px-4 py-3.5 text-right bg-emerald-50/40">
                        <span className="text-sm font-black text-slate-900 font-mono">
                          Rp {Number(item.monthly.target_rupiah).toLocaleString('id-ID')}
                        </span>
                        <p className="text-[11px] font-bold text-emerald-800">
                          {item.monthly.target_pack} pack • {item.monthly.target_dus} dus
                        </p>
                      </td>

                      {/* Actual Realization */}
                      <td className="px-4 py-3.5 text-right font-black text-slate-800 font-mono">
                        Rp {Number(item.monthly.actual_rupiah).toLocaleString('id-ID')}
                        <p className="text-[10px] font-normal text-slate-400">
                          {item.monthly.actual_pack} pack
                        </p>
                      </td>

                      {/* Percentage Badge */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${
                            item.monthly.pct_rupiah >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.monthly.pct_rupiah >= 60
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.monthly.pct_rupiah}%
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs transition-colors"
                        >
                          <Edit2 className="h-3 w-3" /> Atur Target
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      Tidak ada sales aktif ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Atur Target 4 Minggu & Akumulasi Bulanan */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Atur Target Penjualan - ${editingSales?.name || 'Sales'}`}
      >
        <form onSubmit={handleSubmitTargets} className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">{editingSales?.name}</p>
              <p className="text-[10px] text-slate-400">Periode Target: {selectedMonth}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              4 Siklus Mingguan
            </span>
          </div>

          {/* 4 Weeks Input Grid */}
          <div className="space-y-3">
            {weekForms.map((week, idx) => (
              <div
                key={week.week_number}
                className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-800 text-[11px] uppercase tracking-wider">
                    Minggu {week.week_number} ({week.week_number === 1 ? 'Tgl 1-7' : week.week_number === 2 ? 'Tgl 8-14' : week.week_number === 3 ? 'Tgl 15-21' : 'Tgl 22-31'})
                  </span>
                  <span className="text-[10px] text-slate-400">1 dus = 20 pack</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Target Pack
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={week.target_pack}
                      onChange={(e) => handleWeekChange(idx, 'target_pack', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-2 font-mono font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Target Dus
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={week.target_dus}
                      onChange={(e) => handleWeekChange(idx, 'target_dus', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-2 font-mono font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Target Rupiah (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={week.target_rupiah}
                      onChange={(e) => handleWeekChange(idx, 'target_rupiah', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-2 font-mono font-bold text-emerald-700 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Live Accumulated Monthly Preview */}
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-4 shadow-sm border border-emerald-700">
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
              Akumulasi Target 1 Bulan Terhitung:
            </span>
            <div className="text-xl font-black text-white font-mono mt-1">
              Rp {totalRupiahAccum.toLocaleString('id-ID')}
            </div>
            <div className="flex gap-4 text-xs font-semibold text-emerald-200 mt-1">
              <span>{totalPackAccum} Pack</span>
              <span>•</span>
              <span>{totalDusAccum} Dus</span>
            </div>
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
              {submitting ? 'Menyimpan...' : 'Simpan Semua Target'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
