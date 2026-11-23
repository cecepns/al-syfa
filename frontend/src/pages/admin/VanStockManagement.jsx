import React, { useState, useEffect } from 'react';
import { Truck, Plus, Package, RotateCcw, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function VanStockManagement() {
  const [vanStocks, setVanStocks] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSalesId, setSelectedSalesId] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Allocate Stock Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    sales_id: '',
    product_id: '',
    qty: 20,
    date: new Date().toISOString().split('T')[0],
    notes: 'Alokasi pagi dari gudang utama'
  });

  useEffect(() => {
    fetchVanStocks();
  }, [page, limit, search, selectedSalesId]);

  useEffect(() => {
    fetchSalesAndProducts();
  }, []);

  const fetchVanStocks = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.VAN_STOCKS.LIST, {
        page,
        limit,
        search,
        sales_id: selectedSalesId || undefined,
      });
      setVanStocks(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Gagal memuat stok kendaraan');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesAndProducts = async () => {
    try {
      const [uRes, pRes] = await Promise.all([
        request.get(API_ENDPOINTS.USERS.LIST, { role: 'sales', limit: 50 }),
        request.get(API_ENDPOINTS.PRODUCTS.LIST, { limit: 100 }),
      ]);
      setSalesList(uRes.data || []);
      setProductList(pRes.data || []);
      if (uRes.data?.length > 0 && !form.sales_id) {
        setForm((prev) => ({
          ...prev,
          sales_id: uRes.data[0].id,
          product_id: pRes.data?.[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitAllocate = async (e) => {
    e.preventDefault();
    if (!form.sales_id || !form.product_id || form.qty <= 0) {
      toast.error('Pilih sales, produk, dan kuantitas valid');
      return;
    }

    setSubmitting(true);
    try {
      await request.post(API_ENDPOINTS.VAN_STOCKS.ALLOCATE, form);
      toast.success('Stok berhasil dialokasikan ke unit kendaraan sales!');
      setModalOpen(false);
      fetchVanStocks();
    } catch (err) {
      toast.error(err.message || 'Gagal mengalokasikan stok');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Manajemen Stok Kendaraan (Van Sales & Motoris)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pencatatan alokasi stok awal, barang terjual di toko, dan rekonsiliasi sisa stok fisik harian.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Alokasikan Stok ke Mobil</span>
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
            placeholder="Cari produk, sales..."
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto text-xs">
          <select
            value={selectedSalesId}
            onChange={(e) => {
              setSelectedSalesId(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 p-2 text-slate-800 bg-white"
          >
            <option value="">Semua Sales Kendaraan</option>
            {salesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.vehicle_type} - {s.vehicle_number || ''})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-5 py-3">Sales / Unit Kendaraan</th>
                <th className="px-5 py-3">Produk Alsyifa</th>
                <th className="px-5 py-3 text-center">Stok Awal</th>
                <th className="px-5 py-3 text-center">Terjual (Order)</th>
                <th className="px-5 py-3 text-center">Sisa Stok Fisik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Memuat stok kendaraan...
                  </td>
                </tr>
              ) : vanStocks.length > 0 ? (
                vanStocks.map((vs) => (
                  <tr key={vs.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{vs.stock_date}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800">{vs.sales_name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {vs.vehicle_type} • {vs.vehicle_number || '-'}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {vs.product_name}
                      <span className="text-[10px] text-slate-400 block font-mono">{vs.product_code}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-slate-700">
                      {vs.initial_stock} {vs.unit}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-blue-600">
                      {vs.sold_stock} {vs.unit}
                    </td>
                    <td className="px-5 py-3.5 text-center font-black">
                      <span className={`px-2.5 py-1 rounded-lg ${
                        vs.current_stock > 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {vs.current_stock} {vs.unit}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Belum ada data stok kendaraan.
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

      {/* Allocate Stock Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Alokasi Stok Gudang ke Kendaraan Sales">
        <form onSubmit={handleSubmitAllocate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pilih Petugas Sales & Kendaraan *
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
              Produk Herbal Alsyifa *
            </label>
            <select
              required
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 bg-white"
            >
              <option value="">Pilih Produk...</option>
              {productList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Tersedia Gudang: {p.warehouse_stock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jumlah Dialokasikan *
              </label>
              <input
                type="number"
                min={1}
                required
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Alokasi
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Catatan Tambahan:</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
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
              {submitting ? 'Memproses...' : 'Simpan Alokasi'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
