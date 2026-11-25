import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Smartphone,
  Truck,
  PhoneCall,
  Mail,
  UserCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import AppSelect from '../../components/common/AppSelect';
import { request } from '../../utils/request';
import { API_ENDPOINTS, getStorageUrl } from '../../utils/endpoints';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const currentUser = JSON.parse(localStorage.getItem('alsyifa_user') || '{}');

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'sales',
    phone: '',
    vehicle_type: 'van',
    vehicle_number: '',
    work_start_time: '08:00',
    work_end_time: '15:00',
    is_active: 1
  });

  // Delete Confirm State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, limit, search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.USERS.LIST, {
        page,
        limit,
        search,
        role: roleFilter || undefined,
      });
      setUsers(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'sales',
      phone: '',
      vehicle_type: 'van',
      vehicle_number: '',
      work_start_time: '08:00',
      work_end_time: '15:00',
      is_active: 1
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditId(u.id);
    setForm({
      name: u.name,
      username: u.username,
      email: u.email,
      password: '', // leave empty if not changing
      role: u.role,
      phone: u.phone || '',
      vehicle_type: u.vehicle_type || 'van',
      vehicle_number: u.vehicle_number || '',
      work_start_time: u.work_start_time ? u.work_start_time.substring(0, 5) : '08:00',
      work_end_time: u.work_end_time ? u.work_end_time.substring(0, 5) : '15:00',
      is_active: u.is_active !== undefined ? u.is_active : 1
    });
    setModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.email) {
      toast.error('Nama, username, dan email wajib diisi');
      return;
    }
    if (!editId && !form.password) {
      toast.error('Password wajib diisi untuk pengguna baru');
      return;
    }

    setSubmitting(true);
    try {
      if (editId) {
        await request.put(API_ENDPOINTS.USERS.UPDATE(editId), form);
        toast.success('Data pengguna berhasil diperbarui!');
      } else {
        await request.post(API_ENDPOINTS.USERS.CREATE, form);
        toast.success('Pengguna baru berhasil ditambahkan!');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data pengguna');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    if (deleteId === currentUser.id) {
      toast.error('Anda tidak dapat menghapus akun Anda sendiri');
      setDeleteOpen(false);
      return;
    }

    try {
      await request.del(API_ENDPOINTS.USERS.DELETE(deleteId));
      toast.success('Pengguna berhasil dihapus');
      setDeleteOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus pengguna');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            Manajemen Pengguna & Sales Lapangan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola akun petugas Sales Manager (Admin), Supervisor Kantor, dan Sales Lapangan.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pengguna Baru</span>
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
            placeholder="Cari nama, username, no hp..."
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
          {[
            { key: '', label: 'Semua Role' },
            { key: 'admin', label: 'Admin (Manager)' },
            { key: 'supervisor', label: 'Supervisor' },
            { key: 'sales', label: 'Sales Lapangan' },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => {
                setRoleFilter(r.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                roleFilter === r.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Nama & Username</th>
                <th className="px-5 py-3">Peran (Role)</th>
                <th className="px-5 py-3">Kontak & Email</th>
                <th className="px-5 py-3">Unit Kendaraan</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : u.role === 'supervisor'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {u.avatar ? (
                              <img
                                src={getStorageUrl(u.avatar)}
                                alt={u.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              u.name?.charAt(0)
                            )}
                          </div>
                          <div>
                            <strong className="font-bold text-slate-900 block text-xs">
                              {u.name} {isCurrent && <span className="text-[10px] text-emerald-600 font-semibold">(Anda)</span>}
                            </strong>
                            <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                          u.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : u.role === 'supervisor'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          <Shield className="h-3 w-3" />
                          {u.role === 'admin' ? 'Admin / Manager' : u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-600 flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" /> {u.email}
                        </p>
                        {u.phone && (
                          <a
                            href={`https://wa.me/62${u.phone.replace(/^0/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:underline flex items-center gap-1 font-medium mt-0.5"
                          >
                            <PhoneCall className="h-3 w-3" /> {u.phone}
                          </a>
                        )}
                      </td>
                      <td className="px-5 py-3.5 capitalize">
                        {u.role === 'sales' ? (
                          <div>
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                              {u.vehicle_type === 'motor' ? '🛵 Motoris' : '🚐 Mobil Van'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{u.vehicle_number || '-'}</span>
                            <span className="text-[10px] text-emerald-700 font-mono font-semibold">
                              Jam: {u.work_start_time ? u.work_start_time.substring(0, 5) : '08:00'} - {u.work_end_time ? u.work_end_time.substring(0, 5) : '15:00'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pusat / Kantor</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {u.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                          title="Edit Pengguna"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(u.id);
                            setDeleteOpen(true);
                          }}
                          disabled={isCurrent}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Tidak ada pengguna yang sesuai pencarian.
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

      {/* Modal Add / Edit User */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Data Pengguna' : 'Tambah Pengguna / Sales Baru'}
      >
        <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Lengkap Petugas *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Rian Hidayat (Sales Motoris)"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username Login *
              </label>
              <input
                type="text"
                required
                disabled={!!editId}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="sales4"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 disabled:bg-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Peran Akun (Role) *
              </label>
              <AppSelect
                value={form.role}
                onChange={(val) => setForm({ ...form, role: val })}
                options={[
                  { value: 'sales', label: 'Sales Lapangan' },
                  { value: 'supervisor', label: 'Supervisor' },
                  { value: 'admin', label: 'Admin / Sales Manager' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="petugas@alsyifa.com"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                No. WhatsApp / HP
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="08123456789"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              {editId ? 'Ganti Password (Kosongkan jika tidak ingin diubah)' : 'Password Login *'}
            </label>
            <input
              type="password"
              required={!editId}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editId ? '••••••••' : 'Masukkan password...'}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
            />
          </div>

          {form.role === 'sales' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                Informasi Kendaraan Sales Lapangan
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Tipe Kendaraan</label>
                  <AppSelect
                    value={form.vehicle_type}
                    onChange={(val) => setForm({ ...form, vehicle_type: val })}
                    options={[
                      { value: 'van', label: 'Mobil Van' },
                      { value: 'motor', label: 'Sepeda Motor' },
                      { value: 'mobil_box', label: 'Mobil Box' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Plat Nomor Kendaraan</label>
                  <input
                    type="text"
                    value={form.vehicle_number}
                    onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                    placeholder="B 1234 ABC"
                    className="w-full rounded-lg border border-slate-200 p-2 text-slate-800 font-mono uppercase bg-white"
                  />
                </div>
              </div>

              {currentUser?.role === 'admin' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[10px] text-emerald-700 font-bold mb-0.5">
                      Jam Masuk Kerja (Admin)
                    </label>
                    <input
                      type="time"
                      value={form.work_start_time}
                      onChange={(e) => setForm({ ...form, work_start_time: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-slate-800 font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-blue-700 font-bold mb-0.5">
                      Jam Pulang Kerja (Admin)
                    </label>
                    <input
                      type="time"
                      value={form.work_end_time}
                      onChange={(e) => setForm({ ...form, work_end_time: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-slate-800 font-mono font-bold bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
              {submitting ? 'Menyimpan...' : 'Simpan Pengguna'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Pengguna"
        message="Apakah Anda yakin ingin menghapus akun pengguna ini dari sistem?"
      />
    </AdminLayout>
  );
}
