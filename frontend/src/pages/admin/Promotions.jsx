import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Edit2, Trash2, Calendar, Tag, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import AppSelect from '../../components/common/AppSelect';
import { request } from '../../utils/request';
import { API_ENDPOINTS, getStorageUrl } from '../../utils/endpoints';

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 500000,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  });

  // Delete Confirm State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, [page, limit, search]);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.PROMOTIONS.LIST, {
        page,
        limit,
        search,
      });
      setPromotions(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Gagal memuat promo');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({
      title: '',
      code: `PROMO-${Math.floor(1000 + Math.random() * 9000)}`,
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 500000,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (pr) => {
    setEditId(pr.id);
    setForm({
      title: pr.title,
      code: pr.code,
      description: pr.description,
      discount_type: pr.discount_type,
      discount_value: pr.discount_value,
      min_order_amount: pr.min_order_amount,
      start_date: pr.start_date,
      end_date: pr.end_date,
    });
    setModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!form.title || !form.code || !form.description) {
      toast.error('Judul, kode, dan deskripsi promo wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      if (editId) {
        await request.put(API_ENDPOINTS.PROMOTIONS.UPDATE(editId), form);
        toast.success('Agenda promo berhasil diperbarui!');
      } else {
        await request.post(API_ENDPOINTS.PROMOTIONS.CREATE, form);
        toast.success('Agenda promo baru berhasil ditambahkan!');
      }
      setModalOpen(false);
      fetchPromotions();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan promo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await request.del(API_ENDPOINTS.PROMOTIONS.DELETE(deleteId));
      toast.success('Promo berhasil dihapus');
      setDeleteOpen(false);
      fetchPromotions();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus promo');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Agenda Promo Bulanan Pusat
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola program diskon dan potongan harga untuk memotivasi toko melakukan repeat order melalui sales.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Promo Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex items-center justify-between">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Cari judul promo, kode..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Kode Promo</th>
                <th className="px-5 py-3">Judul Program</th>
                <th className="px-5 py-3">Besaran Potongan</th>
                <th className="px-5 py-3">Minimal Belanja</th>
                <th className="px-5 py-3">Periode Berlaku</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Memuat agenda promo...
                  </td>
                </tr>
              ) : promotions.length > 0 ? (
                promotions.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-amber-700 bg-amber-50/50">
                      {pr.code}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {pr.banner_image && (
                          <div className="h-10 w-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                            <img
                              src={getStorageUrl(pr.banner_image)}
                              alt={pr.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div>
                          <strong className="font-bold text-slate-900 block text-xs">{pr.title}</strong>
                          <span className="text-[10px] text-slate-500 line-clamp-1">{pr.description}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-black text-rose-600">
                      {pr.discount_type === 'percentage'
                        ? `Diskon ${Number(pr.discount_value)}%`
                        : `Potongan Rp ${Number(pr.discount_value).toLocaleString('id-ID')}`}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      Rp {Number(pr.min_order_amount).toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {pr.start_date} s/d {pr.end_date}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(pr)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                        title="Edit Promo"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(pr.id);
                          setDeleteOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50"
                        title="Hapus Promo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Belum ada agenda promo.
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

      {/* Modal Add / Edit Promo */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Agenda Promo' : 'Tambah Promo Baru'}
      >
        <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Judul Program Promo *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Promo Berkah Awal Pekan Herbal"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kode Promo *
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipe Diskon
              </label>
              <AppSelect
                value={form.discount_type}
                onChange={(val) => setForm({ ...form, discount_type: val })}
                options={[
                  { value: 'percentage', label: 'Persentase (%)' },
                  { value: 'fixed', label: 'Nominal Tetap (Rp)' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nilai Diskon *
              </label>
              <input
                type="number"
                required
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Minimal Pembelian (Rp) *
              </label>
              <input
                type="number"
                required
                value={form.min_order_amount}
                onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Mulai *
              </label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Selesai *
              </label>
              <input
                type="date"
                required
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Syarat & Ketentuan Promo:</label>
            <textarea
              rows={2}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              {submitting ? 'Menyimpan...' : 'Simpan Promo'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Agenda Promo"
        message="Apakah Anda yakin ingin menghapus program promo ini?"
      />
    </AdminLayout>
  );
}
