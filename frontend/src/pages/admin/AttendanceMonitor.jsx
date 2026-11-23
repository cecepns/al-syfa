import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Calendar,
  Clock,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function AttendanceMonitor() {
  const [attendances, setAttendances] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Selfie Preview Modal
  const [previewItem, setPreviewItem] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchAttendances();
  }, [page, limit, search, selectedDate]);

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

  const handleOpenPreview = (item) => {
    setPreviewItem(item);
    setPreviewOpen(true);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Monitoring Absensi Seluruh Cabang & Sales Lapangan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verifikasi kehadiran sales (08.00 – 15.00), foto selfie di lokasi kerja, dan titik GPS kedatangan/pulang.
          </p>
        </div>
      </div>

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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Sales Lapangan</th>
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-5 py-3 text-center">Jam Masuk (&ge; 08.00)</th>
                <th className="px-5 py-3 text-center">Jam Pulang (&ge; 15.00)</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Verifikasi Selfie & GPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
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
                    <td className="px-5 py-3.5 text-slate-600">{a.date}</td>
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
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenPreview(a)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Lihat Bukti Foto</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
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
                    src={previewItem.clock_in_image}
                    alt="Selfie Masuk"
                    className="w-full h-44 object-cover rounded-lg border border-slate-200"
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
                    src={previewItem.clock_out_image}
                    alt="Selfie Pulang"
                    className="w-full h-44 object-cover rounded-lg border border-slate-200"
                  />
                ) : (
                  <div className="h-44 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                    <Clock className="h-6 w-6 mb-1 text-slate-300" />
                    <span>Belum jam pulang (minimal 15.00 WIB)</span>
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
    </AdminLayout>
  );
}
