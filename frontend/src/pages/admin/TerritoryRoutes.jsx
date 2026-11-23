import React, { useState, useEffect } from 'react';
import {
  Route as RouteIcon,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Calendar,
  Users,
  Store,
  CheckCircle2,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function TerritoryRoutes() {
  const [routes, setRoutes] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    sales_id: '',
    day_of_week: 'senin',
    province_name: 'Jawa Barat',
    regency_name: 'Kabupaten Bogor',
    district_code: '',
    district_name: '',
    village_names: '',
    notes: '',
    customer_ids: []
  });

  // Wilayah.id Integration for District & Villages
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  // Delete Confirm State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, [page, limit, search, selectedDay]);

  useEffect(() => {
    fetchSalesAndCustomers();
    loadDistricts('32.01'); // Kabupaten Bogor
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ROUTES.LIST, {
        page,
        limit,
        search,
        day_of_week: selectedDay || undefined,
      });
      setRoutes(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Gagal memuat rute');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesAndCustomers = async () => {
    try {
      const [uRes, cRes] = await Promise.all([
        request.get(API_ENDPOINTS.USERS.LIST, { role: 'sales', limit: 50 }),
        request.get(API_ENDPOINTS.CUSTOMERS.LIST, { limit: 100 }),
      ]);
      setSalesList(uRes.data || []);
      setCustomerList(cRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDistricts = async (regCode) => {
    try {
      const res = await request.get(API_ENDPOINTS.WILAYAH.DISTRICTS(regCode));
      setDistricts(res.data || []);
    } catch (e) {
      console.warn(e);
    }
  };

  const loadVillages = async (distCode) => {
    try {
      const res = await request.get(API_ENDPOINTS.WILAYAH.VILLAGES(distCode));
      setVillages(res.data || []);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDistrictChange = (distCode) => {
    const selected = districts.find((d) => d.code === distCode);
    setForm((prev) => ({
      ...prev,
      district_code: distCode,
      district_name: selected?.name || '',
      village_names: '',
    }));
    loadVillages(distCode);
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({
      sales_id: salesList[0]?.id || '',
      day_of_week: 'senin',
      province_name: 'Jawa Barat',
      regency_name: 'Kabupaten Bogor',
      district_code: '',
      district_name: '',
      village_names: '',
      notes: '',
      customer_ids: []
    });
    setModalOpen(true);
  };

  const handleOpenEdit = async (route) => {
    setEditId(route.id);
    setForm({
      sales_id: route.sales_id,
      day_of_week: route.day_of_week,
      province_name: route.province_name,
      regency_name: route.regency_name,
      district_code: route.district_code || '',
      district_name: route.district_name,
      village_names: route.village_names || '',
      notes: route.notes || '',
      customer_ids: []
    });
    if (route.district_code) {
      loadVillages(route.district_code);
    }
    setModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!form.sales_id || !form.district_name) {
      toast.error('Pilih sales dan kecamatan wilayah kerja');
      return;
    }

    setSubmitting(true);
    try {
      if (editId) {
        await request.put(API_ENDPOINTS.ROUTES.UPDATE(editId), form);
        toast.success('Rute wilayah berhasil diperbarui!');
      } else {
        await request.post(API_ENDPOINTS.ROUTES.CREATE, form);
        toast.success('Jadwal rute wilayah baru berhasil dibuat!');
      }
      setModalOpen(false);
      fetchRoutes();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan rute');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await request.del(API_ENDPOINTS.ROUTES.DELETE(deleteId));
      toast.success('Rute berhasil dihapus');
      setDeleteOpen(false);
      fetchRoutes();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus rute');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Pemetaan & Manajemen Wilayah Kerja (Senin – Sabtu)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Atur zona kluster kerja per sales mulai dari tingkat Kecamatan hingga Desa/Kelurahan via wilayah.id.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Jadwal Rute</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Cari kecamatan, desa, sales..."
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
          {[
            { key: '', label: 'Semua Hari' },
            { key: 'senin', label: 'Senin' },
            { key: 'selasa', label: 'Selasa' },
            { key: 'rabu', label: 'Rabu' },
            { key: 'kamis', label: 'Kamis' },
            { key: 'jumat', label: 'Jumat' },
            { key: 'sabtu', label: 'Sabtu' },
          ].map((d) => (
            <button
              key={d.key}
              onClick={() => {
                setSelectedDay(d.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                selectedDay === d.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Hari</th>
                <th className="px-5 py-3">Sales Petugas</th>
                <th className="px-5 py-3">Kecamatan</th>
                <th className="px-5 py-3">Cakupan Desa / Kelurahan</th>
                <th className="px-5 py-3 text-center">Toko Terdaftar</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Memuat data rute...
                  </td>
                </tr>
              ) : routes.length > 0 ? (
                routes.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-xs uppercase px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800">
                        {r.day_of_week}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800">{r.sales_name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {r.vehicle_type} ({r.vehicle_number || '-'})
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      {r.district_name}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs text-slate-600">
                      {r.village_names || 'Seluruh Desa'}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                      {r.total_customers || 0} Toko
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                        title="Edit Rute"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(r.id);
                          setDeleteOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50"
                        title="Hapus Rute"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Tidak ada jadwal rute yang cocok dengan pencarian.
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

      {/* Modal Add / Edit Route */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Jadwal Rute Wilayah' : 'Tambah Jadwal Rute Wilayah Baru'}
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sales Petugas *
              </label>
              <select
                required
                value={form.sales_id}
                onChange={(e) => setForm({ ...form, sales_id: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 bg-white"
              >
                <option value="">Pilih Sales...</option>
                {salesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.vehicle_type} - {s.vehicle_number || ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hari Rute (Senin - Sabtu) *
              </label>
              <select
                required
                value={form.day_of_week}
                onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 bg-white capitalize"
              >
                <option value="senin">Senin</option>
                <option value="selasa">Selasa</option>
                <option value="rabu">Rabu</option>
                <option value="kamis">Kamis</option>
                <option value="jumat">Jumat</option>
                <option value="sabtu">Sabtu</option>
              </select>
            </div>
          </div>

          {/* Wilayah.id integration */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
              Pemetaan Wilayah (API wilayah.id)
            </span>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Kecamatan *</label>
              <select
                required
                value={form.district_code}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 bg-white"
              >
                <option value="">Pilih Kecamatan di Kab. Bogor...</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Desa / Kelurahan (Bisa pilih dari daftar atau ketik bebas):
              </label>
              <input
                type="text"
                value={form.village_names}
                onChange={(e) => setForm({ ...form, village_names: e.target.value })}
                placeholder="Contoh: Pondok Rajeg, Karadenan, Harapanjaya"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 bg-white"
              />
              {villages.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {villages.map((v) => (
                    <button
                      type="button"
                      key={v.code}
                      onClick={() => {
                        const current = form.village_names ? form.village_names.split(',').map((s) => s.trim()) : [];
                        if (!current.includes(v.name)) {
                          current.push(v.name);
                          setForm({ ...form, village_names: current.join(', ') });
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold hover:bg-emerald-100"
                    >
                      + {v.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Catatan Rute / Instruksi Khusus:</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Fokus toko grosir dan re-order..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Rute'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Jadwal Rute"
        message="Apakah Anda yakin ingin menghapus jadwal rute wilayah ini?"
      />
    </AdminLayout>
  );
}
