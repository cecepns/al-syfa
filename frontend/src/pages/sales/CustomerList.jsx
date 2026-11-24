import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Plus,
  PhoneCall,
  MapPin,
  ChevronRight,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Navigation,
  History,
  FileText,
  Clock,
  CheckCircle,
  CreditCard,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import MobileLayout from '../../components/layout/MobileLayout';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ReceiptModal from '../../components/common/ReceiptModal';
import AppSelect from '../../components/common/AppSelect';
import { request } from '../../utils/request';
import { API_ENDPOINTS, getStorageUrl } from '../../utils/endpoints';
import { useGeolocation } from '../../hooks/useGeolocation';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [shopType, setShopType] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Purchase History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [updatingRetailId, setUpdatingRetailId] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);

  // Add Customer Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    owner_name: '',
    shop_type: 'ritel',
    phone: '',
    address: '',
    province_code: '32',
    province_name: 'Jawa Barat',
    regency_code: '32.01',
    regency_name: 'Kabupaten Bogor',
    district_code: '',
    district_name: '',
    village_code: '',
    village_name: '',
    latitude: '',
    longitude: '',
    credit_limit: 5000000,
    notes: ''
  });

  // Wilayah API options
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const geo = useGeolocation();

  useEffect(() => {
    fetchCustomers();
  }, [page, limit, search, shopType]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.CUSTOMERS.LIST, {
        page,
        limit,
        search,
        shop_type: shopType || undefined,
      });
      setCustomers(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.message || 'Gagal memuat pelanggan');
    } finally {
      setLoading(false);
    }
  };

  // Load Provinces on Modal Open
  useEffect(() => {
    if (modalOpen) {
      loadProvinces();
      // Auto-set current GPS coordinates
      if (geo.latitude && geo.longitude) {
        setForm((prev) => ({
          ...prev,
          latitude: geo.latitude.toFixed(6),
          longitude: geo.longitude.toFixed(6),
        }));
      }
    }
  }, [modalOpen]);

  const loadProvinces = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.WILAYAH.PROVINCES);
      setProvinces(res.data || []);
      // Default to Jawa Barat
      loadRegencies('32');
    } catch (e) {
      console.warn(e);
    }
  };

  const loadRegencies = async (provCode) => {
    try {
      const res = await request.get(API_ENDPOINTS.WILAYAH.REGENCIES(provCode));
      setRegencies(res.data || []);
      // Default to Kab Bogor
      loadDistricts('32.01');
    } catch (e) {
      console.warn(e);
    }
  };

  const loadDistricts = async (regCode) => {
    try {
      const res = await request.get(API_ENDPOINTS.WILAYAH.DISTRICTS(regCode));
      setDistricts(res.data || []);
    } catch (e) {
      console.warn(e);
    }
  };

  const loadVillages = async (distCode) => {
    try {
      const res = await request.get(API_ENDPOINTS.WILAYAH.VILLAGES(distCode));
      setVillages(res.data || []);
    } catch (e) {
      console.warn(e);
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

  const handleOpenHistory = async (customer) => {
    setSelectedCustomer(customer);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.CUSTOMERS.PURCHASE_HISTORY(customer.id));
      setPurchaseHistory(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Gagal memuat riwayat belanja');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newStatus = 'lunas') => {
    setUpdatingRetailId(orderId);
    try {
      await request.put(API_ENDPOINTS.ORDERS.PAYMENT_STATUS(orderId), {
        payment_status: newStatus,
        notes: `Update status pembayaran menjadi ${newStatus} langsung oleh sales`
      });
      toast.success(`Status pembayaran toko berhasil diperbarui menjadi ${newStatus.toUpperCase()}!`);
      if (selectedCustomer) {
        const res = await request.get(API_ENDPOINTS.CUSTOMERS.PURCHASE_HISTORY(selectedCustomer.id));
        setPurchaseHistory(res.data || []);
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui status pembayaran');
    } finally {
      setUpdatingRetailId(null);
    }
  };

  const handleSubmitCustomer = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) {
      toast.error('Nama toko, no telepon, dan alamat wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      await request.post(API_ENDPOINTS.CUSTOMERS.CREATE, form);
      toast.success('Toko baru berhasil ditambahkan!');
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data toko');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Database Toko / Outlet" showBack={true}>
      {/* Search & Actions Bar */}
      <div className="space-y-2 mb-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Cari nama toko, alamat, pemilik..."
            />
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm shadow-emerald-200 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Tambah Toko</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
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
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                shopType === type.key
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-3/4 mb-3" />
              <div className="h-8 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : customers.length > 0 ? (
        <div className="space-y-3 mb-4">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-emerald-200 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
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
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        {c.shop_type?.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{c.code}</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-800 mt-0.5">{c.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Pemilik: {c.owner_name || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Hierarchy: KOTA – KECAMATAN – DESA */}
              <div className="text-[11px] font-semibold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg mb-2 border border-slate-100 flex flex-wrap items-center gap-1.5">
                <span className="text-emerald-700 font-bold">{c.regency_name || 'Kota/Kabupaten'}</span>
                <span className="text-slate-300">•</span>
                <span>Kec. {c.district_name || '-'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Desa/Kel. {c.village_name || '-'}</span>
              </div>

              <p className="text-xs text-slate-600 flex items-start gap-1.5 mb-2.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{c.address}</span>
              </p>

              {/* Piutang / Balance Alert */}
              {Number(c.current_balance) > 0 && (
                <div className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg mb-3 flex justify-between">
                  <span>Piutang Belum Lunas:</span>
                  <span>Rp {Number(c.current_balance).toLocaleString('id-ID')}</span>
                </div>
              )}

              {/* Action Buttons: 2 rows */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  {/* Google Maps direct link button */}
                  <a
                    href={
                      c.latitude && c.longitude
                        ? `https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.name} ${c.address || ''} ${c.district_name || ''}`)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors border border-blue-100"
                    title="Buka lokasi di Google Maps"
                  >
                    <Navigation className="h-3.5 w-3.5" /> Buka Maps
                  </a>

                  {/* Riwayat Belanja modal trigger */}
                  <button
                    type="button"
                    onClick={() => handleOpenHistory(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold transition-colors border border-amber-100"
                  >
                    <History className="h-3.5 w-3.5" /> Riwayat Belanja
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {c.phone && (
                    <a
                      href={`https://wa.me/62${c.phone.replace(/^0/, '')}?text=${encodeURIComponent(`Halo ${c.name}, saya dari sales ALSYFA Snack Coklat ingin mengkonfirmasi kebutuhan stok produk Anda.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 text-xs font-bold transition-colors"
                    >
                      <PhoneCall className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  )}
                  <Link
                    to={`/sales/visit/${c.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm shadow-emerald-200"
                  >
                    <MapPin className="h-3.5 w-3.5" /> Kunjungi Toko
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
          <Store className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">Toko tidak ditemukan</h4>
          <p className="text-xs text-slate-400 mt-1 mb-4">Coba ubah kata kunci pencarian atau tambah toko baru.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow"
          >
            <Plus className="h-4 w-4" /> Tambah Toko Sekarang
          </button>
        </div>
      )}

      {/* Pagination */}
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

      {/* Add Customer Modal with Wilayah.id Integration */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Toko Pelanggan Baru">
        <form onSubmit={handleSubmitCustomer} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Nama Toko / Outlet *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Toko Barokah Snack Jaya"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Nama Pemilik</label>
              <input
                type="text"
                value={form.owner_name}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                placeholder="Contoh: H. Sulaiman"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Tipe Toko</label>
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

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">No. WhatsApp / HP *</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="081234567890"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Wilayah.id Cascading Dropdowns */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
              Data Wilayah (Terintegrasi wilayah.id)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Kecamatan</label>
                <AppSelect
                  value={form.district_code}
                  onChange={(val) => handleDistrictChange(val)}
                  placeholder="Pilih Kecamatan..."
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
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Alamat Lengkap *</label>
            <textarea
              required
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Jl. Raya Utama No. XX..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Latitude GPS</label>
              <input
                type="text"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2 text-slate-800 font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Longitude GPS</label>
              <input
                type="text"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2 text-slate-800 font-mono text-[11px]"
              />
            </div>
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
              {submitting ? 'Menyimpan...' : 'Simpan Toko'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Riwayat Belanja Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Riwayat Belanja - ${selectedCustomer?.name || 'Toko'}`}
      >
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">{selectedCustomer?.name}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {selectedCustomer?.shop_type}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {selectedCustomer?.regency_name} • Kec. {selectedCustomer?.district_name} • Kel. {selectedCustomer?.village_name}
            </p>
          </div>

          {historyLoading ? (
            <div className="space-y-2 py-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-slate-50 p-3 rounded-xl animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : purchaseHistory.length > 0 ? (
            <div className="space-y-3">
              {purchaseHistory.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5"
                >
                  {/* Order Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <p className="text-xs font-black text-slate-900 font-mono">
                        {order.invoice_number}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> Tanggal: {order.order_date?.substring(0, 10)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          order.payment_status === 'lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.payment_status === 'lunas' ? 'LUNAS' : 'BELUM LUNAS'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                        Metode: {order.payment_method}
                      </p>
                    </div>
                  </div>

                  {/* Items List: Tanggal, Nama Produk, Qty, Nominal */}
                  <div className="space-y-1.5 text-xs">
                    {(order.items || []).map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]"
                      >
                        <div className="overflow-hidden pr-2">
                          <p className="font-semibold text-slate-800 truncate">
                            {it.product_name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {it.qty} {it.unit || 'pcs'} x Rp {Number(it.price).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <span className="font-extrabold text-slate-900 font-mono shrink-0">
                          Rp {Number(it.total_price).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Total, Print & Retail Lunas Action */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-slate-500">Total Belanja:</span>
                      <p className="text-sm font-black text-emerald-700">
                        Rp {Number(order.grand_total).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Print Receipt Button via Bluetooth Thermal */}
                      <button
                        type="button"
                        onClick={() => setReceiptOrder(order)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all border border-blue-200"
                        title="Cetak Struk Transaksi Bluetooth"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Cetak</span>
                      </button>

                      {/* Sales can mark LUNAS directly for any store type (ritel, grosir, agen, apotek) */}
                      {order.payment_status !== 'lunas' ? (
                        <button
                          type="button"
                          onClick={() => handleUpdatePaymentStatus(order.id, 'lunas')}
                          disabled={updatingRetailId === order.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-200 disabled:opacity-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>{updatingRetailId === order.id ? 'Memproses...' : 'Tandai Lunas'}</span>
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                          <CheckCircle className="h-3.5 w-3.5" /> Terbayar Lunas
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              <History className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p>Belum ada riwayat transaksi belanja untuk toko ini.</p>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setHistoryModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* Re-print Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptOrder}
        onClose={() => setReceiptOrder(null)}
        order={receiptOrder}
      />
    </MobileLayout>
  );
}
