import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Percent,
  Download,
  Printer,
  Calendar,
  Users,
  Store,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function SalesReports() {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchPerformanceData();
  }, [startDate, endDate]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.DASHBOARD.SALES_PERFORMANCE, {
        start_date: startDate,
        end_date: endDate,
      });
      setPerformance(res.data || []);
    } catch (err) {
      toast.error('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalOmset = performance.reduce((acc, p) => acc + (p.total_revenue || 0), 0);
  const totalVisits = performance.reduce((acc, p) => acc + (p.total_visits || 0), 0);
  const totalOrders = performance.reduce((acc, p) => acc + (p.total_orders || 0), 0);
  const overallHitRate = totalVisits > 0 ? Math.round((totalOrders / totalVisits) * 100) : 0;

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Laporan Kinerja & Rasio Hit Rate Penjualan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Laporan otomatis evaluasi produktivitas sales lapangan dan konversi transaksi toko.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm transition-all"
        >
          <Printer className="h-4 w-4 text-emerald-400" />
          <span>Cetak / Ekspor Laporan</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row items-center gap-3 text-xs">
        <span className="font-bold text-slate-700 flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-emerald-600" /> Periode Laporan:
        </span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-slate-200 p-2 text-slate-800"
          />
          <span className="text-slate-400">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-slate-200 p-2 text-slate-800"
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Omset Periode</span>
          <h3 className="text-xl font-black text-slate-800 mt-1">
            Rp {totalOmset.toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Kunjungan Toko</span>
          <h3 className="text-xl font-black text-slate-800 mt-1">
            {totalVisits} Kunjungan
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Transaksi Order</span>
          <h3 className="text-xl font-black text-slate-800 mt-1">
            {totalOrders} Faktur
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Hit Rate</span>
          <h3 className="text-xl font-black text-emerald-600 mt-1">
            {overallHitRate}%
          </h3>
        </div>
      </div>

      {/* Performance Matrix */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Nama Sales</th>
                <th className="px-5 py-3">Kendaraan</th>
                <th className="px-5 py-3 text-center">Total Kunjungan Toko</th>
                <th className="px-5 py-3 text-center">Closing Order</th>
                <th className="px-5 py-3 text-center">Hit Rate Ratio (%)</th>
                <th className="px-5 py-3 text-right">Rata-Rata Order</th>
                <th className="px-5 py-3 text-right">Total Penjualan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {performance.map((sp) => {
                const avgBasket = sp.total_orders > 0 ? Math.round(sp.total_revenue / sp.total_orders) : 0;
                return (
                  <tr key={sp.sales_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800">{sp.sales_name}</td>
                    <td className="px-5 py-3.5 capitalize text-slate-500">
                      {sp.vehicle_type} ({sp.vehicle_number || '-'})
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-slate-800">{sp.total_visits} Toko</td>
                    <td className="px-5 py-3.5 text-center font-bold text-emerald-600">{sp.total_orders} Faktur</td>
                    <td className="px-5 py-3.5 text-center font-black">
                      <span className={`px-2 py-0.5 rounded-md ${
                        sp.hit_rate_percent >= 60 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sp.hit_rate_percent}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-600">
                      Rp {avgBasket.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-slate-900">
                      Rp {Number(sp.total_revenue).toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
