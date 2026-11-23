import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Tag, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    category: 'Madu Herbal',
    unit: 'botol',
    cost_price: 50000,
    price: 75000,
    warehouse_stock: 100,
    description: ''
  });

  // Delete Confirm State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [page, limit, search, category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.PRODUCTS.LIST, {
        page,
        limit,
        search,
        category: category || undefined,
      });
      setProducts(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditId(null);
    const code = `PRD-${String(Date.now()).slice(-3)}`;
    setForm({
      code,
      name: '',
      category: 'Madu Herbal',
      unit: 'botol',
      cost_price: 50000,
      price: 75000,
      warehouse_stock: 100,
      description: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditId(p.id);
    setForm({
      code: p.code,
      name: p.name,
      category: p.category,
      unit: p.unit,
      cost_price: p.cost_price,
      price: p.price,
      warehouse_stock: p.warehouse_stock,
      description: p.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.price) {
      toast.error('Kode, nama, dan harga produk wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      if (editId) {
        await request.put(API_ENDPOINTS.PRODUCTS.UPDATE(editId), form);
        toast.success('Produk berhasil diperbarui!');
      } else {
        await request.post(API_ENDPOINTS.PRODUCTS.CREATE, form);
        toast.success('Produk baru berhasil ditambahkan!');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan produk');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await request.del(API_ENDPOINTS.PRODUCTS.DELETE(deleteId));
      toast.success('Produk berhasil dihapus');
      setDeleteOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus produk');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Katalog Produk Alsyifa Herbal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola master data produk, harga jual standar, dan ketersediaan stok gudang pusat.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Produk Baru</span>
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
            placeholder="Cari nama produk, kode..."
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
          {['', 'Madu Herbal', 'Herbal Imunitas', 'Minyak Sehat', 'Suplemen Alami', 'Madu Anak', 'Teh Herbal'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                category === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat || 'Semua Kategori'}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Kode</th>
                <th className="px-5 py-3">Nama Produk</th>
                <th className="px-5 py-3">Kategori</th>
                <th className="px-5 py-3 text-right">Harga Modal</th>
                <th className="px-5 py-3 text-right">Harga Jual</th>
                <th className="px-5 py-3 text-center">Stok Gudang</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Memuat produk...
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-400">{p.code}</td>
                    <td className="px-5 py-3.5">
                      <strong className="font-bold text-slate-900 block text-xs">{p.name}</strong>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{p.description}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-500">
                      Rp {Number(p.cost_price).toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-slate-900">
                      Rp {Number(p.price).toLocaleString('id-ID')} / {p.unit}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800">
                        {p.warehouse_stock} {p.unit}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                        title="Edit Produk"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(p.id);
                          setDeleteOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50"
                        title="Hapus Produk"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Tidak ada produk yang sesuai.
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

      {/* Modal Add / Edit Product */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Data Produk Herbal' : 'Tambah Produk Baru'}
      >
        <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kode Produk *
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kategori
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 bg-white"
              >
                <option value="Madu Herbal">Madu Herbal</option>
                <option value="Herbal Imunitas">Herbal Imunitas</option>
                <option value="Minyak Sehat">Minyak Sehat</option>
                <option value="Suplemen Alami">Suplemen Alami</option>
                <option value="Madu Anak">Madu Anak</option>
                <option value="Teh Herbal">Teh Herbal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Produk *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Satuan *
              </label>
              <input
                type="text"
                required
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="botol, dus, kotak"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Harga Modal (Rp)
              </label>
              <input
                type="number"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Harga Jual (Rp) *
              </label>
              <input
                type="number"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Stok Gudang Pusat *
            </label>
            <input
              type="number"
              required
              value={form.warehouse_stock}
              onChange={(e) => setForm({ ...form, warehouse_stock: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Deskripsi Produk:</label>
            <textarea
              rows={2}
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
              {submitting ? 'Menyimpan...' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Produk"
        message="Apakah Anda yakin ingin menghapus produk ini dari katalog?"
      />
    </AdminLayout>
  );
}
