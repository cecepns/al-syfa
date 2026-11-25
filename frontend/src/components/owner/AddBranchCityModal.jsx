import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import AppSelect from '../common/AppSelect';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { EAST_JAVA_CITIES } from '../../utils/eastJavaCities';

export default function AddBranchCityModal({ isOpen, onClose, existingCities = [], onSuccess }) {
  const [searchCity, setSearchCity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Live Wilayah.id Provinsi & Kabupaten/Kota
  const [provinces, setProvinces] = useState([]);
  const [provinceCode, setProvinceCode] = useState('35');
  const [provinceName, setProvinceName] = useState('Jawa Timur');
  const [regencies, setRegencies] = useState([]);
  const [loadingRegencies, setLoadingRegencies] = useState(false);

  // Checked city names (lowercase set) in the active province view
  const [checkedNames, setCheckedNames] = useState(new Set());

  // Registered branch_cities from DB
  const [branchRows, setBranchRows] = useState([]);

  const normalizedExisting = useMemo(() => {
    const names = new Set(existingCities.map((c) => String(c).toLowerCase().trim()));
    branchRows.forEach((b) => names.add(String(b.city_name).toLowerCase().trim()));
    return names;
  }, [existingCities, branchRows]);

  useEffect(() => {
    if (isOpen) {
      setSearchCity('');
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
    try {
      const res = await request.get(API_ENDPOINTS.BRANCHES.LIST);
      setBranchRows(res.data || []);
    } catch {
      setBranchRows([]);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah / Hapus Kota Cabang (wilayah.id)"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-3 text-xs">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-3 rounded-2xl flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-emerald-800">
            <strong>Centang</strong> kota dari <span className="font-mono font-bold">wilayah.id</span> untuk menambahkan, atau{' '}
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
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isBeingRemoved
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
    </Modal>
  );
}
