import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Route,
  Store,
  ShoppingCart,
  Truck,
  Sparkles,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Wallet,
  Fuel,
  Bike
} from 'lucide-react';
import MobileLayout from '../../components/layout/MobileLayout';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { useGeolocation } from '../../hooks/useGeolocation';

export default function SalesHome() {
  const user = JSON.parse(localStorage.getItem('alsyifa_user') || '{}');
  const [attendance, setAttendance] = useState(null);
  const [todayRoute, setTodayRoute] = useState(null);
  const [vanStockSummary, setVanStockSummary] = useState([]);
  const [todayAllowance, setTodayAllowance] = useState(null);
  const [loading, setLoading] = useState(true);
  const geo = useGeolocation();

  useEffect(() => {
    fetchData();
  }, []);

  // Periodic GPS ping to server
  useEffect(() => {
    if (geo.latitude && geo.longitude && user.id) {
      request.post(API_ENDPOINTS.TRACKING.PING, {
        latitude: geo.latitude,
        longitude: geo.longitude,
        accuracy: geo.accuracy,
        address_note: todayRoute?.route?.district_name ? `Wilayah ${todayRoute.route.district_name}` : 'Area Sales Lapangan'
      }).catch(() => {});
    }
  }, [geo.latitude, geo.longitude]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().substring(0, 10);
      const [attRes, routeRes, stockRes, allowRes] = await Promise.all([
        request.get(API_ENDPOINTS.ATTENDANCES.TODAY).catch(() => ({ data: null })),
        request.get(API_ENDPOINTS.ROUTES.SALES_TODAY(user.id)).catch(() => ({ data: null })),
        request.get(API_ENDPOINTS.VAN_STOCKS.CURRENT(user.id)).catch(() => ({ data: [] })),
        request.get(API_ENDPOINTS.ALLOWANCES.DAILY, { sales_id: user.id, date: todayStr }).catch(() => ({ data: [] }))
      ]);

      setAttendance(attRes.data);
      setTodayRoute(routeRes.data);
      setVanStockSummary(stockRes.data || []);
      const allowances = allowRes.data || [];
      setTodayAllowance(allowances.length > 0 ? allowances[0] : null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const completedVisits = todayRoute?.customers?.filter(c => c.visit_status === 'completed')?.length || 0;
  const totalStores = todayRoute?.customers?.length || 0;

  return (
    <MobileLayout title="ALSYFA Mobile Sales">
      {/* Sales Identity Banner */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-4 text-white shadow-lg shadow-emerald-700/20 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              {user.vehicle_type === 'motor' ? 'Sales Motoris' : 'Sales Mobil Van'}
            </span>
            <h2 className="text-base font-extrabold mt-1">{user.name}</h2>
            <p className="text-xs text-emerald-100 flex items-center gap-1 mt-0.5">
              <Truck className="h-3 w-3" /> No. Kendaraan: {user.vehicle_number || '-'}
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-xl border border-white/20">
            {user.name?.charAt(0) || 'S'}
          </div>
        </div>

        {/* Attendance Status Card Inside Banner */}
        <div className="bg-emerald-950/40 rounded-xl p-2.5 flex items-center justify-between border border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-300" />
            <div>
              <p className="text-[10px] text-emerald-200">Status Absensi (08.00 - 15.00)</p>
              <p className="text-xs font-bold">
                {attendance?.clock_in_time
                  ? `Masuk: ${attendance.clock_in_time.substring(0, 5)} WIB (${attendance.status})`
                  : 'Belum Absen Masuk'}
              </p>
            </div>
          </div>
          <Link
            to="/sales/absensi"
            className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all shadow-sm ${
              attendance?.clock_in_time
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-900 animate-pulse'
            }`}
          >
            {attendance?.clock_in_time ? 'Detail Absen' : 'Absen Sekarang'}
          </Link>
        </div>
      </div>

      {/* Tunjangan Operasional Card (BBM + Sewa Motor = Rp 30.000/hari) */}
      <Link
        to="/sales/tunjangan"
        className="block bg-gradient-to-r from-teal-700 via-emerald-700 to-emerald-800 rounded-2xl p-3.5 text-white shadow-md shadow-emerald-900/10 mb-4 hover:opacity-95 transition-all border border-emerald-600/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
              <Wallet className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Tunjangan Operasional</span>
                <span className="text-[9px] bg-amber-400 text-slate-900 font-extrabold px-1.5 py-0.5 rounded-full">
                  Rp 30.000/hari
                </span>
              </div>
              <p className="text-[10px] text-emerald-200 mt-0.5">
                BBM Rp 20.000 + Sewa Motor Rp 10.000 • {todayAllowance ? 'Tercatat Hari Ini' : 'Cek Status / Klaim'}
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-white/20 hover:bg-white/30 text-white font-bold px-2 py-1 rounded-lg">
            Rincian &rarr;
          </span>
        </div>
      </Link>

      {/* Today Route & Territory Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Route className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rute Kerja Hari Ini ({todayRoute?.day?.toUpperCase() || 'HARI INI'})
            </h3>
          </div>
          <Link to="/sales/rute" className="text-xs font-bold text-emerald-600 hover:underline">
            Lihat Semua
          </Link>
        </div>

        {todayRoute?.route ? (
          <div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                Kecamatan: {todayRoute.route.district_name}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 pl-5">
                Desa: <span className="font-medium text-slate-700">{todayRoute.route.village_names || '-'}</span>
              </p>
            </div>

            {/* Progress Kunjungan */}
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500">Kunjungan Toko</span>
              <span className="font-bold text-slate-800">
                {completedVisits} dari {totalStores} Toko Selesai
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${totalStores > 0 ? (completedVisits / totalStores) * 100 : 0}%` }}
              />
            </div>

            {/* Quick store list */}
            <div className="space-y-2">
              {todayRoute.customers?.slice(0, 3).map((shop, i) => (
                <div
                  key={shop.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="overflow-hidden pr-2">
                    <p className="text-xs font-bold text-slate-800 truncate">{shop.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{shop.address}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {shop.phone && (
                      <a
                        href={`https://wa.me/62${shop.phone.replace(/^0/, '')}?text=${encodeURIComponent(`Halo ${shop.name}, saya ${user.name} sales ALSYFA Snack Coklat akan berkunjung hari ini.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                        title="Chat WhatsApp"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <Link
                      to={`/sales/visit/${shop.id}`}
                      className={`text-[10px] px-2 py-1 rounded-lg font-bold flex items-center gap-1 ${
                        shop.visit_status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {shop.visit_status === 'completed' ? 'Selesai' : 'Check-In'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-slate-400">
            Tidak ada jadwal rute khusus hari ini. Anda dapat membuat pesanan bebas di menu Toko.
          </div>
        )}
      </div>

      {/* Main Feature Menu Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <Link
          to="/sales/absensi"
          className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:border-emerald-200 transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <UserCheck className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">Absensi GPS</span>
        </Link>

        <Link
          to="/sales/order"
          className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:border-emerald-200 transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">Order Baru</span>
        </Link>

        <Link
          to="/sales/van-stock"
          className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:border-emerald-200 transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Truck className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">Stok</span>
        </Link>

        <Link
          to="/sales/tunjangan"
          className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:border-emerald-200 transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">Tunjangan</span>
        </Link>

        <Link
          to="/sales/customers"
          className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:border-emerald-200 transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Store className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">Database Toko</span>
        </Link>

        <Link
          to="/sales/rute"
          className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:border-emerald-200 transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Route className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">Jadwal Rute</span>
        </Link>
      </div>

      {/* Sisa Stok Quick Alert */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-blue-600" /> Sisa Stok Produk
          </h4>
          <Link to="/sales/van-stock" className="text-xs font-bold text-blue-600 hover:underline">
            Kelola Stok
          </Link>
        </div>

        {vanStockSummary.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {vanStockSummary.slice(0, 3).map((item) => (
              <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 truncate max-w-[180px]">
                  {item.product_name}
                </span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                  Sisa: {item.current_stock} {item.unit}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-2">Belum ada alokasi stok untuk kendaraan Anda hari ini.</p>
        )}
      </div>
    </MobileLayout>
  );
}
