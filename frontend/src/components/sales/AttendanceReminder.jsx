import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Clock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

function parseTimeToMinutes(timeStr, fallbackH, fallbackM) {
  if (!timeStr) return fallbackH * 60 + fallbackM;
  const parts = String(timeStr).split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return fallbackH * 60 + fallbackM;
  return h * 60 + m;
}

function formatHHMM(timeStr, fallback) {
  if (!timeStr) return fallback;
  return String(timeStr).substring(0, 5);
}

export default function AttendanceReminder() {
  const user = JSON.parse(localStorage.getItem('alsyifa_user') || '{}');
  const [todayData, setTodayData] = useState(null);
  const [now, setNow] = useState(new Date());
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  const isSales = user?.role === 'sales';

  const fetchToday = async () => {
    if (!isSales) return;
    try {
      const res = await request.get(API_ENDPOINTS.ATTENDANCES.TODAY);
      setTodayData(res.data || null);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (!isSales) return;
    fetchToday();

    const dataInterval = setInterval(fetchToday, 60000);
    const clockInterval = setInterval(() => setNow(new Date()), 30000);
    const handleUpdated = () => fetchToday();

    window.addEventListener('alsyifa-attendance-updated', handleUpdated);
    return () => {
      clearInterval(dataInterval);
      clearInterval(clockInterval);
      window.removeEventListener('alsyifa-attendance-updated', handleUpdated);
    };
  }, [isSales]);

  const schedule = todayData?.schedule || {
    work_start_time: user?.work_start_time || '08:00:00',
    work_end_time: user?.work_end_time || '15:00:00',
  };

  const startMin = parseTimeToMinutes(schedule.work_start_time, 8, 0);
  const endMin = parseTimeToMinutes(schedule.work_end_time, 15, 0);
  const startLabel = formatHHMM(schedule.work_start_time, '08:00');
  const endLabel = formatHHMM(schedule.work_end_time, '15:00');
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const hasClockIn = !!todayData?.clock_in_time;
  const hasClockOut = !!todayData?.clock_out_time;

  let reminder = null;
  if (isSales && todayData !== null) {
    if (!hasClockIn && currentMin >= startMin - 15 && currentMin < endMin) {
      const isLateOrDue = currentMin >= startMin;
      reminder = {
        type: 'in',
        urgent: isLateOrDue,
        title: isLateOrDue ? 'Waktunya Absen Masuk!' : 'Pengingat Jam Masuk Kerja',
        message: isLateOrDue
          ? `Jadwal masuk Anda pukul ${startLabel} WIB. Segera lakukan selfie absen masuk.`
          : `Jadwal masuk pukul ${startLabel} WIB (sebentar lagi). Siapkan absen GPS Anda.`,
        cta: 'Absen Masuk',
      };
    } else if (hasClockIn && !hasClockOut && currentMin >= endMin - 15) {
      const isTimeOut = currentMin >= endMin;
      reminder = {
        type: 'out',
        urgent: isTimeOut,
        title: isTimeOut ? 'Waktunya Absen Pulang!' : 'Pengingat Jam Pulang Kerja',
        message: isTimeOut
          ? `Jadwal pulang Anda pukul ${endLabel} WIB. Silakan lakukan selfie absen pulang.`
          : `Jam pulang pukul ${endLabel} WIB sebentar lagi. Selesaikan kunjungan toko Anda.`,
        cta: 'Absen Pulang',
      };
    }
  }

  // Trigger 1x toast & Web Notification per reminder state per day
  useEffect(() => {
    if (!reminder) return;
    const todayKey = new Date().toISOString().split('T')[0];
    const storageKey = `alsyifa_att_notif_${reminder.type}_${reminder.urgent ? 'due' : 'pre'}_${todayKey}`;
    if (sessionStorage.getItem(storageKey)) return;

    sessionStorage.setItem(storageKey, '1');
    toast(
      (t) => (
        <div className="text-xs">
          <p className="font-bold text-slate-900">{reminder.title}</p>
          <p className="text-slate-600 mt-0.5">{reminder.message}</p>
        </div>
      ),
      {
        icon: reminder.type === 'in' ? '⏰' : '🏠',
        duration: 6000,
      }
    );

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`ALSYFA Sales - ${reminder.title}`, {
          body: reminder.message,
          icon: '/logo-transparent.png',
        });
      } catch {
        // ignore mobile browsers blocking direct Notification constructor
      }
    }
  }, [reminder?.type, reminder?.urgent]);

  const handleEnableBrowserNotif = async () => {
    if (typeof Notification === 'undefined') {
      toast.error('Browser tidak mendukung notifikasi sistem');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        toast.success('Notifikasi pengingat absen aktif!');
      } else {
        toast.error('Izin notifikasi ditolak browser');
      }
    } catch {
      toast.error('Gagal mengaktifkan notifikasi');
    }
  };

  if (!isSales || !reminder) return null;

  return (
    <div
      className={`mb-3 rounded-2xl p-3 border shadow-sm transition-all ${
        reminder.urgent
          ? 'bg-amber-50 border-amber-300 text-amber-950'
          : 'bg-blue-50 border-blue-200 text-blue-950'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              reminder.urgent ? 'bg-amber-500 text-white animate-pulse' : 'bg-blue-600 text-white'
            }`}
          >
            <Bell className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <p className="font-extrabold flex items-center gap-1.5">
              <span>{reminder.title}</span>
            </p>
            <p className="text-[11px] opacity-85 mt-0.5 leading-snug">{reminder.message}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Link
                to="/sales/absensi"
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white shadow-sm ${
                  reminder.urgent ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Clock className="h-3 w-3" />
                <span>{reminder.cta}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>

              {notifPermission === 'default' && (
                <button
                  type="button"
                  onClick={handleEnableBrowserNotif}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-white/80 hover:bg-white text-slate-700 border border-slate-200"
                >
                  <Bell className="h-3 w-3 text-emerald-600" />
                  <span>Aktifkan Notif HP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
