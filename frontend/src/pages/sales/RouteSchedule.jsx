import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Route as RouteIcon,
  MapPin,
  Store,
  PhoneCall,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  Compass
} from 'lucide-react';
import MobileLayout from '../../components/layout/MobileLayout';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function RouteSchedule() {
  const user = JSON.parse(localStorage.getItem('alsyifa_user') || '{}');
  const days = [
    { key: 'senin', label: 'Senin' },
    { key: 'selasa', label: 'Selasa' },
    { key: 'rabu', label: 'Rabu' },
    { key: 'kamis', label: 'Kamis' },
    { key: 'jumat', label: 'Jumat' },
    { key: 'sabtu', label: 'Sabtu' },
    { key: 'minggu', label: 'Minggu' },
  ];

  const todayIndex = new Date().getDay();
  const dayNames = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
  const currentDayName = dayNames[todayIndex];

  const [selectedDay, setSelectedDay] = useState(currentDayName);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ROUTES.LIST, {
        sales_id: user.id,
        limit: 50,
      });
      setRoutes(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeRoute = routes.find((r) => r.day_of_week === selectedDay);

  return (
    <MobileLayout title="Pemetaan & Optimasi Rute" showBack={true}>
      {/* Day Selector Pills (Senin - Sabtu) */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {days.map((d) => {
          const isToday = d.key === currentDayName;
          const isSelected = d.key === selectedDay;
          return (
            <button
              key={d.key}
              onClick={() => setSelectedDay(d.key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex flex-col items-center ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{d.label}</span>
              {isToday && (
                <span className={`text-[9px] px-1 rounded mt-0.5 ${isSelected ? 'bg-emerald-800 text-emerald-200' : 'bg-emerald-100 text-emerald-700'}`}>
                  Hari Ini
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Territory Detail for Selected Day */}
      {activeRoute ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-md">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Compass className="h-4 w-4" />
              <span>Wilayah Kerja Hari {selectedDay.toUpperCase()}</span>
            </div>
            <h3 className="text-lg font-extrabold text-white">
              Kecamatan {activeRoute.district_name}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Desa / Kelurahan:{' '}
              <span className="font-semibold text-emerald-300">
                {activeRoute.village_names || 'Seluruh Desa'}
              </span>
            </p>
            {activeRoute.notes && (
              <p className="text-[11px] text-slate-400 mt-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                Catatan: {activeRoute.notes}
              </p>
            )}
          </div>

          {/* Route Optimization Notice */}
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>Jalur kunjungan telah dioptimasi berurutan agar efisien.</span>
            </div>
          </div>

          {/* Open Route in Google Maps */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Kecamatan ${activeRoute.district_name}`)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <MapPin className="h-4 w-4" /> Buka Wilayah Rute di Google Maps
          </a>

          {/* Stores on this Route */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Daftar Kunjungan Toko ({activeRoute.total_customers || 0} Outlet)
            </h4>

            {activeRoute.total_customers > 0 ? (
              <div className="space-y-2.5">
                <Link
                  to="/sales/customers"
                  className="block bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Buka Database Toko di Wilayah Ini</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Filter otomatis toko Kecamatan {activeRoute.district_name}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 text-center text-xs text-slate-400 border border-slate-100">
                Belum ada toko yang dialokasikan khusus pada rute hari {selectedDay}.
                <div className="mt-3">
                  <Link
                    to="/sales/customers"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    <Store className="h-3.5 w-3.5" /> Lihat & Pilih Toko di Database
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
          <RouteIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">Tidak ada rute kerja untuk {selectedDay}</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Supervisor belum menetapkan jadwal wilayah kerja khusus untuk hari ini.
          </p>
        </div>
      )}
    </MobileLayout>
  );
}
