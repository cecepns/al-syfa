import React, { useState, useEffect } from 'react';
import {
  BookOpenCheck,
  Plus,
  DollarSign,
  CreditCard,
  Banknote,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Store
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import AppSelect from '../../components/common/AppSelect';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function AccountingFinance() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [ordersWithBalance, setOrdersWithBalance] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // New Payment Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    order_id: '',
    amount: '',
    payment_method: 'tunai',
    notes: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchSummary();
  }, [page, limit, search]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.PAYMENTS.LIST, {
        page,
        limit,
        search,
      });
      setPayments(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Gagal memuat pembukuan kas');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.PAYMENTS.ACCOUNTING_SUMMARY);
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPaymentModal = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.ORDERS.LIST, {
        status: 'approved',
        limit: 100,
      });
      // Filter orders with remaining balance
      const unpaid = (res.data || []).filter(
        (o) => Number(o.paid_amount) < Number(o.grand_total)
      );
      setOrdersWithBalance(unpaid);
      setForm({
        order_id: unpaid[0]?.id || '',
        amount: unpaid[0] ? Number(unpaid[0].grand_total) - Number(unpaid[0].paid_amount) : '',
        payment_method: 'tunai',
        notes: '',
      });
      setModalOpen(true);
    } catch (err) {
      toast.error('Gagal memuat daftar tagihan');
    }
  };

  const handleOrderSelect = (orderId) => {
    const selected = ordersWithBalance.find((o) => String(o.id) === String(orderId));
    setForm({
      ...form,
      order_id: orderId,
      amount: selected ? Number(selected.grand_total) - Number(selected.paid_amount) : '',
    });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!form.order_id || !form.amount || Number(form.amount) <= 0) {
      toast.error('Pilih tagihan order dan masukkan nominal pembayaran valid');
      return;
    }

    setSubmitting(true);
    try {
      await request.post(API_ENDPOINTS.PAYMENTS.CREATE, form);
      toast.success('Setoran pembayaran kas berhasil dicatat!');
      setModalOpen(false);
      fetchPayments();
      fetchSummary();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan pembayaran');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Sistem Akuntansi & Pembukuan Kas Penjualan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pencatatan uang tunai, transfer setoran sales lapangan, dan rekonsiliasi piutang toko pelanggan.
          </p>
        </div>

        <button
          onClick={handleOpenPaymentModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Input Setoran / Pelunasan</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Setoran Tunai Hari Ini</span>
            <Banknote className="h-4 w-4 text-emerald-600" />
          </div>
          <h3 className="text-xl font-black text-emerald-700">
            Rp {Number(summary?.cash_today || 0).toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Uang fisik dari sales</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Transfer Bank Hari Ini</span>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </div>
          <h3 className="text-xl font-black text-blue-700">
            Rp {Number(summary?.transfer_today || 0).toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Rekening penampung pusat</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Kas Masuk Hari Ini</span>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="text-xl font-black text-purple-700">
            Rp {Number(summary?.total_collected_today || 0).toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Kas riil diterima</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Piutang Berjalan</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <h3 className="text-xl font-black text-amber-700">
            Rp {Number(summary?.total_piutang || 0).toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-amber-600 font-semibold mt-1">
            {summary?.overdue_orders_count || 0} Faktur Jatuh Tempo
          </p>
        </div>
      </div>

      {/* Payments History Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Buku Kas Masuk & Riwayat Setoran
          </h3>
          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Cari no bayar, faktur, toko..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">No Bukti Bayar</th>
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-5 py-3">No Faktur</th>
                <th className="px-5 py-3">Toko Pelanggan</th>
                <th className="px-5 py-3">Sales Penyetor</th>
                <th className="px-5 py-3 text-center">Metode</th>
                <th className="px-5 py-3 text-right">Nominal Masuk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Memuat buku kas...
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{p.payment_number}</td>
                    <td className="px-5 py-3.5 text-slate-500">{p.payment_date}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">{p.invoice_number}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{p.customer_name}</td>
                    <td className="px-5 py-3.5 text-slate-700">{p.sales_name}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.payment_method === 'tunai' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-emerald-700">
                      Rp {Number(p.amount).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Belum ada riwayat setoran pembayaran.
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

      {/* Input Setoran Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Input Setoran / Pelunasan Piutang"
      >
        <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pilih Tagihan Faktur *
            </label>
            <AppSelect
              value={form.order_id}
              onChange={(val) => handleOrderSelect(val)}
              placeholder="-- Pilih atau cari faktur tagihan --"
              options={ordersWithBalance.map((ord) => {
                const sisa = Number(ord.grand_total) - Number(ord.paid_amount);
                return {
                  value: ord.id,
                  label: `${ord.invoice_number} - ${ord.customer_name} (Sisa: Rp ${sisa.toLocaleString('id-ID')})`,
                };
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nominal Setoran (Rp) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Metode Pembayaran
              </label>
              <AppSelect
                value={form.payment_method}
                onChange={(val) => setForm({ ...form, payment_method: val })}
                options={[
                  { value: 'tunai', label: 'Tunai (Cash Sales)' },
                  { value: 'transfer', label: 'Transfer Bank' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Catatan Bukti / Keterangan:</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Nomor referensi bank / penerima..."
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
              {submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
