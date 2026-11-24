import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import MobileLayout from '../../components/layout/MobileLayout';
import CameraCapture from '../../components/common/CameraCapture';
import { request } from '../../utils/request';
import { API_ENDPOINTS, getStorageUrl } from '../../utils/endpoints';
import { useGeolocation } from '../../hooks/useGeolocation';

export default function Attendance() {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraType, setCameraType] = useState('in'); // 'in' or 'out'
  const [currentTime, setCurrentTime] = useState(new Date());

  const geo = useGeolocation();

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ATTENDANCES.TODAY);
      setAttendance(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClockIn = () => {
    setCameraType('in');
    setCameraOpen(true);
  };

  const handleOpenClockOut = () => {
    const hours = currentTime.getHours();
    // Rule: "Absensi : 08.00 – 15.00 seles tidak bisa absen pulang sebelum jam 15.00 di area kerja."
    if (hours < 15) {
      toast.error(
        `Sales tidak bisa absen pulang sebelum jam 15.00 di area kerja! (Saat ini pukul ${String(hours).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')})`,
        { duration: 5000 }
      );
      return;
    }
    setCameraType('out');
    setCameraOpen(true);
  };

  const handlePhotoCaptured = async (photoBase64) => {
    const payload = {
      latitude: geo.latitude,
      longitude: geo.longitude,
      address: `Area Kerja Sales (${geo.latitude.toFixed(5)}, ${geo.longitude.toFixed(5)})`,
      selfie_image: photoBase64,
    };

    try {
      if (cameraType === 'in') {
        const res = await request.post(API_ENDPOINTS.ATTENDANCES.CLOCK_IN, payload);
        toast.success(res.message || 'Absen masuk berhasil!');
      } else {
        const res = await request.post(API_ENDPOINTS.ATTENDANCES.CLOCK_OUT, payload);
        toast.success(res.message || 'Absen pulang berhasil!');
      }
      fetchTodayAttendance();
    } catch (err) {
      toast.error(err.message || 'Gagal melakukan absensi');
    }
  };

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const isBefore15 = hours < 15;

  return (
    <MobileLayout title="Absensi Lapangan Sales" showBack={true}>
      {/* Clock Digital Display */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 text-center shadow-xl mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />

        <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {currentTime.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="text-4xl font-black tracking-tight text-white font-mono my-2">
          {currentTime.toLocaleTimeString('id-ID')}
        </div>

        <p className="text-[11px] text-slate-400">Jam Kerja Sales: 08.00 – 15.00 WIB</p>
      </div>

      {/* GPS Location Status */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Titik GPS Lapangan</p>
            <p className="text-[11px] text-slate-500 font-mono">
              {geo.latitude.toFixed(6)}, {geo.longitude.toFixed(6)}
            </p>
            <p className="text-[10px] text-emerald-600 font-medium">Akurasi GPS: ~{Math.round(geo.accuracy || 10)} meter</p>
          </div>
        </div>
        <button
          onClick={geo.refresh}
          className="text-[10px] font-bold text-slate-600 hover:text-emerald-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200"
        >
          Refresh GPS
        </button>
      </div>

      {/* Strict Requirement Notice Alert */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 mb-4 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <p className="font-bold">Ketentuan Absensi Sales Alsyifa:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800 text-[11px]">
            <li>Jam masuk kerja mulai pukul <strong>08.00 WIB</strong> di area rute kerja.</li>
            <li>
              <strong>Sales TIDAK BISA absen pulang sebelum pukul 15.00 WIB</strong> di area kerja.
            </li>
            <li>Wajib menggunakan <strong>foto selfie terbaru dan titik koordinat GPS aktif</strong>.</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons: Clock In & Clock Out */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Clock In Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Absen Masuk</span>
            <div className="mt-2 mb-3">
              {attendance?.clock_in_time ? (
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{attendance.clock_in_time.substring(0, 5)} WIB</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Belum absen</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenClockIn}
            disabled={!!attendance?.clock_in_time}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              attendance?.clock_in_time
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>{attendance?.clock_in_time ? 'Sudah Masuk' : 'Selfie Masuk'}</span>
          </button>
        </div>

        {/* Clock Out Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Absen Pulang</span>
            <div className="mt-2 mb-3">
              {attendance?.clock_out_time ? (
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{attendance.clock_out_time.substring(0, 5)} WIB</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Minimal 15:00</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenClockOut}
            disabled={!attendance?.clock_in_time || !!attendance?.clock_out_time}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              attendance?.clock_out_time
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isBefore15
                ? 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>{attendance?.clock_out_time ? 'Sudah Pulang' : 'Selfie Pulang'}</span>
          </button>
        </div>
      </div>

      {/* Selfie Preview if completed */}
      {attendance?.clock_in_image && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Bukti Foto Selfie Hari Ini
          </h4>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 mb-1">Masuk ({attendance.clock_in_time?.substring(0, 5)})</p>
              <img
                src={getStorageUrl(attendance.clock_in_image)}
                alt="Selfie Masuk"
                className="w-full h-24 object-cover rounded-xl border border-slate-200"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/logo-transparent.png';
                }}
              />
            </div>
            {attendance.clock_out_image && (
              <div className="flex-1">
                <p className="text-[10px] text-slate-500 mb-1">Pulang ({attendance.clock_out_time?.substring(0, 5)})</p>
                <img
                  src={getStorageUrl(attendance.clock_out_image)}
                  alt="Selfie Pulang"
                  className="w-full h-24 object-cover rounded-xl border border-slate-200"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/logo-transparent.png';
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handlePhotoCaptured}
        title={cameraType === 'in' ? 'Ambil Foto Selfie Absen Masuk' : 'Ambil Foto Selfie Absen Pulang'}
      />
    </MobileLayout>
  );
}
