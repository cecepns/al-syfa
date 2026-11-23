import React, { useState, useEffect } from 'react';
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  PhoneCall,
  MapPin,
  Filter,
  Eye,
  CheckCircle2
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

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [shopType, setShopType] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
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

  // Wilayah.id Integration
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  // Delete Confirm State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [page, limit, search, shopType]);

  useEffect(() => {
    loadDistricts('32.01'); // Kab Bogor
  }, []);

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
      toast.error('Gagal memuat pelanggan');
    } finally {
      setLoading(false);
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

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({
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
      latitude: '-6.482000',
      longitude: '106.845000',
      credit_limit: 5000000,
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      owner_name: c.owner_name || '',
      shop_type: c.shop_type,
      phone: c.phone,
      address: c.address,
      province_code: c.province_code || '32',
      province_name: c.province_name || 'Jawa Barat',
      regency_code: c.regency_code || '32.01',
      regency_name: c.regency_name || 'Kabupaten Bogor',
      district_code: c.district_code || '',
      district_name: c.district_name || '',
      village_code: c.village_code || '',
      village_name: c.village_name || '',
      latitude: c.latitude || '',
      longitude: c.longitude || '',
      credit_limit: c.credit_limit || 0,
      notes: c.notes || ''
    });
    if (c.district_code) {
      loadVillages(c.district_code);
    }
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
            Manajemen direktori pelanggan, kontak langsung WhatsApp, dan koordinat GPS outlet.
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
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Cari nama toko, alamat, no hp..."
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
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

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Kode / Toko</th>
                <th className="px-5 py-3">Tipe</th>
                <th className="px-5 py-3">Pemilik & Kontak</th>
                <th className="px-5 py-3">Wilayah (Kecamatan / Desa)</th>
                <th className="px-5 py-3 text-right">Saldo Piutang</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Memuat data toko...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[10px] text-slate-400 block">{c.code}</span>
                      <strong className="font-bold text-slate-900 text-xs block">{c.name}</strong>
                      <span className="text-[11px] text-slate-500 truncate max-w-xs block">{c.address}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {c.shop_type?.replace('_', ' ')}
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
                      <p className="font-semibold text-slate-800">{c.district_name || '-'}</p>
                      <p className="text-[10px] text-slate-400">{c.village_name || '-'}</p>
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
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Tidak ada toko yang sesuai pencarian.
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

      {/* Modal Add / Edit Customer with Wilayah.id integration */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Data Toko Pelanggan' : 'Tambah Toko Pelanggan Baru'}
      >
        <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
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
