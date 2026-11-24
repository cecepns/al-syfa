import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Wallet,
  TrendingDown,
  CheckCircle2,
  Clock,
  Calendar,
  Search,
  Plus,
  Trash2,
  ArrowRight,
  CreditCard,
  Building2,
  Check,
  XCircle,
  FileText,
  User,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import AppSelect from '../../components/common/AppSelect';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function DailyDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedSales, setSelectedSales] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Sales List for Select Dropdown
  const [salesList, setSalesList] = useState([]);

  // Modal Input Setoran State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    sales_id: '',
    deposit_date: new Date().toISOString().substring(0, 10),
    total_sales_amount: 0,
    operational_allowance_deduction: 30000,
    net_deposit_amount: 0,
    deposit_method: 'tunai',
    bank_name: 'BCA',
    notes: '',
  });

  const [calcLoading, setCalcLoading] = useState(false);
  const [salesOrderInfo, setSalesOrderInfo] = useState(null);

  useEffect(() => {
    fetchSalesList();
  }, []);

  useEffect(() => {
    fetchDeposits();
  }, [page, limit, search, selectedMonth, selectedSales, selectedMethod]);

  const fetchSalesList = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.USERS.LIST, { role: 'sales', limit: 100 });
      setSalesList(res.data || []);
    } catch (e) {
      console.warn('Gagal memuat list sales:', e);
    }
  };

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.DEPOSITS.LIST, {
        page,
        limit,
        search,
        month: selectedMonth || undefined,
        sales_id: selectedSales || undefined,
        method: selectedMethod || undefined,
      });
      setDeposits(res.data?.items || []);
      setSummary(res.data?.summary || null);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.message || 'Gagal memuat daftar setoran harian');
    } finally {
      setLoading(false);
    }
  };

  // When sales or date is selected in the modal, auto calculate sales & recommended deposit
  const handleSalesOrDateChange = async (salesId, depositDate) => {
    if (!salesId || !depositDate) return;
    setCalcLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.DEPOSITS.SALES_SUMMARY, {
        sales_id: salesId,
        date: depositDate,
      });
      const data = res.data;
      setSalesOrderInfo(data);

      const totalSales = Number(data.total_sales || 0);
      const allowance = Number(data.allowance_deduction || 30000);
      const net = Math.max(0, totalSales - allowance);

      setForm((prev) => ({
        ...prev,
        sales_id: salesId,
        deposit_date: depositDate,
        total_sales_amount: totalSales,
        operational_allowance_deduction: allowance,
        net_deposit_amount: net,
        notes: `Setoran harian sales (${data.total_pack} pack / ${data.total_dus} dus) - Penjualan Rp ${totalSales.toLocaleString('id-ID')} dikurangi Tunjangan Ops Rp ${allowance.toLocaleString('id-ID')}`
      }));
    } catch (err) {
      console.warn('Gagal kalkulasi sales:', err);
    } finally {
      setCalcLoading(false);
    }
  };

  // Re-calculate net when total_sales or deduction changes manually
  const updateAmounts = (totalSales, deduction) => {
    const s = parseFloat(totalSales) || 0;
    const d = parseFloat(deduction) || 0;
    const net = Math.max(0, s - d);
    setForm((prev) => ({
      ...prev,
      total_sales_amount: s,
      operational_allowance_deduction: d,
      net_deposit_amount: net,
    }));
  };

  const handleOpenCreateModal = () => {
    const today = new Date().toISOString().substring(0, 10);
    const firstSales = salesList.length > 0 ? String(salesList[0].id) : '';
    setForm({
      sales_id: firstSales,
      deposit_date: today,
      total_sales_amount: 0,
      operational_allowance_deduction: 30000,
      net_deposit_amount: 0,
      deposit_method: 'tunai',
      bank_name: 'BCA',
      notes: '',
    });
    setSalesOrderInfo(null);
    setModalOpen(true);
    if (firstSales) {
      handleSalesOrDateChange(firstSales, today);
    }
  };

  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    if (!form.sales_id || !form.deposit_date) {
      toast.error('Pilih Sales dan Tanggal Setoran');
      return;
    }

    setSubmitting(true);
    try {
      await request.post(API_ENDPOINTS.DEPOSITS.CREATE, form);
      toast.success('Setoran harian sales berhasil dicatat!');
      setModalOpen(false);
      fetchDeposits();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan setoran');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await request.put(API_ENDPOINTS.DEPOSITS.UPDATE_STATUS(id), { status });
      toast.success(`Setoran berhasil di-${status === 'verified' ? 'verifikasi' : 'tolak'}`);
      fetchDeposits();
    } catch (err) {
      toast.error(err.message || 'Gagal verifikasi setoran');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus catatan setoran ini?')) return;
    try {
      await request.delete(API_ENDPOINTS.DEPOSITS.DELETE(id));
      toast.success('Catatan setoran berhasil dihapus');
      fetchDeposits();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus setoran');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header & Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-emerald-600" />
              Setoran Harian Sales & Potongan Tunjangan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Input setoran harian sales (Tunai / Transfer TF) dikurangi tunjangan operasional harian (BBM 20rb + Sewa Motor 10rb = 30rb).
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Input Setoran Baru</span>
          </button>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Penjualan Kotor</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-black text-slate-800">
              Rp {Number(summary?.grand_total_sales || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Akumulasi penjualan kotor sales</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Potongan Tunjangan Ops</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-black text-amber-600">
              - Rp {Number(summary?.grand_total_deduction || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">BBM & Sewa Motor dipotong langsung</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Setoran Bersih (Net)</span>
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-black text-emerald-700">
              Rp {Number(summary?.grand_total_net || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Total uang kas/bank diterima</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Jumlah Setoran</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-black text-blue-600">
              {summary?.total_deposits || 0} <span className="text-xs font-normal text-slate-400">faktur</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Periode {selectedMonth}</p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Cari no. setoran DEP-..., nama sales, atau catatan..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPage(1);
              }}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
            />

            <select
              value={selectedSales}
              onChange={(e) => {
                setSelectedSales(e.target.value);
                setPage(1);
              }}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Semua Sales</option>
              {salesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={selectedMethod}
              onChange={(e) => {
                setSelectedMethod(e.target.value);
                setPage(1);
              }}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Semua Metode</option>
              <option value="tunai">Tunai (Cash)</option>
              <option value="transfer">Transfer (TF)</option>
            </select>
          </div>
        </div>

        {/* Deposits Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3.5">No. Setoran & Tanggal</th>
                  <th className="px-4 py-3.5">Nama Sales</th>
                  <th className="px-4 py-3.5 text-right">Penjualan Kotor</th>
                  <th className="px-4 py-3.5 text-right">Potongan Ops (30rb)</th>
                  <th className="px-4 py-3.5 text-right">Setoran Bersih (Net)</th>
                  <th className="px-4 py-3.5 text-center">Metode</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      Memuat data setoran...
                    </td>
                  </tr>
                ) : deposits.length > 0 ? (
                  deposits.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-extrabold text-slate-900 font-mono">
                          {item.deposit_number}
                        </span>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" /> {item.deposit_date?.substring(0, 10)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{item.sales_name}</div>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {item.sales_role} • {item.vehicle_type || 'Motor'} ({item.vehicle_number || '-'})
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-700">
                        Rp {Number(item.total_sales_amount).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-amber-600">
                        - Rp {Number(item.operational_allowance_deduction).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-700">
                        Rp {Number(item.net_deposit_amount).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.deposit_method === 'transfer'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.deposit_method === 'transfer' ? (
                            <>
                              <CreditCard className="h-3 w-3" /> TF {item.bank_name || ''}
                            </>
                          ) : (
                            <>
                              <Wallet className="h-3 w-3" /> Tunai
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {item.status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Terverifikasi
                          </span>
                        ) : item.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600">
                            <XCircle className="h-3.5 w-3.5" /> Ditolak
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                            <Clock className="h-3.5 w-3.5" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {item.status !== 'verified' && (
                          <button
                            onClick={() => handleVerify(item.id, 'verified')}
                            className="p-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            title="Verifikasi Setoran"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      Tidak ada catatan setoran harian untuk filter yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Menampilkan {deposits.length} dari {pagination.total} setoran
              </span>
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal Input Setoran Harian */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Input Setoran Harian Sales"
      >
        <form onSubmit={handleSubmitDeposit} className="space-y-4 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 leading-relaxed">
            <p className="font-bold">Formulir Setoran Sore Sales</p>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Contoh perhitungan: Total Penjualan <strong>Rp 400.000</strong> - Tunjangan Ops <strong>Rp 30.000</strong> = Setoran Bersih <strong>Rp 360.000</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pilih Sales *
              </label>
              <select
                required
                value={form.sales_id}
                onChange={(e) => {
                  const sId = e.target.value;
                  setForm({ ...form, sales_id: sId });
                  handleSalesOrDateChange(sId, form.deposit_date);
                }}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-bold focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Pilih Sales --</option>
                {salesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.vehicle_type || 'Sales'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Setoran *
              </label>
              <input
                type="date"
                required
                value={form.deposit_date}
                onChange={(e) => {
                  const dDate = e.target.value;
                  setForm({ ...form, deposit_date: dDate });
                  handleSalesOrDateChange(form.sales_id, dDate);
                }}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick info if fetched */}
          {calcLoading ? (
            <div className="p-3 bg-slate-50 rounded-xl text-center text-slate-400 animate-pulse">
              Mengambil ringkasan penjualan sales...
            </div>
          ) : salesOrderInfo && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Hari Ini:</span>
                <span className="font-bold text-slate-800">{salesOrderInfo.total_orders} faktur ({salesOrderInfo.total_pack} pack / {salesOrderInfo.total_dus} dus)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Omzet Penjualan:</span>
                <span className="font-bold text-slate-800 font-mono">Rp {salesOrderInfo.total_sales.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tunjangan Harian:</span>
                <span className="font-bold text-amber-600 font-mono">Rp {salesOrderInfo.allowance_deduction.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          {/* Amount Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Total Penjualan Sales (Rp) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={form.total_sales_amount}
                onChange={(e) => updateAmounts(e.target.value, form.operational_allowance_deduction)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-mono font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Potongan Tunjangan (Rp) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={form.operational_allowance_deduction}
                onChange={(e) => updateAmounts(form.total_sales_amount, e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-amber-700 font-mono font-bold focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">BBM 20.000 + Motor 10.000 = 30.000</span>
            </div>
          </div>

          {/* Net Amount Display */}
          <div className="bg-emerald-900 text-white rounded-2xl p-4 shadow-sm border border-emerald-700">
            <span className="text-[11px] text-emerald-200 font-bold uppercase tracking-wider">
              Setoran Bersih Diterima Kasir / Admin
            </span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              Rp {Number(form.net_deposit_amount).toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] text-emerald-200 mt-1">
              (Penjualan Rp {Number(form.total_sales_amount).toLocaleString('id-ID')} - Tunjangan Rp {Number(form.operational_allowance_deduction).toLocaleString('id-ID')})
            </p>
          </div>

          {/* Deposit Method: Tunai vs Transfer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Metode Pembayaran *
              </label>
              <select
                value={form.deposit_method}
                onChange={(e) => setForm({ ...form, deposit_method: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-bold focus:border-emerald-500 focus:outline-none"
              >
                <option value="tunai">Tunai (Cash)</option>
                <option value="transfer">Transfer Bank (TF)</option>
              </select>
            </div>

            {form.deposit_method === 'transfer' ? (
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bank Tujuan *
                </label>
                <select
                  value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-bold focus:border-emerald-500 focus:outline-none"
                >
                  <option value="BCA">BCA (Rekening Utama)</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BRI">Bank BRI</option>
                  <option value="BNI">Bank BNI</option>
                  <option value="BSI">BSI (Syariah)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Penerima Kas Fisik
                </label>
                <input
                  type="text"
                  disabled
                  value="Admin / Kasir Kantor"
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-100 text-slate-500 font-bold"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan Setoran
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Catatan tambahan setoran..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:border-emerald-500 focus:outline-none"
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
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-200 disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Setoran'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
