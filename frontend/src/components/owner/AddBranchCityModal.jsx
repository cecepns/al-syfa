import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Plus,
  Search,
  CheckCircle2,
  Sparkles,
  Edit2,
  Trash2,
  Settings2,
  Save,
  X,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import AppSelect from '../common/AppSelect';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { EAST_JAVA_CITIES } from '../../utils/eastJavaCities';

export default function AddBranchCityModal({ isOpen, onClose, existingCities = [], onSuccess }) {
  const [tab, setTab] = useState('wilayah'); // 'wilayah' | 'manage'
  const [searchCity, setSearchCity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Live Wilayah.id Provinsi & Kabupaten/Kota
  const [provinces, setProvinces] = useState([]);
  const [provinceCode, setProvinceCode] = useState('35');
  const [provinceName, setProvinceName] = useState('Jawa Timur');
  const [regencies, setRegencies] = useState([]);
  const [loadingRegencies, setLoadingRegencies] = useState(false);

  // Checked city names (lowercase set or exact names) in the active province view
  const [checkedNames, setCheckedNames] = useState(new Set());

  // Registered branch_cities from DB
  const [branchRows, setBranchRows] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [manageSearch, setManageSearch] = useState('');

  // Manual add / Edit in manage tab
  const [manualName, setManualName] = useState('');
  const [manualProvince, setManualProvince] = useState('Jawa Timur');
  const [editingBranch, setEditingBranch] = useState(null);
  const [editForm, setEditForm] = useState({ city_name: '', province_name: '', notes: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const normalizedExisting = useMemo(() => {
    const names = new Set(existingCities.map((c) => String(c).toLowerCase().trim()));
    branchRows.forEach((b) => names.add(String(b.city_name).toLowerCase().trim()));
    return names;
  }, [existingCities, branchRows]);

  useEffect(() => {
    if (isOpen) {
      setSearchCity('');
      setManageSearch('');
      setEditingBranch(null);
      setProvinceCode('35');
      setProvinceName('Jawa Timur');
      loadProvinces();
      loadRegisteredBranches();
      loadRegencies('35');
    }
  }, [isOpen]);

  // Whenever regencies or existing branches update, sync initial checked state for this province
  useEffect(() => {
    if (!isOpen) return;
    const initial = new Set();
    regencies.forEach((r) => {
      if (normalizedExisting.has(String(r.name).toLowerCase().trim())) {
        initial.add(String(r.name).toLowerCase().trim());
      }
    });
    setCheckedNames(initial);
  }, [regencies, normalizedExisting, isOpen]);

  const loadRegisteredBranches = async () => {
    setLoadingBranches(true);
    try {
      const res = await request.get(API_ENDPOINTS.BRANCHES.LIST);
      setBranchRows(res.data || []);
    } catch {
      setBranchRows([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadProvinces = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.WILAYAH.PROVINCES);
      setProvinces(res.data || []);
    } catch {
      // ignore
    }
  };

  const loadRegencies = async (provCode) => {
    if (!provCode) return;
    setLoadingRegencies(true);
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
      } else {
        setRegencies([]);
      }
    } finally {
      setLoadingRegencies(false);
    }
  };

  const handleProvinceChange = (val) => {
    if (!val) return;
    const p = provinces.find((item) => item.code === val);
    setProvinceCode(val);
    setProvinceName(p?.name || '');
    setSearchCity('');
    loadRegencies(val);
  };

  const filteredRegencies = useMemo(() => {
    if (!searchCity.trim()) return regencies;
    const q = searchCity.toLowerCase();
    return regencies.filter((r) => String(r.name).toLowerCase().includes(q));
  }, [regencies, searchCity]);

  const toggleCityCheck = (cityName) => {
    const key = String(cityName).toLowerCase().trim();
    setCheckedNames((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCheckAllInProvince = () => {
    const next = new Set(checkedNames);
    filteredRegencies.forEach((r) => next.add(String(r.name).toLowerCase().trim()));
    setCheckedNames(next);
  };

  const handleUncheckAllInProvince = () => {
    const next = new Set(checkedNames);
    filteredRegencies.forEach((r) => next.delete(String(r.name).toLowerCase().trim()));
    setCheckedNames(next);
  };

  // Compute diff between existing in current province vs checkedNames
  const { toAdd, toRemove } = useMemo(() => {
    const addList = [];
    const removeList = [];
    regencies.forEach((r) => {
      const key = String(r.name).toLowerCase().trim();
      const wasExisting = normalizedExisting.has(key);
      const isChecked = checkedNames.has(key);
      if (!wasExisting && isChecked) {
        addList.push({
          city_name: r.name,
          province_name: provinceName || 'Jawa Timur',
          regency_code: r.code,
        });
      } else if (wasExisting && !isChecked) {
        removeList.push(r.name);
      }
    });
    return { toAdd: addList, toRemove: removeList };
  }, [regencies, normalizedExisting, checkedNames, provinceName]);

  const handleSyncCities = async () => {
    if (toAdd.length === 0 && toRemove.length === 0) {
      toast('Tidak ada perubahan kota yang dipilih');
      return;
    }
    setSubmitting(true);
    try {
      const res = await request.post(API_ENDPOINTS.BRANCHES.SYNC, {
        add_cities: toAdd,
        remove_cities: toRemove,
      });
      toast.success(res.message || 'Daftar kota cabang berhasil diperbarui!');
      await loadRegisteredBranches();
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui daftar kota cabang');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredManagedBranches = useMemo(() => {
    const map = new Map();
    branchRows.forEach((b) => map.set(b.city_name.toLowerCase(), b));
    existingCities.forEach((cName) => {
      if (cName && !map.has(String(cName).toLowerCase())) {
        map.set(String(cName).toLowerCase(), {
          id: null,
          city_name: cName,
          province_name: 'Operasional',
          notes: '',
        });
      }
    });
    const list = Array.from(map.values()).sort((a, b) => a.city_name.localeCompare(b.city_name));
    if (!manageSearch.trim()) return list;
    const q = manageSearch.toLowerCase();
    return list.filter(
      (b) =>
        b.city_name.toLowerCase().includes(q) ||
        (b.province_name || '').toLowerCase().includes(q)
    );
  }, [branchRows, existingCities, manageSearch]);

  const handleAddManual = async (e) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    setSubmitting(true);
    try {
      await request.post(API_ENDPOINTS.BRANCHES.CREATE, {
        city_name: manualName.trim(),
        province_name: manualProvince.trim() || 'Jawa Timur',
      });
      toast.success(`Kota "${manualName.trim()}" berhasil ditambahkan!`);
      setManualName('');
      await loadRegisteredBranches();
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || 'Gagal menambah kota');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (branch) => {
    setEditingBranch(branch);
    setEditForm({
      city_name: branch.city_name || '',
      province_name: branch.province_name || 'Jawa Timur',
      notes: branch.notes || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingBranch || !editForm.city_name.trim()) {
      toast.error('Nama kota tidak boleh kosong');
      return;
    }
    setSavingEdit(true);
    try {
      if (editingBranch.id) {
        await request.put(API_ENDPOINTS.BRANCHES.UPDATE(editingBranch.id), {
          city_name: editForm.city_name.trim(),
          province_name: editForm.province_name.trim() || 'Jawa Timur',
          notes: editForm.notes,
        });
      } else {
        await request.put(API_ENDPOINTS.BRANCHES.RENAME, {
          old_city_name: editingBranch.city_name,
          city_name: editForm.city_name.trim(),
          province_name: editForm.province_name.trim() || 'Jawa Timur',
          notes: editForm.notes,
        });
      }
      toast.success(`Kota "${editForm.city_name.trim()}" berhasil diperbarui!`);
      setEditingBranch(null);
      await loadRegisteredBranches();
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui kota cabang');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      let res;
      if (deleteTarget.id) {
        res = await request.del(API_ENDPOINTS.BRANCHES.DELETE(deleteTarget.id));
      } else {
        res = await request.del(API_ENDPOINTS.BRANCHES.DELETE_BY_NAME(deleteTarget.city_name));
      }
      toast.success(res.message || `Kota "${deleteTarget.city_name}" berhasil dihapus!`);
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadRegisteredBranches();
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus kota cabang');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Kelola Kota / Cabang (Integrasi wilayah.id)"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTab('wilayah')}
              className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-[11px] ${tab === 'wilayah'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>Centang / Uncheck Kota (wilayah.id)</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('manage')}
              className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-[11px] ${tab === 'manage'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Settings2 className="h-3.5 w-3.5 shrink-0" />
              <span>Edit Nama / Tambah Manual ({filteredManagedBranches.length})</span>
            </button>
          </div>

          {tab === 'wilayah' ? (
            <div className="space-y-3">
              {/* Info Banner */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-3 rounded-2xl flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-emerald-800">
                  <strong>Centang</strong> kota dari untuk menambahkan, atau{' '}
                  <strong className="text-rose-700">Uncheck (hapus centang)</strong> kota yang sudah aktif untuk menghapusnya.
                </div>
              </div>

              {/* Province Selector (React Select) + Search City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Pilih Provinsi (wilayah.id)
                  </label>
                  <AppSelect
                    value={provinceCode}
                    onChange={handleProvinceChange}
                    placeholder="Cari provinsi..."
                    options={provinces.map((p) => ({ value: p.code, label: p.name }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Cari Kabupaten / Kota
                  </label>
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      placeholder={`Cari di ${provinceName || 'provinsi'}...`}
                      className="w-full h-[38px] pl-8 pr-3 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:outline-none text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Check All / Uncheck All */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-500 font-semibold">
                  {loadingRegencies
                    ? 'Memuat daftar kota dari wilayah.id...'
                    : `Menampilkan ${filteredRegencies.length} Kab/Kota (${checkedNames.size} dicentang)`}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCheckAllInProvince}
                    className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold"
                  >
                    Centang Semua
                  </button>
                  <button
                    type="button"
                    onClick={handleUncheckAllInProvince}
                    className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold"
                  >
                    Uncheck Semua
                  </button>
                </div>
              </div>

              {/* Checklist of Cities from wilayah.id */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {loadingRegencies ? (
                  <div className="col-span-2 py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                    <span>Mengambil data dari wilayah.id...</span>
                  </div>
                ) : filteredRegencies.length > 0 ? (
                  filteredRegencies.map((city) => {
                    const key = String(city.name).toLowerCase().trim();
                    const wasExisting = normalizedExisting.has(key);
                    const isChecked = checkedNames.has(key);
                    const isBeingRemoved = wasExisting && !isChecked;
                    const isBeingAdded = !wasExisting && isChecked;

                    return (
                      <label
                        key={city.code || city.name}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${isBeingRemoved
                            ? 'bg-rose-50 border-rose-300 text-rose-800'
                            : isBeingAdded
                              ? 'bg-blue-50 border-blue-400 text-blue-900'
                              : isChecked
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCityCheck(city.name)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-bold">{city.name}</span>
                        </div>
                        {isBeingRemoved ? (
                          <span className="text-[10px] font-extrabold text-rose-600">Akan Dihapus</span>
                        ) : isBeingAdded ? (
                          <span className="text-[10px] font-extrabold text-blue-600">+ Baru</span>
                        ) : isChecked ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">{city.code}</span>
                        )}
                      </label>
                    );
                  })
                ) : (
                  <div className="col-span-2 py-8 text-center text-slate-400">
                    Tidak ada kota yang cocok dengan pencarian.
                  </div>
                )}
              </div>

              {/* Diff Status & Save Footer */}
              {(toAdd.length > 0 || toRemove.length > 0) && (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[11px]">
                  <span className="font-bold text-slate-600">Perubahan dipilih:</span>
                  <div className="flex items-center gap-2">
                    {toAdd.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        +{toAdd.length} Ditambahkan
                      </span>
                    )}
                    {toRemove.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                        -{toRemove.length} Dihapus
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={submitting || (toAdd.length === 0 && toRemove.length === 0)}
                  onClick={handleSyncCities}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow shadow-emerald-200 disabled:opacity-50"
                >
                  {submitting
                    ? 'Menyimpan...'
                    : toAdd.length > 0 || toRemove.length > 0
                      ? `Simpan Perubahan (${toAdd.length > 0 ? `+${toAdd.length}` : ''}${toAdd.length > 0 && toRemove.length > 0 ? ' / ' : ''}${toRemove.length > 0 ? `-${toRemove.length}` : ''})`
                      : 'Pilih / Uncheck Kota'}
                </button>
              </div>
            </div>
          ) : (
            /* Tab 2: Edit Nama / Catatan / Hapus / Tambah Manual */
            <div className="space-y-3">
              {/* Quick Manual Add */}
              <form onSubmit={handleAddManual} className="flex flex-col sm:flex-row gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Tambah kota manual (cth: Kota Surabaya)..."
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 font-semibold focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={manualProvince}
                  onChange={(e) => setManualProvince(e.target.value)}
                  placeholder="Provinsi"
                  className="sm:w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Tambah
                </button>
              </form>

              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={manageSearch}
                  onChange={(e) => setManageSearch(e.target.value)}
                  placeholder="Cari kota yang sudah terdaftar..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {editingBranch && (
                <form
                  onSubmit={handleSaveEdit}
                  className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900">
                      Edit Kota: {editingBranch.city_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingBranch(null)}
                      className="p-1 rounded-lg text-blue-600 hover:bg-blue-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={editForm.city_name}
                      onChange={(e) => setEditForm({ ...editForm, city_name: e.target.value })}
                      placeholder="Nama Kota / Kabupaten"
                      className="rounded-xl border border-blue-200 bg-white p-2 text-slate-800 font-bold"
                    />
                    <input
                      type="text"
                      value={editForm.province_name}
                      onChange={(e) => setEditForm({ ...editForm, province_name: e.target.value })}
                      placeholder="Provinsi (cth: Jawa Timur)"
                      className="rounded-xl border border-blue-200 bg-white p-2 text-slate-800"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="Catatan cabang (opsional)"
                      className="flex-1 rounded-xl border border-blue-200 bg-white p-2 text-slate-800"
                    />
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{savingEdit ? 'Menyimpan...' : 'Simpan'}</span>
                    </button>
                  </div>
                </form>
              )}

              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                {loadingBranches ? (
                  <div className="p-6 text-center text-slate-400">Memuat daftar kota...</div>
                ) : filteredManagedBranches.length > 0 ? (
                  filteredManagedBranches.map((b, i) => (
                    <div
                      key={b.id || `${b.city_name}-${i}`}
                      className="flex items-center justify-between p-3 hover:bg-slate-50/70"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{b.city_name}</p>
                        <p className="text-[10px] text-slate-400">
                          {b.province_name || 'Jawa Timur'}
                          {b.notes ? ` • ${b.notes}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(b)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit Kota"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget(b);
                            setDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus Kota"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    Belum ada kota yang terdaftar.
                  </div>
                )}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Kota / Cabang"
        message={`Apakah Anda yakin ingin menghapus kota "${deleteTarget?.city_name || ''}" dari daftar cabang & target?`}
      />
    </>
  );
}
