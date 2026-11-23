import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Check,
  X,
  Eye,
  Printer,
  Calendar,
  Store,
  FileText,
  Filter,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import ReceiptModal from '../../components/common/ReceiptModal';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function OrdersApproval() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Detail Modal & Receipt
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [page, limit, search, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ORDERS.LIST, {
        page,
        limit,
        search,
        status: statusFilter || undefined,
      });
      setOrders(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Gagal memuat daftar pesanan');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (orderId) => {
    try {
      const res = await request.get(API_ENDPOINTS.ORDERS.DETAIL(orderId));
      setSelectedOrder(res.data);
      setDetailModalOpen(true);
    } catch (err) {
      toast.error('Gagal memuat detail pesanan');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      await request.put(API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), {
        status: newStatus,
        approval_notes: `Status diubah menjadi ${newStatus} oleh supervisor`,
      });
      toast.success(`Pesanan berhasil diubah menjadi ${newStatus}`);
      setDetailModalOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah status pesanan');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Validasi & Persetujuan Pesanan (Order Approval)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pusat validasi nota faktur yang diinput sales lapangan sebelum diteruskan ke bagian gudang / pengiriman.
          </p>
        </div>
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
            placeholder="Cari no invoice, nama toko, sales..."
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
          {[
            { key: '', label: 'Semua Status' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Disetujui' },
            { key: 'delivered', label: 'Terkirim' },
            { key: 'rejected', label: 'Ditolak' },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => {
                setStatusFilter(st.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                statusFilter === st.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">No Invoice</th>
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-5 py-3">Toko Pelanggan</th>
                <th className="px-5 py-3">Sales Pembuat</th>
                <th className="px-5 py-3 text-right">Grand Total</th>
                <th className="px-5 py-3 text-center">Metode / Status Bayar</th>
                <th className="px-5 py-3 text-center">Status Pesanan</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    Memuat data pesanan...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">
                      {ord.invoice_number}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {ord.order_date}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      {ord.customer_name}
                      <p className="text-[10px] text-slate-400 font-normal truncate max-w-xs">{ord.customer_address}</p>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      {ord.sales_name}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-slate-900">
                      Rp {Number(ord.grand_total).toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold uppercase text-[10px] text-slate-600">
                          {ord.payment_method}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          ord.payment_status === 'lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ord.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'delivered'
                          ? 'bg-blue-100 text-blue-800'
                          : ord.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(ord.id)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Lihat Detail & Validasi"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    Tidak ada pesanan yang sesuai filter.
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

      {/* Order Detail & Approval Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Rincian Faktur ${selectedOrder?.invoice_number || ''}`}
        maxWidth="max-w-xl"
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Pelanggan (Outlet)</p>
                <p className="font-bold text-slate-800 text-sm">{selectedOrder.customer_name}</p>
                <p className="text-slate-500">{selectedOrder.customer_address}</p>
                <p className="text-slate-500">Telp: {selectedOrder.customer_phone}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-[10px] uppercase font-bold">Informasi Faktur</p>
                <p className="font-bold text-slate-800">{selectedOrder.invoice_number}</p>
                <p className="text-slate-500">Tanggal: {selectedOrder.order_date}</p>
                <p className="text-slate-500">Sales: {selectedOrder.sales_name}</p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">Item Produk</h4>
              <table className="w-full text-left text-xs border border-slate-100 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-2.5">Produk</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Harga Satuan</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedOrder.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium text-slate-800">{it.product_name}</td>
                      <td className="p-2.5 text-center font-bold">{it.qty} {it.unit}</td>
                      <td className="p-2.5 text-right">Rp {Number(it.price).toLocaleString('id-ID')}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        Rp {Number(it.total_price).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">
                  Rp {Number(selectedOrder.subtotal).toLocaleString('id-ID')}
                </span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Diskon Promo:</span>
                  <span>-Rp {Number(selectedOrder.discount_amount).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-emerald-700">Rp {Number(selectedOrder.grand_total).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Actions: Approve / Reject / Print Receipt */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReceiptOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" /> Cetak Struk
              </button>

              <div className="flex-1 flex gap-2 justify-end">
                {selectedOrder.status !== 'approved' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'approved')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-200"
                  >
                    <Check className="h-4 w-4" /> Setujui Pesanan
                  </button>
                )}

                {selectedOrder.status !== 'delivered' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-200"
                  >
                    Tandai Terkirim
                  </button>
                )}

                {selectedOrder.status !== 'rejected' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'rejected')}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold"
                  >
                    <X className="h-4 w-4" /> Tolak
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt Modal for Direct Print */}
      <ReceiptModal
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        order={selectedOrder}
      />
    </AdminLayout>
  );
}
