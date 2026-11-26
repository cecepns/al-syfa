import React, { useState, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  Package,
  Boxes,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import MobileLayout from '../../components/layout/MobileLayout';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { formatDateID, formatMonthYearID, getCurrentMonthISO } from '../../utils/dateFormat';

export default function SalesTargets() {
  const user = JSON.parse(localStorage.getItem('alsyifa_user') || '{}');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthISO());

  useEffect(() => {
    fetchTargets();
  }, [selectedMonth]);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.TARGETS.MY_PROGRESS, {
        month: selectedMonth
      });
      setData(res.data || null);
    } catch (err) {
      toast.error(err.message || 'Gagal memuat target sales');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (pct) => {
    if (pct >= 100) return 'text-emerald-500 bg-emerald-50 border-emerald-200';
    if (pct >= 60) return 'text-blue-500 bg-blue-50 border-blue-200';
    return 'text-amber-500 bg-amber-50 border-amber-200';
  };

  const monthly = data?.monthly || {
    target_pack: 0,
    target_dus: 0,
    target_rupiah: 0,
    actual_pack: 0,
    actual_dus: 0,
    actual_rupiah: 0,
    pct_pack: 0,
    pct_rupiah: 0
  };

  return (
    <MobileLayout title="Target & Pencapaian" showBack={true}>
      {/* Month Filter Selector */}
      <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">Periode Bulan:</span>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Hero: Monthly Accumulation Target Card */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-950 rounded-3xl p-5 text-white shadow-xl shadow-emerald-950/20 mb-4 border border-emerald-700/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 opacity-10 pointer-events-none">
          <Target className="w-36 h-36" />
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
              <Award className="h-4 w-4 text-emerald-300" />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-200">
              Akumulasi Target 1 Bulan
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            {formatMonthYearID(selectedMonth)}
          </span>
        </div>

        <p className="text-xs text-emerald-100/90 mt-1">Realisasi Penjualan Anda</p>
        <div className="text-2xl font-black tracking-tight text-white mt-1">
          Rp {Number(monthly.actual_rupiah || 0).toLocaleString('id-ID')}
          <span className="text-xs font-normal text-emerald-200 ml-1">
            / Target Rp {Number(monthly.target_rupiah || 0).toLocaleString('id-ID')}
          </span>
        </div>

        {/* Progress Bar Rupiah */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span className="text-emerald-200">Pencapaian Omzet</span>
            <span className="text-white font-mono">{monthly.pct_rupiah}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                monthly.pct_rupiah >= 100
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                  : 'bg-gradient-to-r from-amber-400 to-emerald-400'
              }`}
              style={{ width: `${Math.min(100, monthly.pct_rupiah)}%` }}
            />
          </div>
        </div>

        {/* Pack & Dus Quantities */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-emerald-700/40">
          <div className="bg-slate-900/50 rounded-xl p-2.5 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 text-emerald-200 text-[10px] font-semibold">
              <Package className="h-3.5 w-3.5" /> Total Pack
            </div>
            <p className="text-sm font-black text-white mt-0.5">
              {Number(monthly.actual_pack || 0).toLocaleString('id-ID')}{' '}
              <span className="text-[10px] font-normal text-slate-300">
                / {Number(monthly.target_pack || 0).toLocaleString('id-ID')} pack
              </span>
            </p>
            <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
              {monthly.pct_pack}% tercapai
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-2.5 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 text-emerald-200 text-[10px] font-semibold">
              <Boxes className="h-3.5 w-3.5" /> Total Dus (1 dus = 20 pack)
            </div>
            <p className="text-sm font-black text-white mt-0.5">
              {Number(monthly.actual_dus || 0).toLocaleString('id-ID')}{' '}
              <span className="text-[10px] font-normal text-slate-300">
                / {Number(monthly.target_dus || 0).toLocaleString('id-ID')} dus
              </span>
            </p>
            <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
              Konversi otomatis
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Breakdown Cards */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Target Mingguan (Update Harian)</span>
          <span className="text-[10px] text-slate-400 font-normal">
            4 Siklus Mingguan
          </span>
        </h4>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white p-4 rounded-2xl border border-slate-100 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(data?.weeks || []).map((week) => (
              <div
                key={week.week_number}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <div>
                    <h5 className="text-xs font-black text-slate-900">
                      {week.week_label}
                    </h5>
                    {week.notes && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{week.notes}</p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${getStatusColor(
                      week.pct_rupiah
                    )}`}
                  >
                    {week.pct_rupiah}% Tercapai
                  </span>
                </div>

                {/* Rupiah Target & Actual */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-500">Realisasi Omzet</span>
                    <span className="font-extrabold text-slate-900 font-mono">
                      Rp {Number(week.actual_rupiah || 0).toLocaleString('id-ID')}{' '}
                      <span className="text-slate-400 font-normal">
                        / Rp {Number(week.target_rupiah || 0).toLocaleString('id-ID')}
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        week.pct_rupiah >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, week.pct_rupiah)}%` }}
                    />
                  </div>
                </div>

                {/* Pack & Dus Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                    <span className="text-[10px] text-slate-400">Target Pack:</span>
                    <p className="font-bold text-slate-800">
                      {week.actual_pack}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        / {week.target_pack} pack ({week.pct_pack}%)
                      </span>
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                    <span className="text-[10px] text-slate-400">Target Dus:</span>
                    <p className="font-bold text-slate-800">
                      {week.actual_dus}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        / {week.target_dus} dus
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Progress Update Feed (Story Harian) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-amber-500" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Story Update Penjualan Harian
          </h4>
        </div>

        {data?.daily_history && data.daily_history.length > 0 ? (
          <div className="space-y-2">
            {data.daily_history.map((dayItem, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-800 font-mono">{formatDateID(dayItem.date)}</p>
                  <p className="text-[10px] text-slate-500">
                    {dayItem.orders} order • {dayItem.pack} pack
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-700 font-mono">
                    +Rp {Number(dayItem.rupiah).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">
            Belum ada transaksi penjualan pada bulan yang dipilih.
          </p>
        )}
      </div>
    </MobileLayout>
  );
}
