import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Fuel,
  Bike,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  DollarSign,
  FileText,
  ChevronRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import MobileLayout from '../../components/layout/MobileLayout';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function SalesAllowances() {
  const user = JSON.parse(localStorage.getItem('alsyifa_user') || '{}');
  const [allowances, setAllowances] = useState([]);
  const [summary, setSummary] = useState(null);
  const [todayAllowance, setTodayAllowance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const todayStr = new Date().toISOString().substring(0, 10);
  const currentMonthStr = todayStr.substring(0, 7);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ALLOWANCES.DAILY, {
        sales_id: user.id,
        month: currentMonthStr,
      });

      const list = res.data || [];
      setAllowances(list);
      setSummary(res.summary || null);

      const foundToday = list.find((item) => {
        const itemDate = item.date ? item.date.substring(0, 10) : '';
        return itemDate === todayStr;
      });
      setTodayAllowance(foundToday || null);
    } catch (err) {
      toast.error(err.message || 'Gagal memuat tunjangan operasional');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimToday = async () => {
    setClaiming(true);
    try {
      await request.post(API_ENDPOINTS.ALLOWANCES.CLAIM, {
        bbm_amount: 20000,
        motor_rent_amount: 10000,
        notes: 'Klaim tunjangan operasional harian sales',
      });
      toast.success('Tunjangan hari ini Rp 30.000 berhasil dicatat!');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Gagal mencatat klaim tunjangan');
    } finally {
      setClaiming(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> Dicairkan / Lunas
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            <CheckCircle2 className="h-3 w-3" /> Disetujui
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            <Clock className="h-3 w-3" /> Menunggu Admin
          </span>
        );
    }
  };

  return (
    <MobileLayout title="Tunjangan Operasional" showBack={true}>
      {/* Today Allowance Hero Card */}
      <div className="bg-gradient-to-br from-teal-800 via-emerald-800 to-slate-900 rounded-3xl p-5 text-white shadow-xl shadow-emerald-950/20 mb-4 border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Wallet className="w-36 h-36" />
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
              <Fuel className="h-4 w-4 text-emerald-300" />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-200">
              Uang Bensin & Sewa Motor
            </span>
          </div>
          {todayAllowance && getStatusBadge(todayAllowance.status)}
        </div>

        <p className="text-xs text-emerald-100/90 mt-1">Alokasi Harian Sales Lapangan</p>
        <div className="text-2xl font-black tracking-tight text-white mt-1">
          Rp 30.000 <span className="text-xs font-normal text-emerald-200">/ hari kerja</span>
        </div>

        {/* Breakdown Items */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-emerald-600/30">
          <div className="bg-emerald-950/40 rounded-xl p-2.5 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 text-emerald-200 text-[10px] font-semibold">
              <Fuel className="h-3.5 w-3.5" /> Uang BBM
            </div>
            <p className="text-sm font-bold text-white mt-0.5">Rp 20.000</p>
          </div>
          <div className="bg-emerald-950/40 rounded-xl p-2.5 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 text-emerald-200 text-[10px] font-semibold">
              <Bike className="h-3.5 w-3.5" /> Sewa Motor
            </div>
            <p className="text-sm font-bold text-white mt-0.5">Rp 10.000</p>
          </div>
        </div>

        {/* Status / Claim Action */}
        <div className="mt-4 pt-2">
          {todayAllowance ? (
            <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                <div>
                  <p className="font-bold text-white">Tunjangan Hari Ini Tercatat</p>
                  <p className="text-[10px] text-emerald-200">Tercatat otomatis saat absen masuk</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-200 font-mono">Rp 30.000</span>
            </div>
          ) : (
            <button
              onClick={handleClaimToday}
              disabled={claiming}
              className="w-full bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-900 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 disabled:opacity-60"
            >
              <Wallet className="h-4 w-4" />
              <span>{claiming ? 'Memproses Klaim...' : 'Catat Tunjangan Hari Ini'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Monthly Accumulation Summary Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Akumulasi Bulan Ini
              </h3>
              <p className="text-[10px] text-slate-400">Total terkumpul periode {currentMonthStr}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-emerald-600">
              Rp {Number(summary?.total_allowance || 0).toLocaleString('id-ID')}
            </span>
            <p className="text-[10px] text-slate-400">{summary?.total_days || 0} hari kerja</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
          <div className="bg-slate-50 p-2.5 rounded-xl">
            <p className="text-[10px] text-slate-500">Telah Dicairkan Admin</p>
            <p className="font-bold text-emerald-700 mt-0.5">
              Rp {Number(summary?.total_paid || 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl">
            <p className="text-[10px] text-slate-500">Belum Cair (Pending)</p>
            <p className="font-bold text-amber-700 mt-0.5">
              Rp {Number(summary?.total_pending || 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Daily History List */}
      <div>
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Riwayat Tunjangan Harian</span>
          <span className="text-[10px] text-slate-400 lowercase font-normal">
            {allowances.length} catatan
          </span>
        </h4>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-3.5 rounded-xl border border-slate-100 animate-pulse">
                <div className="h-3.5 bg-slate-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : allowances.length > 0 ? (
          <div className="space-y-2">
            {allowances.map((item) => (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 hover:border-emerald-200 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {item.date ? item.date.substring(0, 10) : '-'}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    BBM: Rp {Number(item.bbm_amount || 0).toLocaleString('id-ID')} • Sewa Motor: Rp {Number(item.motor_rent_amount || 0).toLocaleString('id-ID')}
                  </p>
                  {item.paid_date && (
                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      Cair: {item.paid_date.substring(0, 10)}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-slate-900 font-mono">
                    Rp {Number(item.total_amount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 text-xs text-slate-400">
            <Wallet className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p>Belum ada riwayat tunjangan operasional pada bulan ini.</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
