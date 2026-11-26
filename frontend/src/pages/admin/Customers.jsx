import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  PhoneCall,
  Tag,
  Calendar,
  CheckCircle2,
  RefreshCw
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
import { EAST_JAVA_CITIES } from '../../utils/eastJavaCities';
import { formatDateID, formatMonthYearID, getTodayISO, getCurrentMonthISO } from '../../utils/dateFormat';

const STORE_LABEL_PRESETS = ['Toko Baru', 'Outlet Baru', 'Potensial', 'Langganan', 'Prioritas'];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [shopType, setShopType] = useState('');
  const [salesFilter, setSalesFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    sales_id: '',
    owner_name: '',
    shop_type: 'ritel',
    store_label: '',
    is_active: 1,
    phone: '',
    address: '',
    province_code: '35',
    province_name: 'Jawa Timur',
    regency_code: '35.78',
    regency_name: 'Kota Surabaya',
    district_code: '',
    district_name: '',
    village_code: '',
    village_name: '',
    latitude: '',
    longitude: '',
    credit_limit: 5000000,
    notes: ''
  });

  // Wilayah.id & Branch Cities Integration
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [branches, setBranches] = useState([]);

  // Delete Confirm State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Settle Piutang State
  const [settleTarget, setSettleTarget] = useState(null);
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleMethod, setSettleMethod] = useState('tunai');
  const [settling, setSettling] = useState(false);

  // Synced Transacted Stores View (Tanggal / Bulan / Tahun)
  const [viewTab, setViewTab] = useState('all'); // 'all' | 'transacted'
  const [transFilterMode, setTransFilterMode] = useState('followup'); // 'followup' | 'day' | 'month' | 'year'
  const [transDate, setTransDate] = useState(getTodayISO());
  const [transMonth, setTransMonth] = useState(getCurrentMonthISO());
  const [transYear, setTransYear] = useState(String(new Date().getFullYear()));
  const [transactedList, setTransactedList] = useState([]);
  const [transGroups, setTransGroups] = useState([]);
  const [transLoading, setTransLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [page, limit, search, shopType, salesFilter, statusFilter]);

  useEffect(() => {
    if (viewTab === 'transacted') {
      fetchTransacted();
    }
  }, [viewTab, transFilterMode, transDate, transMonth, transYear, search, salesFilter]);

  useEffect(() => {
    fetchSales();
    fetchBranches();
    loadProvinces();
  }, []);

  const fetchTransacted = async () => {
    setTransLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.CUSTOMERS.TRANSACTED, {
        filter_mode: transFilterMode,
        date: transDate,
        month: transMonth,
        year: transYear,
        sales_id: salesFilter || undefined,
        search,
        limit: 100,
      });
      setTransactedList(res.data || []);
      setTransGroups(res.groups_summary || []);
    } catch (err) {
      toast.error(err.message || 'Gagal memuat toko yang bertransaksi');
    } finally {
      setTransLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.USERS.LIST, { role: 'sales', limit: 100 });
      setSalesList(res.data || []);
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.BRANCHES.LIST);
      setBranches(res.data || []);
    } catch {
      // ignore
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.CUSTOMERS.LIST, {
        page,
        limit,
        search,
        shop_type: shopType || undefined,
        sales_id: salesFilter || undefined,
        is_active: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setCustomers(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Gagal memuat pelanggan');
    } finally {
      setLoading(false);
    }
  };

  const loadProvinces = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.WILAYAH.PROVINCES);
      setProvinces(res.data || []);
    } catch (e) {
      console.warn(e);
    }
  };

  const loadRegencies = async (provCode) => {
    if (!provCode) return;
    try {
      const res = await request.get(API_ENDPOINTS.WILAYAH.REGENCIES(provCode));
      let list = res.data || [];
      if (provCode === '35' && list.length === 0) {
        list = EAST_JAVA_CITIES.map((c) => ({ code: c.code, name: c.name }));
      }
      setRegencies(list);
    } catch {
      if (provCode === '35') {
        setRegencies(EAST_JAVA_CITIES.map((c) => ({ code: c.code, name: c.name })));
      }
    }
  };

  const loadDistricts = async (regCode) => {
    if (!regCode) {
      setDistricts([]);
      return;
    }
    try {
      const res = await request.get(API_ENDPOINTS.WILAYAH.DISTRICTS(regCode));
      setDistricts(res.data || []);
    } catch (e) {
      setDistricts([]);
    }
  };

  const loadVillages = async (distCode) => {
    if (!distCode) {
      setVillages([]);
      return;
    }
    try {
      const res = await request.get(API_ENDPOINTS.WILAYAH.VILLAGES(distCode));
      setVillages(res.data || []);
    } catch (e) {
      setVillages([]);
    }
  };

  const regencyOptions = useMemo(() => {
    const map = new Map();
    regencies.forEach((r) => map.set(r.name.toLowerCase(), { value: r.code, label: r.name, code: r.code, name: r.name }));
    branches.forEach((b) => {
      if (!form.province_name || !b.province_name || b.province_name.toLowerCase() === form.province_name.toLowerCase()) {
        if (!map.has(b.city_name.toLowerCase())) {
          map.set(b.city_name.toLowerCase(), {
            value: b.regency_code || b.city_name,
            label: `${b.city_name} (Cabang)`,
            code: b.regency_code || '',
            name: b.city_name,
          });
        }
      }
    });
    return Array.from(map.values());
  }, [regencies, branches, form.province_name]);

  const handleProvinceChange = (provCode) => {
    const selected = provinces.find((p) => p.code === provCode);
    setForm((prev) => ({
      ...prev,
      province_code: provCode,
      province_name: selected?.name || '',
      regency_code: '',
      regency_name: '',
      district_code: '',
      district_name: '',
      village_code: '',
      village_name: '',
    }));
    setDistricts([]);
    setVillages([]);
    loadRegencies(provCode);
  };

  const handleRegencyChange = (val) => {
    const selected = regencyOptions.find((r) => r.value === val);
    const regCode = selected?.code || val;
    const regName = selected?.name || selected?.label || val;
    setForm((prev) => ({
      ...prev,
      regency_code: regCode,
      regency_name: regName,
      district_code: '',
      district_name: '',
      village_code: '',
      village_name: '',
    }));
    setVillages([]);
    if (regCode && /^\d{2}\.\d{2}$/.test(regCode)) {
      loadDistricts(regCode);
    } else {
      setDistricts([]);
    }
  };

  const handleDistrictChange = (distCode) => {
    const selected = districts.find((d) => d.code === distCode);
    setForm((prev) => ({
      ...prev,
      district_code: distCode,
      district_name: selected?.name || '',
      village_code: '',
      village_name: '',
    }));
    loadVillages(distCode);
  };

  const handleVillageChange = (vilCode) => {
    const selected = villages.find((v) => v.code === vilCode);
    setForm((prev) => ({
      ...prev,
      village_code: vilCode,
      village_name: selected?.name || '',
    }));
  };

  const handleOpenCreate = () => {
    setEditId(null);
    const defaultBranch = branches.find((b) => b.province_name === 'Jawa Timur') || branches[0];
    const initProvCode = defaultBranch?.province_name === 'Jawa Barat' ? '32' : '35';
    const initProvName = defaultBranch?.province_name || 'Jawa Timur';
    const initRegCode = defaultBranch?.regency_code || '35.78';
    const initRegName = defaultBranch?.city_name || 'Kota Surabaya';

    setForm({
      name: '',
      sales_id: '',
      owner_name: '',
      shop_type: 'ritel',
      store_label: 'Toko Baru',
      is_active: 1,
      phone: '',
      address: '',
      province_code: initProvCode,
      province_name: initProvName,
      regency_code: initRegCode,
      regency_name: initRegName,
      district_code: '',
      district_name: '',
      village_code: '',
      village_name: '',
      latitude: '-7.257472',
      longitude: '112.752088',
      credit_limit: 5000000,
      notes: ''
    });
    loadRegencies(initProvCode);
    loadDistricts(initRegCode);
    setVillages([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditId(c.id);
    const provCode = c.province_code || (c.province_name === 'Jawa Barat' ? '32' : '35');
    const regCode = c.regency_code || '';
    setForm({
      name: c.name,
      sales_id: c.sales_id ? String(c.sales_id) : '',
      owner_name: c.owner_name || '',
      shop_type: c.shop_type,
      store_label: c.store_label || '',
      is_active: c.is_active !== undefined ? Number(c.is_active) : 1,
      phone: c.phone,
      address: c.address,
      province_code: provCode,
      province_name: c.province_name || 'Jawa Timur',
      regency_code: regCode,
      regency_name: c.regency_name || '',
      district_code: c.district_code || '',
      district_name: c.district_name || '',
      village_code: c.village_code || '',
      village_name: c.village_name || '',
      latitude: c.latitude || '',
      longitude: c.longitude || '',
      credit_limit: c.credit_limit || 0,
      notes: c.notes || ''
    });
    loadRegencies(provCode);
    if (regCode) loadDistricts(regCode);
    if (c.district_code) loadVillages(c.district_code);
    setModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) {
      toast.error('Nama toko, telepon, dan alamat wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      if (editId) {
        await request.put(API_ENDPOINTS.CUSTOMERS.UPDATE(editId), form);
        toast.success('Data toko berhasil diperbarui!');
      } else {
        await request.post(API_ENDPOINTS.CUSTOMERS.CREATE, form);
        toast.success('Toko baru berhasil ditambahkan!');
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data toko');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await request.del(API_ENDPOINTS.CUSTOMERS.DELETE(deleteId));
      toast.success('Toko berhasil dihapus');
      setDeleteOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus toko');
    }
  };

  const handleOpenSettle = (c) => {
    setSettleTarget({
      id: c.id || c.customer_id,
      name: c.name || c.customer_name,
      current_balance: Number(c.current_balance || c.unpaid_amount || 0),
    });
    setSettleMethod('tunai');
    setSettleOpen(true);
  };

  const handleConfirmSettle = async () => {
    if (!settleTarget) return;
    setSettling(true);
    try {
      await request.put(API_ENDPOINTS.CUSTOMERS.SETTLE_BALANCE(settleTarget.id), {
        payment_method: settleMethod,
        notes: `Pelunasan piutang toko (${settleMethod}) oleh admin`,
      });
      toast.success(`Piutang toko "${settleTarget.name}" berhasil dilunasi!`);
      setSettleOpen(false);
      setSettleTarget(null);
      fetchCustomers();
      if (viewTab === 'transacted') fetchTransacted();
    } catch (err) {
      toast.error(err.message || 'Gagal melunasi piutang toko');
    } finally {
      setSettling(false);
    }
  };

  const groupedTransacted = useMemo(() => {
    const map = {};
    transactedList.forEach((row) => {
      const d = row.trans_date || getTodayISO();
      if (!map[d]) map[d] = [];
      map[d].push(row);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactedList]);

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Database Toko & Outlet Pelanggan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tersinkron langsung dengan input sales lapangan, kategori toko transaksi (Tanggal/Bulan/Tahun), dan kontrol piutang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchCustomers();
              if (viewTab === 'transacted') fetchTransacted();
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${(loading || transLoading) ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Sinkronkan</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Toko Baru</span>
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setViewTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            viewTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Store className="h-3.5 w-3.5" /> Semua Database Toko (Sales & Admin)
        </button>
        <button
          type="button"
          onClick={() => setViewTab('transacted')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            viewTab === 'transacted'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" /> Toko Transaksi Sales (Tanggal / Bulan / Tahun)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="w-full lg:w-72">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Cari nama toko, label, keterangan..."
            />
          </div>

          <div className="w-full lg:w-64">
            <AppSelect
              value={salesFilter}
              onChange={(val) => {
                setSalesFilter(val);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Semua Toko (Semua Sales)' },
                ...salesList.map((s) => ({ value: String(s.id), label: `Sales: ${s.name}` })),
              ]}
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto w-full lg:w-auto text-xs pb-1 lg:pb-0">
            {[
              { key: '', label: 'Semua Tipe' },
              { key: 'ritel', label: 'Ritel' },
              { key: 'grosir', label: 'Grosir' },
              { key: 'apotek_klinik', label: 'Apotek / Klinik' },
              { key: 'agen', label: 'Agen' },
            ].map((type) => (
              <button
                key={type.key}
                onClick={() => {
                  setShopType(type.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                  shopType === type.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1.5 text-[11px]">
          {[
            { key: 'all', label: 'Semua Status' },
            { key: '1', label: 'Toko Aktif' },
            { key: '0', label: 'Toko Tidak Aktif' },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => {
                setStatusFilter(st.key);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                statusFilter === st.key
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transacted View vs All Database Table */}
      {viewTab === 'transacted' ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { key: 'followup', label: 'Follow Up 7 Hari Terakhir' },
                  { key: 'day', label: 'Kategori Tanggal' },
                  { key: 'month', label: 'Kategori Bulan' },
                  { key: 'year', label: 'Kategori Tahun' },
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setTransFilterMode(m.key)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      transFilterMode === m.key
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {transFilterMode === 'day' && (
                  <>
                    <input
                      type="date"
                      value={transDate}
                      onChange={(e) => setTransDate(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-800 bg-slate-50"
                    />
                    <span className="font-mono font-bold text-emerald-700">{formatDateID(transDate)}</span>
                  </>
                )}
                {transFilterMode === 'month' && (
                  <>
                    <input
                      type="month"
                      value={transMonth}
                      onChange={(e) => setTransMonth(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-800 bg-slate-50"
                    />
                    <span className="font-mono font-bold text-emerald-700">{formatMonthYearID(transMonth)}</span>
                  </>
                )}
                {transFilterMode === 'year' && (
                  <select
                    value={transYear}
                    onChange={(e) => setTransYear(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-800 bg-slate-50"
                  >
                    {[2024, 2025, 2026, 2027].map((yr) => (
                      <option key={yr} value={String(yr)}>{yr}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {transGroups.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                {transGroups.slice(0, 14).map((g) => {
                  const active = transFilterMode === 'day' && transDate === g.trans_date;
                  return (
                    <button
                      key={g.trans_date}
                      type="button"
                      onClick={() => {
                        setTransFilterMode('day');
                        setTransDate(g.trans_date);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        active
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {formatDateID(g.trans_date)} • {g.store_count} Toko
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {transLoading ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-100">
              Memuat kelompok toko transaksi...
            </div>
          ) : groupedTransacted.length > 0 ? (
            groupedTransacted.map(([dateKey, items]) => (
              <div key={dateKey} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold font-mono">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span>Tanggal Order: {formatDateID(dateKey)}</span>
                  </div>
                  <span className="font-bold text-emerald-300">
                    {items.length} Toko Transaksi • Total Rp {items.reduce((s, it) => s + Number(it.total_amount || 0), 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-2.5">Toko / Outlet</th>
                        <th className="px-5 py-2.5">Sales Petugas</th>
                        <th className="px-5 py-2.5">Wilayah</th>
                        <th className="px-5 py-2.5">Faktur Order</th>
                        <th className="px-5 py-2.5 text-right">Total Transaksi</th>
                        <th className="px-5 py-2.5 text-right">Status Piutang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {items.map((item) => {
                        const debtAmt = Math.max(Number(item.current_balance || 0), Number(item.unpaid_amount || 0));
                        return (
                          <tr key={`${dateKey}-${item.customer_id}`} className="hover:bg-slate-50/60">
                            <td className="px-5 py-3">
                              <strong className="font-bold text-slate-900 block">{item.customer_name}</strong>
                              <span className="text-[10px] font-mono text-slate-400">{item.customer_code}</span>
                            </td>
                            <td className="px-5 py-3">
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 font-bold text-[10px]">
                                {item.sales_name || '-'}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-[11px]">
                              <span className="font-semibold">{item.regency_name || '-'}</span>
                              <p className="text-[10px] text-slate-400">Kec. {item.district_name || '-'}</p>
                            </td>
                            <td className="px-5 py-3 font-mono text-[11px] text-slate-600 max-w-[180px] truncate">
                              {item.invoice_numbers} ({item.order_count}x)
                            </td>
                            <td className="px-5 py-3 text-right font-black text-emerald-700 font-mono">
                              Rp {Number(item.total_amount || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {debtAmt > 0 ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold font-mono">
                                    Rp {debtAmt.toLocaleString('id-ID')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSettle(item)}
                                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                                  >
                                    Lunasi
                                  </button>
                                </div>
                              ) : (
                                <span className="text-emerald-600 font-bold">Lunas</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-100">
              Belum ada transaksi toko pada kategori tanggal/bulan/tahun yang dipilih.
            </div>
          )}
        </div>
      ) : (
      /* Customers Table */
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Kode / Toko</th>
                <th className="px-5 py-3">Tipe & Label</th>
                <th className="px-5 py-3">Sales PJ</th>
                <th className="px-5 py-3">Pemilik & Kontak</th>
                <th className="px-5 py-3">Wilayah (Kota – Kec – Desa)</th>
                <th className="px-5 py-3 text-right">Saldo Piutang</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Memuat data toko...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => {
                  const isActive = Number(c.is_active) === 1;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {c.image ? (
                              <img
                                src={getStorageUrl(c.image)}
                                alt={c.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Store className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-slate-400">{c.code}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                  isActive
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {isActive ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </div>
                            <strong className="font-bold text-slate-900 text-xs block">{c.name}</strong>
                            <span className="text-[11px] text-slate-500 truncate max-w-xs block">{c.address}</span>
                            {c.notes && (
                              <span className="text-[10px] text-slate-400 italic block truncate max-w-xs">
                                Ket: {c.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 space-y-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 inline-block">
                          {c.shop_type?.replace('_', ' ')}
                        </span>
                        {c.store_label && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 flex items-center gap-1 w-fit">
                            <Tag className="h-2.5 w-2.5" /> {c.store_label}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-100">
                          {c.sales_name || 'Semua Toko'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800">{c.owner_name || '-'}</p>
                        {c.phone && (
                          <a
                            href={`https://wa.me/62${c.phone.replace(/^0/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:underline flex items-center gap-1 text-[11px] font-medium"
                          >
                            <PhoneCall className="h-3 w-3" /> {c.phone}
                          </a>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{c.regency_name || 'Kabupaten Bogor'}</p>
                        <p className="text-[11px] text-slate-600">Kec. {c.district_name || '-'}</p>
                        <p className="text-[10px] text-slate-400">Desa {c.village_name || '-'}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right font-black">
                        {Number(c.current_balance) > 0 ? (
                          <div className="inline-flex flex-col items-end gap-1">
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg font-mono">
                              Rp {Number(c.current_balance).toLocaleString('id-ID')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenSettle(c)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Tandai Lunas
                            </button>
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-bold">Lunas (Rp 0)</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                          title="Edit Data Toko"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(c.id);
                            setDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50"
                          title="Hapus Toko"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Tidak ada toko yang sesuai pencarian atau filter sales.
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
      )}

      {/* Modal Add / Edit Customer */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Data Toko Pelanggan' : 'Tambah Toko Pelanggan Baru'}
      >
        <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Toko / Outlet *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Sales Penanggung Jawab
            </label>
            <AppSelect
              value={form.sales_id}
              onChange={(val) => setForm({ ...form, sales_id: val })}
              options={[
                { value: '', label: 'Semua Sales (Umum / Belum Ditetapkan)' },
                ...salesList.map((s) => ({ value: String(s.id), label: `${s.name} (${s.vehicle_type})` })),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Pemilik Toko
              </label>
              <input
                type="text"
                value={form.owner_name}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jenis Toko
              </label>
              <AppSelect
                value={form.shop_type}
                onChange={(val) => setForm({ ...form, shop_type: val })}
                options={[
                  { value: 'ritel', label: 'Ritel' },
                  { value: 'grosir', label: 'Grosir' },
                  { value: 'apotek_klinik', label: 'Apotek / Klinik' },
                  { value: 'agen', label: 'Agen' },
                ]}
              />
            </div>
          </div>

          {/* Label & Status Toko */}
          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-2">
            <label className="block font-bold text-indigo-900 uppercase tracking-wider text-[11px]">
              Label Toko & Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setForm({ ...form, store_label: '' })}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                  !form.store_label ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                Tanpa Label
              </button>
              {STORE_LABEL_PRESETS.map((lbl) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setForm({ ...form, store_label: lbl })}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                    form.store_label === lbl
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <input
                type="text"
                value={form.store_label}
                onChange={(e) => setForm({ ...form, store_label: e.target.value })}
                placeholder="Label kustom..."
                className="rounded-xl border border-indigo-200 bg-white p-2 text-xs text-slate-800"
              />
              <AppSelect
                value={String(form.is_active)}
                onChange={(val) => setForm({ ...form, is_active: Number(val) })}
                options={[
                  { value: '1', label: 'Status: Aktif' },
                  { value: '0', label: 'Status: Tidak Aktif' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              No. Telepon / WhatsApp *
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
            />
          </div>

          {/* Wilayah API */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
              Data Wilayah (Kota/Kabupaten – Kec – Desa)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Provinsi</label>
                <AppSelect
                  value={form.province_code}
                  onChange={(val) => handleProvinceChange(val)}
                  placeholder="Pilih Provinsi..."
                  options={provinces.map((p) => ({ value: p.code, label: p.name }))}
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Kota / Kabupaten</label>
                <AppSelect
                  value={form.regency_code || form.regency_name}
                  onChange={(val) => handleRegencyChange(val)}
                  placeholder="Pilih Kota/Kab..."
                  options={regencyOptions}
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Kecamatan</label>
                <AppSelect
                  value={form.district_code}
                  onChange={(val) => handleDistrictChange(val)}
                  placeholder="Pilih Kecamatan..."
                  isDisabled={!form.regency_code}
                  options={districts.map((d) => ({ value: d.code, label: d.name }))}
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Desa / Kelurahan</label>
                <AppSelect
                  value={form.village_code}
                  onChange={(val) => handleVillageChange(val)}
                  placeholder="Pilih Desa..."
                  isDisabled={!form.district_code}
                  options={villages.map((v) => ({ value: v.code, label: v.name }))}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Alamat Lengkap *
            </label>
            <textarea
              required
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Keterangan Toko
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Catatan tambahan tentang toko..."
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
              {submitting ? 'Menyimpan...' : 'Simpan Toko'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Settle Piutang Modal */}
      <Modal
        isOpen={settleOpen}
        onClose={() => {
          setSettleOpen(false);
          setSettleTarget(null);
        }}
        title="Konfirmasi Pelunasan Piutang Toko"
      >
        {settleTarget && (
          <div className="space-y-4 text-xs">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1">
              <p className="text-[10px] font-bold uppercase text-amber-700">Toko Pelanggan</p>
              <p className="text-sm font-extrabold text-slate-900">{settleTarget.name}</p>
              <p className="text-xs font-black text-amber-700 font-mono">
                Total Piutang: Rp {Number(settleTarget.current_balance || 0).toLocaleString('id-ID')}
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Metode Pelunasan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'tunai', label: 'Tunai (Cash)' },
                  { key: 'transfer', label: 'Transfer Bank' },
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setSettleMethod(m.key)}
                    className={`py-2 px-3 rounded-xl font-bold border text-xs transition-all ${
                      settleMethod === m.key
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSettleOpen(false);
                  setSettleTarget(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={settling}
                onClick={handleConfirmSettle}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow disabled:opacity-50"
              >
                {settling ? 'Memproses...' : 'Tandai Lunas Sekarang'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Toko Pelanggan"
        message="Apakah Anda yakin ingin menghapus data toko pelanggan ini?"
      />
    </AdminLayout>
  );
}
