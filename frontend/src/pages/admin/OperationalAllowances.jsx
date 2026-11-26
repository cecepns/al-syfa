import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  Fuel,
  Bike,
  Filter,
  CreditCard,
  Search,
  Check,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SearchInput from '../../components/common/SearchInput';
import AppSelect from '../../components/common/AppSelect';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { formatDateID, formatMonthYearID, getCurrentMonthISO } from '../../utils/dateFormat';

export default function OperationalAllowances() {
  const currentMonthStr = getCurrentMonthISO();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [activeTab, setActiveTab] = useState('monthly'); // 'monthly' | 'daily'
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesList, setSalesList] = useState([]);
  const [salesFilter, setSalesFilter] = useState('');

  // Payment Confirmation State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedSalesPay, setSelectedSalesPay] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthly();
    } else {
      fetchDaily();
    }
  }, [selectedMonth, activeTab, salesFilter]);

  const fetchSales = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.USERS.LIST, { role: 'sales', limit: 50 });
      setSalesList(res.data || []);
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchMonthly = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ALLOWANCES.MONTHLY, {
        month: selectedMonth,
      });
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data?.sales_allowances || []);
      setMonthlyData(list);

      const rawSum = res.summary || res.data?.summary || null;
      const computed = list.reduce(
        (acc, it) => {
          const days = Number(it.active_days ?? it.total_days ?? 0);
          const bbm = Number(it.total_bbm || 0);
          const motor = Number(it.total_motor_rent ?? it.total_motor ?? 0);
          const tot = Number(it.total_allowance ?? it.total_amount ?? 0);
          const paid = Number(it.paid_amount || 0);
          const pend = Number(it.pending_amount || 0);
          return {
            total_days: acc.total_days + days,
            total_bbm: acc.total_bbm + bbm,
            total_motor_rent: acc.total_motor_rent + motor,
            total_allowance: acc.total_allowance + tot,
            total_paid: acc.total_paid + paid,
            total_pending: acc.total_pending + pend,
          };
        },
        { total_days: 0, total_bbm: 0, total_motor_rent: 0, total_allowance: 0, total_paid: 0, total_pending: 0 }
      );

      setSummary({
        total_days: Number(rawSum?.total_days ?? computed.total_days),
        total_bbm: Number(rawSum?.total_bbm ?? computed.total_bbm),
        total_motor_rent: Number(rawSum?.total_motor_rent ?? rawSum?.total_motor ?? computed.total_motor_rent),
        total_allowance: Number(rawSum?.total_allowance ?? rawSum?.grand_total ?? computed.total_allowance),
        total_paid: Number(rawSum?.total_paid ?? computed.total_paid),
        total_pending: Number(rawSum?.total_pending ?? rawSum?.total_unpaid ?? computed.total_pending),
      });
    } catch (err) {
      toast.error('Gagal memuat rekapitulasi tunjangan bulanan');
    } finally {
      setLoading(false);
    }
  };

  const fetchDaily = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ALLOWANCES.DAILY, {
        month: selectedMonth,
        sales_id: salesFilter || undefined,
        limit: 100,
      });
      const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      setDailyData(list);

      const rawSum = res.summary || res.data?.summary || null;
      const computed = list.reduce(
        (acc, it) => {
          const bbm = Number(it.bbm_amount || 0);
          const motor = Number(it.motor_rent_amount || 0);
          const tot = Number(it.total_amount || 0);
          acc.total_days += 1;
          acc.total_bbm += bbm;
          acc.total_motor_rent += motor;
          acc.total_allowance += tot;
          if (it.status === 'paid') acc.total_paid += tot;
          else acc.total_pending += tot;
          return acc;
        },
        { total_days: 0, total_bbm: 0, total_motor_rent: 0, total_allowance: 0, total_paid: 0, total_pending: 0 }
      );

      setSummary({
        total_days: Number(rawSum?.total_days ?? computed.total_days),
        total_bbm: Number(rawSum?.total_bbm ?? computed.total_bbm),
        total_motor_rent: Number(rawSum?.total_motor_rent ?? rawSum?.total_motor ?? computed.total_motor_rent),
        total_allowance: Number(rawSum?.total_allowance ?? rawSum?.grand_total ?? computed.total_allowance),
        total_paid: Number(rawSum?.total_paid ?? computed.total_paid),
        total_pending: Number(rawSum?.total_pending ?? rawSum?.total_unpaid ?? computed.total_pending),
      });
    } catch (err) {
      toast.error('Gagal memuat catatan harian tunjangan');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPay = (item) => {
    setSelectedSalesPay(item);
    setPayModalOpen(true);
  };

  const handleConfirmDisbursement = async () => {
    if (!selectedSalesPay) return;
    setPaying(true);
    try {
      await request.put(API_ENDPOINTS.ALLOWANCES.BATCH_PAY, {
        sales_id: selectedSalesPay.sales_id,
        month: selectedMonth,
        notes: `Pencairan tunjangan operasional periode ${selectedMonth}`,
      });
      toast.success(`Tunjangan operasional untuk ${selectedSalesPay.sales_name} berhasil dicairkan!`);
      setPayModalOpen(false);
      fetchMonthly();
    } catch (err) {
      toast.error(err.message || 'Gagal mencairkan tunjangan');
    } finally {
      setPaying(false);
    }
  };

  const handleUpdateStatusSingle = async (id, status) => {
    try {
      await request.put(API_ENDPOINTS.ALLOWANCES.UPDATE_STATUS(id), { status });
      toast.success('Status tunjangan harian diperbarui');
      fetchDaily();
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah status');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Kontrol Tunjangan Operasional Sales
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manajemen alokasi Rp 30.000 / hari kerja (BBM Rp 20.000 + Sewa Motor Rp 10.000) terakumulasi per bulan.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Periode Bulan:
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Akumulasi</p>
            <h4 className="text-lg font-black text-slate-900 mt-0.5">
              Rp {Number(summary?.total_allowance || 0).toLocaleString('id-ID')}
            </h4>
            <p className="text-[10px] text-slate-500">{summary?.total_days || 0} hari kehadiran sales</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Fuel className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Uang BBM</p>
            <h4 className="text-lg font-black text-slate-900 mt-0.5">
              Rp {Number(summary?.total_bbm || 0).toLocaleString('id-ID')}
            </h4>
            <p className="text-[10px] text-slate-500">Rp 20.000 / hari per sales</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Bike className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Sewa Motor</p>
            <h4 className="text-lg font-black text-slate-900 mt-0.5">
              Rp {Number(summary?.total_motor_rent || 0).toLocaleString('id-ID')}
            </h4>
            <p className="text-[10px] text-slate-500">Rp 10.000 / hari per sales</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status Pencairan</p>
            <h4 className="text-sm font-bold text-emerald-700 mt-0.5">
              Cair: Rp {Number(summary?.total_paid || 0).toLocaleString('id-ID')}
            </h4>
            <p className="text-[11px] font-semibold text-amber-600">
              Pending: Rp {Number(summary?.total_pending || 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Akumulasi Per Sales vs Rincian Harian */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'monthly'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Akumulasi Bulanan Per Sales
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'daily'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Log Harian Detail
          </button>
        </div>

        {activeTab === 'daily' && (
          <div className="w-56">
            <AppSelect
              value={salesFilter}
              onChange={(val) => setSalesFilter(val)}
              options={[
                { value: '', label: 'Semua Sales Lapangan' },
                ...salesList.map((s) => ({ value: String(s.id), label: s.name })),
              ]}
            />
          </div>
        )}
      </div>

      {/* Tab 1: Akumulasi Bulanan */}
      {activeTab === 'monthly' ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Nama Sales</th>
                  <th className="px-5 py-3">Kendaraan</th>
                  <th className="px-5 py-3 text-center">Hari Kerja Aktif</th>
                  <th className="px-5 py-3 text-right">Uang BBM</th>
                  <th className="px-5 py-3 text-right">Sewa Motor</th>
                  <th className="px-5 py-3 text-right">Total Akumulasi</th>
                  <th className="px-5 py-3 text-center">Status Pencairan</th>
                  <th className="px-5 py-3 text-right">Aksi Kontrol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                      Memuat akumulasi tunjangan...
                    </td>
                  </tr>
                ) : monthlyData.length > 0 ? (
                  monthlyData.map((item) => (
                    <tr key={item.sales_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <strong className="text-slate-900 block font-bold text-xs">{item.sales_name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">ID: #{item.sales_id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {item.vehicle_type === 'motor' ? 'Motoris' : 'Mobil Van'}
                        </span>
                        {item.vehicle_number && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">{item.vehicle_number}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-900">
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg">
                          {item.active_days ?? item.total_days ?? 0} Hari
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium">
                        Rp {Number(item.total_bbm || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium">
                        Rp {Number(item.total_motor_rent ?? item.total_motor ?? 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-slate-900 text-sm">
                        Rp {Number(item.total_allowance ?? item.total_amount ?? 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {Number(item.pending_count || 0) === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> {Number(item.active_days ?? item.total_days ?? 0) > 0 ? 'Lunas Dicairkan' : 'Belum Ada Klaim'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            <Clock className="h-3 w-3" /> {item.pending_count} Hari Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {Number(item.pending_count || 0) > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPay(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-200"
                          >
                            <CreditCard className="h-3.5 w-3.5" /> Cairkan Tunjangan
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">
                            {Number(item.active_days ?? item.total_days ?? 0) > 0 ? 'Tercairkan Penuh' : '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                      Belum ada data akumulasi tunjangan sales pada periode {selectedMonth}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 2: Log Harian */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Petugas Sales</th>
                  <th className="px-5 py-3 text-right">Uang BBM</th>
                  <th className="px-5 py-3 text-right">Sewa Motor</th>
                  <th className="px-5 py-3 text-right">Total (Rp)</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      Memuat log harian...
                    </td>
                  </tr>
                ) : dailyData.length > 0 ? (
                  dailyData.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold font-mono text-slate-900">
                        {formatDateID(d.date)}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {d.sales_name}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        Rp {Number(d.bbm_amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        Rp {Number(d.motor_rent_amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-slate-900">
                        Rp {Number(d.total_amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            d.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        {d.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatusSingle(d.id, 'paid')}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]"
                          >
                            Set Lunas
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      Tidak ada data log tunjangan harian pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disburse Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Konfirmasi Pencairan Tunjangan Operasional"
      >
        {selectedSalesPay && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-slate-500">Sales Penerima:</p>
              <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedSalesPay.sales_name}</h4>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Periode:</span>
                  <p className="font-bold text-slate-800">{formatMonthYearID(selectedMonth)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Hari Belum Cair:</span>
                  <p className="font-bold text-amber-600">{selectedSalesPay.pending_count} Hari</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <span className="font-bold text-emerald-900">Total Nominal yang Dicairkan:</span>
              <span className="text-base font-black text-emerald-800">
                Rp {Number(selectedSalesPay.pending_amount ?? (selectedSalesPay.pending_count * 30000)).toLocaleString('id-ID')}
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Setelah dikonfirmasi, seluruh catatan tunjangan harian periode {formatMonthYearID(selectedMonth)} untuk sales ini akan ditandai sebagai <strong>Dicairkan (Paid)</strong>.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDisbursement}
                disabled={paying}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-200 transition-all disabled:opacity-50"
              >
                {paying ? 'Memproses...' : 'Cairkan Sekarang'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
