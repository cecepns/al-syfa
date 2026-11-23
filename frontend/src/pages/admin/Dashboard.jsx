import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  Store,
  ShoppingCart,
  Percent,
  MapPin,
  ClipboardCheck,
  Truck,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [salesPerformance, setSalesPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, perfRes] = await Promise.all([
        request.get(API_ENDPOINTS.DASHBOARD.STATS),
        request.get(API_ENDPOINTS.DASHBOARD.SALES_PERFORMANCE)
      ]);
      setStats(statsRes.data);
      setSalesPerformance(perfRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Dashboard Penjualan & KPI
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pemantauan performa sales lapangan, omset real-time, dan rasio kunjungan toko.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/tracking"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm transition-all"
          >
            <MapPin className="h-4 w-4 text-emerald-400" />
            <span>Peta Digital GPS</span>
          </Link>
          <Link
            to="/admin/orders"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all"
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>Validasi Pesanan</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Omset Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Omset Hari Ini</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Rp {Number(stats?.revenue_today || 0).toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pembaruan transaksi otomatis
          </p>
        </div>

        {/* Hit Rate (%) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hit Rate Kunjungan</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {stats?.hit_rate_percent || 0}%
          </h3>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">
            Rasio Kunjungan Closing Order
          </p>
        </div>

        {/* Total Pesanan Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pesanan Masuk</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {stats?.orders_today || 0} Faktur
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Dari {stats?.visits_today || 0} kunjungan toko
          </p>
        </div>

        {/* Sales Aktif di Lapangan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sales Lapangan</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {stats?.active_sales_count || 0} Sales
          </h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Terhubung di {stats?.total_customers || 0} Toko Terdaftar
          </p>
        </div>
      </div>

      {/* Sales Performance Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Performa Sales & Pencapaian KPI Bulan Ini
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Evaluasi jumlah kunjungan vs transaksi closing</p>
          </div>
          <Link
            to="/admin/reports"
            className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
          >
            Laporan Lengkap <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Nama Sales</th>
                <th className="px-5 py-3">Kendaraan</th>
                <th className="px-5 py-3 text-center">Total Kunjungan</th>
                <th className="px-5 py-3 text-center">Closing Order</th>
                <th className="px-5 py-3 text-center">Hit Rate (%)</th>
                <th className="px-5 py-3 text-right">Total Omset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {salesPerformance.map((sp) => (
                <tr key={sp.sales_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-800">
                    {sp.sales_name}
                  </td>
                  <td className="px-5 py-3.5 capitalize">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                      {sp.vehicle_type} ({sp.vehicle_number || '-'})
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center font-semibold">
                    {sp.total_visits} Toko
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-emerald-600">
                    {sp.total_orders} Order
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2 py-1 rounded-lg font-bold ${
                      sp.hit_rate_percent >= 70
                        ? 'bg-emerald-100 text-emerald-800'
                        : sp.hit_rate_percent >= 40
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sp.hit_rate_percent}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-black text-slate-900">
                    Rp {Number(sp.total_revenue).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
