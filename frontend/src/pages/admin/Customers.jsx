import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  PhoneCall,
  Tag
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

  useEffect(() => {
    fetchCustomers();
  }, [page, limit, search, shopType, salesFilter, statusFilter]);

  useEffect(() => {
    fetchSales();
    fetchBranches();
    loadProvinces();
  }, []);

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

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Database Toko & Outlet Pelanggan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manajemen direktori pelanggan, label toko, status aktif/nonaktif, dan koordinat GPS outlet.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Toko Baru</span>
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

      {/* Customers Table */}
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
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg">
                            Rp {Number(c.current_balance).toLocaleString('id-ID')}
                          </span>
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
