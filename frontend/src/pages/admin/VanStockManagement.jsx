import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Plus,
  Package,
  Calendar,
  Edit2,
  Trash2,
  Boxes
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import AppSelect from '../../components/common/AppSelect';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { formatDateID, getTodayISO } from '../../utils/dateFormat';

export default function VanStockManagement() {
  const [vanStockGroups, setVanStockGroups] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSalesId, setSelectedSalesId] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Multi-Item Allocate Stock Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    sales_id: '',
    date: getTodayISO(),
    notes: 'Alokasi pagi dari gudang utama',
    items: [{ product_id: '', qty: 20 }],
  });

  // Edit Single Van Stock Item Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    sales_id: '',
    product_id: '',
    initial_stock: 0,
    stock_date: getTodayISO(),
    notes: '',
  });

  // Delete Confirm State ('item' | 'group')
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState('item');
  const [deleteTarget, setDeleteTarget] = useState(null);

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
        grouped: 'true',
      });
      setVanStockGroups(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.message || 'Gagal memuat stok kendaraan');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesAndProducts = async () => {
    try {
      const [uRes, pRes] = await Promise.all([
        request.get(API_ENDPOINTS.USERS.LIST, { role: 'sales', limit: 100 }),
        request.get(API_ENDPOINTS.PRODUCTS.LIST, { limit: 100 }),
      ]);
      setSalesList(uRes.data || []);
      setProductList(pRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const salesOptions = useMemo(
    () =>
      salesList.map((s) => ({
        value: String(s.id),
        label: `${s.name} (${s.vehicle_type || 'motor'} - ${s.vehicle_number || '-'})`,
      })),
    [salesList]
  );

  const productOptions = useMemo(
    () =>
      productList.map((p) => ({
        value: String(p.id),
        label: `${p.name} (Gudang: ${p.warehouse_stock} ${p.unit})`,
      })),
    [productList]
  );

  const handleOpenAllocateModal = (prefillSalesId = '', prefillDate = '') => {
    const defaultSales = prefillSalesId
      ? String(prefillSalesId)
      : selectedSalesId
      ? String(selectedSalesId)
      : salesList[0]
      ? String(salesList[0].id)
      : '';
    const defaultProd = productList[0] ? String(productList[0].id) : '';

    setForm({
      sales_id: defaultSales,
      date: prefillDate || getTodayISO(),
      notes: 'Alokasi pagi dari gudang utama',
      items: [{ product_id: defaultProd, qty: 20 }],
    });
    setModalOpen(true);
  };

  const handleAddProductRow = () => {
    const usedIds = new Set(form.items.map((it) => String(it.product_id)));
    const nextProd = productList.find((p) => !usedIds.has(String(p.id)));
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: nextProd ? String(nextProd.id) : '',
          qty: 20,
        },
      ],
    }));
  };

  const handleRemoveProductRow = (index) => {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const totalAllocateQty = useMemo(
    () => form.items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0),
    [form.items]
  );

  const handleSubmitAllocate = async (e) => {
    e.preventDefault();
    if (!form.sales_id) {
      toast.error('Pilih petugas sales terlebih dahulu');
      return;
    }
    const validItems = form.items.filter((it) => it.product_id && Number(it.qty) > 0);
    if (validItems.length === 0 || validItems.length !== form.items.length) {
      toast.error('Setiap baris produk harus memilih produk dan jumlah (> 0)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await request.post(API_ENDPOINTS.VAN_STOCKS.ALLOCATE, {
        sales_id: Number(form.sales_id),
        date: form.date,
        notes: form.notes,
        items: validItems.map((it) => ({
          product_id: Number(it.product_id),
          qty: Number(it.qty),
        })),
      });
      toast.success(res.message || 'Stok berhasil dialokasikan ke unit kendaraan sales!');
      setModalOpen(false);
      fetchVanStocks();
      fetchSalesAndProducts();
    } catch (err) {
      toast.error(err.message || 'Gagal mengalokasikan stok');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setEditForm({
      sales_id: String(item.sales_id),
      product_id: String(item.product_id),
      initial_stock: Number(item.initial_stock || 0),
      stock_date: item.stock_date ? String(item.stock_date).substring(0, 10) : getTodayISO(),
      notes: '',
    });
    setEditModalOpen(true);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    if (Number(editForm.initial_stock) < Number(editingItem.sold_stock || 0)) {
      toast.error(`Stok awal tidak boleh kurang dari jumlah terjual (${editingItem.sold_stock})`);
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await request.put(API_ENDPOINTS.VAN_STOCKS.UPDATE(editingItem.id), {
        sales_id: Number(editForm.sales_id),
        product_id: Number(editForm.product_id),
        initial_stock: Number(editForm.initial_stock),
        stock_date: editForm.stock_date,
        notes: editForm.notes || undefined,
      });
      toast.success(res.message || 'Data stok berhasil diperbarui!');
      setEditModalOpen(false);
      setEditingItem(null);
      fetchVanStocks();
      fetchSalesAndProducts();
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui data stok');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleAskDeleteItem = (item, group) => {
    setDeleteMode('item');
    setDeleteTarget({ ...item, sales_name: group.sales_name });
    setDeleteOpen(true);
  };

  const handleAskDeleteGroup = (group) => {
    setDeleteMode('group');
    setDeleteTarget(group);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      let res;
      if (deleteMode === 'group') {
        res = await request.del(
          API_ENDPOINTS.VAN_STOCKS.DELETE_GROUP(deleteTarget.sales_id, deleteTarget.stock_date)
        );
      } else {
        res = await request.del(API_ENDPOINTS.VAN_STOCKS.DELETE(deleteTarget.id));
      }
      toast.success(res.message || 'Data stok berhasil dihapus & dikembalikan ke gudang');
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchVanStocks();
      fetchSalesAndProducts();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus data stok');
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
            Alokasi multi-item produk sekaligus per sales, koreksi kesalahan data stok (edit & hapus), serta rekonsiliasi sisa fisik harian.
          </p>
        </div>

        <button
          onClick={() => handleOpenAllocateModal()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Alokasikan Stok ke Sales</span>
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

        <div className="w-full sm:w-64 text-xs">
          <AppSelect
            value={selectedSalesId}
            onChange={(val) => {
              setSelectedSalesId(val || '');
              setPage(1);
            }}
            placeholder="Semua Sales Kendaraan"
            isClearable={true}
            options={salesOptions}
          />
        </div>
      </div>

      {/* Grouped Table: 1 Sales + 1 Tanggal = 1 Baris dengan multi-produk */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-5 py-3">Sales / Unit Kendaraan</th>
                <th className="px-5 py-3">Daftar Produk &amp; Rincian Stok</th>
                <th className="px-4 py-3 text-center">Total Awal</th>
                <th className="px-4 py-3 text-center">Terjual</th>
                <th className="px-4 py-3 text-center">Total Sisa</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Memuat stok kendaraan...
                  </td>
                </tr>
              ) : vanStockGroups.length > 0 ? (
                vanStockGroups.map((group) => (
                  <tr key={group.group_key} className="hover:bg-slate-50/60 transition-colors align-top">
                    <td className="px-5 py-4 text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{formatDateID(group.stock_date)}</span>
                      </div>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {group.total_items} Item Produk
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-extrabold text-slate-900">{group.sales_name}</p>
                      <p className="text-[10px] text-slate-400 capitalize mt-0.5 flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {group.vehicle_type} • {group.vehicle_number || '-'}
                      </p>
                    </td>

                    <td className="px-5 py-3.5 min-w-[300px]">
                      <div className="space-y-1.5">
                        {(group.items || []).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70"
                          >
                            <div>
                              <p className="font-bold text-slate-900 text-xs">
                                {item.product_name}
                                <span className="ml-1.5 text-[10px] font-mono font-normal text-slate-400">
                                  ({item.product_code})
                                </span>
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] mt-0.5">
                                <span className="text-slate-600">
                                  Awal: <strong>{item.initial_stock}</strong> {item.unit}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-blue-600 font-semibold">
                                  Terjual: {item.sold_stock}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span
                                  className={`font-extrabold ${
                                    item.current_stock > 5 ? 'text-emerald-700' : 'text-amber-700'
                                  }`}
                                >
                                  Sisa: {item.current_stock} {item.unit}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditItem(item)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-emerald-600 hover:border-emerald-300 transition-colors"
                                title={`Edit stok ${item.product_name}`}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAskDeleteItem(item, group)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-300 transition-colors"
                                title={`Hapus stok ${item.product_name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center font-bold text-slate-800 whitespace-nowrap">
                      {group.total_initial_stock} Pack
                    </td>

                    <td className="px-4 py-4 text-center font-bold text-blue-600 whitespace-nowrap">
                      {group.total_sold_stock} Pack
                    </td>

                    <td className="px-4 py-4 text-center font-black whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-lg ${
                          group.total_current_stock > 5
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {group.total_current_stock} Pack
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenAllocateModal(group.sales_id, group.stock_date)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold transition-colors"
                          title="Tambah item produk untuk sales & tanggal ini"
                        >
                          <Plus className="h-3.5 w-3.5" /> Item
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAskDeleteGroup(group)}
                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                          title="Hapus semua item stok pada tanggal ini"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Belum ada data stok kendaraan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
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

      {/* Multi-Item Allocate Stock Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Alokasi Stok Gudang ke Kendaraan Sales"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitAllocate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pilih Petugas Sales &amp; Kendaraan *
              </label>
              <AppSelect
                value={form.sales_id}
                onChange={(val) => setForm({ ...form, sales_id: val || '' })}
                placeholder="Pilih atau cari sales..."
                options={salesOptions}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Alokasi *
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-bold"
              />
            </div>
          </div>

          {/* Multi-Product Rows */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                <Boxes className="h-4 w-4 text-emerald-600" />
                <span>Daftar Produk ALSYFA &amp; Jumlah Masing-Masing *</span>
              </div>
              <button
                type="button"
                onClick={handleAddProductRow}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Item Produk
              </button>
            </div>

            <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
              {form.items.map((itemRow, idx) => {
                const selectedProd = productList.find(
                  (p) => String(p.id) === String(itemRow.product_id)
                );
                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-sm"
                  >
                    <div className="flex-1">
                      <AppSelect
                        value={itemRow.product_id}
                        onChange={(val) => handleItemChange(idx, 'product_id', val || '')}
                        placeholder="Pilih atau cari produk gudang..."
                        options={productOptions}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative w-28">
                        <input
                          type="number"
                          min={1}
                          required
                          value={itemRow.qty}
                          onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 font-extrabold text-center"
                          placeholder="Qty"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 w-10">
                        {selectedProd?.unit || 'Pack'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveProductRow(idx)}
                        disabled={form.items.length <= 1}
                        className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-colors"
                        title="Hapus baris produk"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-slate-600">
              <span>
                Total Item Produk: <strong className="text-slate-900">{form.items.length} Produk</strong>
              </span>
              <span>
                Total Jumlah Dibawa: <strong className="text-emerald-700 font-black">{totalAllocateQty} Pack</strong>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Catatan Tambahan:</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
              {submitting ? 'Memproses...' : `Simpan Alokasi (${form.items.length} Produk)`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Single Item Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingItem(null);
        }}
        title="Edit / Koreksi Data Stok Kendaraan"
      >
        {editingItem && (
          <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900">
              Perubahan jumlah stok awal otomatis menyinkronkan kembali stok gudang utama secara real-time.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sales / Kendaraan *
                </label>
                <AppSelect
                  value={editForm.sales_id}
                  onChange={(val) => setEditForm({ ...editForm, sales_id: val || '' })}
                  options={salesOptions}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tanggal Alokasi *
                </label>
                <input
                  type="date"
                  required
                  value={editForm.stock_date}
                  onChange={(e) => setEditForm({ ...editForm, stock_date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Produk ALSYFA *
              </label>
              <AppSelect
                value={editForm.product_id}
                onChange={(val) => setEditForm({ ...editForm, product_id: val || '' })}
                options={productOptions}
                isDisabled={Number(editingItem.sold_stock || 0) > 0}
              />
              {Number(editingItem.sold_stock || 0) > 0 && (
                <p className="text-[10px] text-amber-600 mt-1">
                  Produk tidak dapat diubah karena sudah ada {editingItem.sold_stock} unit terjual.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Jumlah Stok Awal *
                </label>
                <input
                  type="number"
                  min={Number(editingItem.sold_stock || 0)}
                  required
                  value={editForm.initial_stock}
                  onChange={(e) =>
                    setEditForm({ ...editForm, initial_stock: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 font-extrabold"
                />
              </div>

              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex flex-col justify-center">
                <span className="text-[10px] text-slate-500">
                  Terjual: <strong>{editingItem.sold_stock || 0} {editingItem.unit}</strong>
                </span>
                <span className="text-xs font-black text-emerald-700 mt-0.5">
                  Sisa Baru: {Math.max(0, Number(editForm.initial_stock || 0) - Number(editingItem.sold_stock || 0))} {editingItem.unit}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Catatan Koreksi:</label>
              <input
                type="text"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Contoh: Salah input jumlah awal atau salah pilih produk"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingItem(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={editSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow disabled:opacity-50"
              >
                {editSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title={deleteMode === 'group' ? 'Hapus Seluruh Alokasi Sales' : 'Hapus Data Stok Produk'}
        message={
          deleteMode === 'group'
            ? `Hapus semua item stok milik "${deleteTarget?.sales_name || ''}" tanggal ${formatDateID(deleteTarget?.stock_date)}? Sisa stok akan otomatis dikembalikan ke gudang utama.`
            : `Hapus data stok "${deleteTarget?.product_name || ''}" milik "${deleteTarget?.sales_name || ''}" (${deleteTarget?.current_stock || 0} ${deleteTarget?.unit || 'Pack'})? Stok akan dikembalikan ke gudang utama.`
        }
      />
    </AdminLayout>
  );
}
