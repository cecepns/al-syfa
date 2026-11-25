import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Calendar,
  Clock,
  Eye,
  Edit2,
  Plus,
  Users,
  ShieldCheck,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import AppSelect from '../../components/common/AppSelect';
import { request } from '../../utils/request';
import { API_ENDPOINTS, getStorageUrl } from '../../utils/endpoints';

export default function AttendanceMonitor() {
  const currentUser = JSON.parse(localStorage.getItem('alsyifa_user') || '{}');
  const isAdminOnly = currentUser?.role === 'admin';

  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'schedules'
  const [attendances, setAttendances] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Selfie Preview Modal
  const [previewItem, setPreviewItem] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Edit Attendance Time Modal (Hanya Admin)
  const [editAttOpen, setEditAttOpen] = useState(false);
  const [editAttItem, setEditAttItem] = useState(null);
  const [attForm, setAttForm] = useState({
    clock_in_time: '08:00',
    clock_out_time: '',
    status: 'hadir',
    notes: '',
  });
  const [savingAtt, setSavingAtt] = useState(false);

  // Manual Attendance Modal (Hanya Admin)
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    sales_id: '',
    date: new Date().toISOString().split('T')[0],
    clock_in_time: '08:00',
    clock_out_time: '15:00',
    status: 'hadir',
    notes: 'Diatur oleh Admin',
  });
  const [savingManual, setSavingManual] = useState(false);

  // Edit Sales Work Schedule Modal (Hanya Admin)
  const [schedModalOpen, setSchedModalOpen] = useState(false);
  const [schedTarget, setSchedTarget] = useState(null);
  const [schedForm, setSchedForm] = useState({
    work_start_time: '08:00',
    work_end_time: '15:00',
    apply_to_all_sales: false,
  });
  const [savingSched, setSavingSched] = useState(false);

  useEffect(() => {
    fetchAttendances();
  }, [page, limit, search, selectedDate]);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ATTENDANCES.LIST, {
        page,
        limit,
        search,
        date: selectedDate || undefined,
      });
      setAttendances(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Gagal memuat rekap absensi');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    setSchedulesLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ATTENDANCES.SCHEDULE);
      setSchedules(res.data || []);
    } catch (err) {
      console.warn('Gagal memuat jadwal sales:', err);
    } finally {
      setSchedulesLoading(false);
    }
  };

  const handleOpenPreview = (item) => {
    setPreviewItem(item);
    setPreviewOpen(true);
  };

  // --- ADMIN ONLY: Edit existing attendance clock in/out ---
  const handleOpenEditAtt = (item) => {
    if (!isAdminOnly) {
      toast.error('Hanya akun Admin yang dapat mengubah jam absensi');
      return;
    }
    setEditAttItem(item);
    setAttForm({
      clock_in_time: item.clock_in_time ? item.clock_in_time.substring(0, 5) : '08:00',
      clock_out_time: item.clock_out_time ? item.clock_out_time.substring(0, 5) : '',
      status: item.status || 'hadir',
      notes: item.notes || '',
    });
    setEditAttOpen(true);
  };

  const handleSaveEditAtt = async (e) => {
    e.preventDefault();
    if (!editAttItem || !isAdminOnly) return;
    setSavingAtt(true);
    try {
      await request.put(API_ENDPOINTS.ATTENDANCES.ADMIN_UPDATE(editAttItem.id), {
        clock_in_time: attForm.clock_in_time ? `${attForm.clock_in_time}:00` : undefined,
        clock_out_time: attForm.clock_out_time ? `${attForm.clock_out_time}:00` : '',
        status: attForm.status,
        notes: attForm.notes,
      });
      toast.success(`Jam absensi ${editAttItem.sales_name} berhasil diperbarui!`);
      setEditAttOpen(false);
      fetchAttendances();
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui jam absensi');
    } finally {
      setSavingAtt(false);
    }
  };

  // --- ADMIN ONLY: Manual attendance entry ---
  const handleOpenManual = () => {
    if (!isAdminOnly) return;
    setManualForm({
      sales_id: schedules[0]?.id ? String(schedules[0].id) : '',
      date: selectedDate || new Date().toISOString().split('T')[0],
      clock_in_time: '08:00',
      clock_out_time: '',
      status: 'hadir',
      notes: 'Diatur oleh Admin',
    });
    setManualOpen(true);
  };

  const handleSaveManual = async (e) => {
    e.preventDefault();
    if (!manualForm.sales_id || !manualForm.date || !manualForm.clock_in_time) {
      toast.error('Pilih sales, tanggal, dan jam masuk');
      return;
    }
    setSavingManual(true);
    try {
      await request.post(API_ENDPOINTS.ATTENDANCES.ADMIN_RECORD, {
        sales_id: Number(manualForm.sales_id),
        date: manualForm.date,
        clock_in_time: `${manualForm.clock_in_time}:00`,
        clock_out_time: manualForm.clock_out_time ? `${manualForm.clock_out_time}:00` : null,
        status: manualForm.status,
        notes: manualForm.notes,
      });
      toast.success('Absensi sales berhasil diatur oleh Admin!');
      setManualOpen(false);
      fetchAttendances();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan absensi manual');
    } finally {
      setSavingManual(false);
    }
  };

  // --- ADMIN ONLY: Edit per-sales work schedule (Jam Masuk & Jam Pulang) ---
  const handleOpenEditSchedule = (salesUser) => {
    if (!isAdminOnly) {
      toast.error('Hanya akun Admin yang dapat mengatur jadwal jam kerja sales');
      return;
    }
    setSchedTarget(salesUser);
    setSchedForm({
      work_start_time: salesUser.work_start_time ? salesUser.work_start_time.substring(0, 5) : '08:00',
      work_end_time: salesUser.work_end_time ? salesUser.work_end_time.substring(0, 5) : '15:00',
      apply_to_all_sales: false,
    });
    setSchedModalOpen(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!schedTarget || !isAdminOnly) return;
    setSavingSched(true);
    try {
      await request.put(API_ENDPOINTS.USERS.UPDATE_SCHEDULE(schedTarget.id), {
        work_start_time: `${schedForm.work_start_time}:00`,
        work_end_time: `${schedForm.work_end_time}:00`,
        apply_to_all_sales: schedForm.apply_to_all_sales,
      });
      toast.success(
        schedForm.apply_to_all_sales
          ? 'Jadwal jam masuk & pulang diterapkan untuk seluruh sales!'
          : `Jadwal kerja ${schedTarget.name} berhasil diperbarui!`
      );
      setSchedModalOpen(false);
      fetchSchedules();
      fetchAttendances();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan jadwal kerja');
    } finally {
      setSavingSched(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Monitoring & Pengaturan Absensi Sales
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verifikasi kehadiran sales, bukti foto GPS, serta pengaturan jam masuk & pulang per sales (khusus Admin).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdminOnly ? (
            <button
              type="button"
              onClick={handleOpenManual}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-200 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Atur Absen Manual</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200">
              <Lock className="h-3.5 w-3.5" /> Mode Lihat (Edit Khusus Admin)
            </span>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'records'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Rekap Absensi Harian</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'schedules'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Atur Jam Masuk & Pulang Per Sales</span>
          {isAdminOnly && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">
              Admin
            </span>
          )}
        </button>
      </div>

      {activeTab === 'records' ? (
        <>
          {/* Filter and Date Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="w-full sm:w-80">
              <SearchInput
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                placeholder="Cari nama sales, lokasi..."
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Calendar className="h-4 w-4 text-emerald-600" /> Tanggal:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 p-2 text-slate-800 bg-white"
              />
            </div>
          </div>

          {/* Attendance Records Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Sales Lapangan</th>
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3 text-center">Jadwal Sales</th>
                    <th className="px-5 py-3 text-center">Jam Masuk</th>
                    <th className="px-5 py-3 text-center">Jam Pulang</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Aksi & Bukti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                        Memuat data absensi...
                      </td>
                    </tr>
                  ) : attendances.length > 0 ? (
                    attendances.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <strong className="font-bold text-slate-900 block text-xs">{a.sales_name}</strong>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {a.vehicle_type} ({a.vehicle_number || '-'})
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{a.date?.substring(0, 10)}</td>
                        <td className="px-5 py-3.5 text-center font-mono text-[11px] text-slate-500">
                          {a.work_start_time ? a.work_start_time.substring(0, 5) : '08:00'} -{' '}
                          {a.work_end_time ? a.work_end_time.substring(0, 5) : '15:00'}
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                          {a.clock_in_time ? `${a.clock_in_time.substring(0, 5)} WIB` : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                          {a.clock_out_time ? (
                            `${a.clock_out_time.substring(0, 5)} WIB`
                          ) : (
                            <span className="text-amber-600 italic font-semibold text-[11px]">
                              Sedang Bekerja
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            a.status === 'hadir'
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.status === 'terlambat'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1.5">
                          {isAdminOnly && (
                            <button
                              onClick={() => handleOpenEditAtt(a)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 text-[11px] font-bold transition-colors"
                              title="Edit Jam Masuk / Pulang (Admin)"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Edit Jam</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenPreview(a)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Bukti Foto</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                        Tidak ada catatan absensi pada tanggal ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                pagination={pagination}
                onPageChange={(p) => setPage(p)}
                onLimitChange={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
              />
            )}
          </div>
        </>
      ) : (
        /* Tab 2: Jadwal Jam Masuk & Pulang Per Sales */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Pengaturan Jadwal Jam Masuk & Pulang Per Sales
                </h3>
                <p className="text-xs text-slate-500">
                  Jadwal ini otomatis menentukan batas waktu absen pulang dan notifikasi pengingat di aplikasi HP Sales.
                </p>
              </div>
            </div>
            {!isAdminOnly && (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Hanya Admin yang dapat mengubah jadwal
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Nama Sales</th>
                  <th className="px-5 py-3">Kendaraan</th>
                  <th className="px-5 py-3 text-center">Jam Masuk</th>
                  <th className="px-5 py-3 text-center">Jam Pulang</th>
                  <th className="px-5 py-3 text-center">Status Akun</th>
                  {isAdminOnly && <th className="px-5 py-3 text-right">Aksi Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {schedulesLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      Memuat daftar sales...
                    </td>
                  </tr>
                ) : schedules.length > 0 ? (
                  schedules.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <strong className="font-bold text-slate-900 block text-xs">{s.name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">@{s.username}</span>
                      </td>
                      <td className="px-5 py-3.5 capitalize text-slate-600">
                        {s.vehicle_type} ({s.vehicle_number || '-'})
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono font-bold">
                          {s.work_start_time ? s.work_start_time.substring(0, 5) : '08:00'} WIB
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-mono font-bold">
                          {s.work_end_time ? s.work_end_time.substring(0, 5) : '15:00'} WIB
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {s.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      {isAdminOnly && (
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenEditSchedule(s)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors"
                          >
                            <Clock className="h-3.5 w-3.5" />
                            <span>Atur Jam Kerja</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      Belum ada akun sales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selfie & GPS Verification Modal */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Bukti Absensi: ${previewItem?.sales_name || ''}`}
        maxWidth="max-w-lg"
      >
        {previewItem && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Foto Selfie Masuk ({previewItem.clock_in_time?.substring(0, 5)} WIB)
                </span>
                {previewItem.clock_in_image ? (
                  <img
                    src={getStorageUrl(previewItem.clock_in_image)}
                    alt="Selfie Masuk"
                    className="w-full h-44 object-cover rounded-lg border border-slate-200"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/logo-transparent.png';
                    }}
                  />
                ) : (
                  <div className="h-44 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                    Tidak ada foto
                  </div>
                )}
                <p className="text-[10px] text-slate-600 mt-2 font-mono">
                  GPS: {previewItem.clock_in_lat}, {previewItem.clock_in_lng}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{previewItem.clock_in_address}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Foto Selfie Pulang ({previewItem.clock_out_time ? `${previewItem.clock_out_time.substring(0, 5)} WIB` : 'Belum Absen Pulang'})
                </span>
                {previewItem.clock_out_image ? (
                  <img
                    src={getStorageUrl(previewItem.clock_out_image)}
                    alt="Selfie Pulang"
                    className="w-full h-44 object-cover rounded-lg border border-slate-200"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/logo-transparent.png';
                    }}
                  />
                ) : (
                  <div className="h-44 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                    <Clock className="h-6 w-6 mb-1 text-slate-300" />
                    <span>Belum absen pulang</span>
                  </div>
                )}
                {previewItem.clock_out_lat && (
                  <>
                    <p className="text-[10px] text-slate-600 mt-2 font-mono">
                      GPS: {previewItem.clock_out_lat}, {previewItem.clock_out_lng}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{previewItem.clock_out_address}</p>
                  </>
                )}
              </div>
            </div>

            {previewItem.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-700">Catatan Absensi:</p>
                <p className="text-slate-600 mt-0.5">{previewItem.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Edit Jam Absen (Hanya Admin) */}
      <Modal
        isOpen={editAttOpen}
        onClose={() => setEditAttOpen(false)}
        title={`Edit Jam Absensi - ${editAttItem?.sales_name || ''}`}
      >
        <form onSubmit={handleSaveEditAtt} className="space-y-4 text-xs">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Koreksi jam masuk & pulang absensi ini hanya tersedia untuk akun <strong>Admin</strong>.</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jam Masuk (WIB) *
              </label>
              <input
                type="time"
                required
                value={attForm.clock_in_time}
                onChange={(e) => setAttForm({ ...attForm, clock_in_time: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jam Pulang (WIB)
              </label>
              <input
                type="time"
                value={attForm.clock_out_time}
                onChange={(e) => setAttForm({ ...attForm, clock_out_time: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-800"
              />
              <span className="text-[10px] text-slate-400">Kosongkan jika belum pulang</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Status Kehadiran
            </label>
            <AppSelect
              value={attForm.status}
              onChange={(val) => setAttForm({ ...attForm, status: val })}
              options={[
                { value: 'hadir', label: 'Hadir Tepat Waktu' },
                { value: 'terlambat', label: 'Terlambat' },
                { value: 'izin', label: 'Izin / Tugas Luar' },
              ]}
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan Koreksi Admin
            </label>
            <textarea
              rows={2}
              value={attForm.notes}
              onChange={(e) => setAttForm({ ...attForm, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditAttOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingAtt}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow disabled:opacity-50"
            >
              {savingAtt ? 'Menyimpan...' : 'Simpan Jam Absen'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Input Absen Manual (Hanya Admin) */}
      <Modal
        isOpen={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Input / Atur Absen Manual Sales (Admin)"
      >
        <form onSubmit={handleSaveManual} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pilih Sales *
            </label>
            <AppSelect
              value={manualForm.sales_id}
              onChange={(val) => setManualForm({ ...manualForm, sales_id: val })}
              placeholder="Pilih sales..."
              options={schedules.map((s) => ({ value: String(s.id), label: s.name }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal *
              </label>
              <input
                type="date"
                required
                value={manualForm.date}
                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status *
              </label>
              <AppSelect
                value={manualForm.status}
                onChange={(val) => setManualForm({ ...manualForm, status: val })}
                options={[
                  { value: 'hadir', label: 'Hadir' },
                  { value: 'terlambat', label: 'Terlambat' },
                  { value: 'izin', label: 'Izin' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jam Masuk *
              </label>
              <input
                type="time"
                required
                value={manualForm.clock_in_time}
                onChange={(e) => setManualForm({ ...manualForm, clock_in_time: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jam Pulang (Opsional)
              </label>
              <input
                type="time"
                value={manualForm.clock_out_time}
                onChange={(e) => setManualForm({ ...manualForm, clock_out_time: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Keterangan Admin
            </label>
            <input
              type="text"
              value={manualForm.notes}
              onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setManualOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingManual}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow disabled:opacity-50"
            >
              {savingManual ? 'Menyimpan...' : 'Simpan Absensi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Atur Jadwal Jam Masuk & Pulang Per Sales (Hanya Admin) */}
      <Modal
        isOpen={schedModalOpen}
        onClose={() => setSchedModalOpen(false)}
        title={`Atur Jam Kerja - ${schedTarget?.name || ''}`}
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900">
            <p className="font-bold">Jadwal Jam Kerja & Notifikasi Sales</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Sales akan menerima pengingat notifikasi mendekati jam masuk dan jam pulang sesuai jadwal yang diatur di sini.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jam Masuk (WIB) *
              </label>
              <input
                type="time"
                required
                value={schedForm.work_start_time}
                onChange={(e) => setSchedForm({ ...schedForm, work_start_time: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-emerald-700 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jam Pulang (WIB) *
              </label>
              <input
                type="time"
                required
                value={schedForm.work_end_time}
                onChange={(e) => setSchedForm({ ...schedForm, work_end_time: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-blue-700 text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={schedForm.apply_to_all_sales}
              onChange={(e) => setSchedForm({ ...schedForm, apply_to_all_sales: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-slate-700 font-semibold">
              Terapkan jam kerja ini untuk <strong>semua akun sales</strong> sekaligus
            </span>
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSchedModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingSched}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow disabled:opacity-50"
            >
              {savingSched ? 'Menyimpan...' : 'Simpan Jadwal'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
