import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Plus, Search, CheckCircle2, Sparkles, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import AppSelect from '../common/AppSelect';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { EAST_JAVA_CITIES } from '../../utils/eastJavaCities';

export default function AddBranchCityModal({ isOpen, onClose, existingCities = [], onSuccess }) {
  const [tab, setTab] = useState('jatim'); // 'jatim' | 'custom'
  const [searchCity, setSearchCity] = useState('');
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Custom / Other Province state
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [provinceCode, setProvinceCode] = useState('35');
  const [provinceName, setProvinceName] = useState('Jawa Timur');
  const [customCityName, setCustomCityName] = useState('');
  const [customRegCode, setCustomRegCode] = useState('');
  const [notes, setNotes] = useState('');

  const normalizedExisting = useMemo(
    () => new Set(existingCities.map((c) => String(c).toLowerCase().trim())),
    [existingCities]
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedCodes([]);
      setSearchCity('');
      setCustomCityName('');
      setCustomRegCode('');
      setNotes('');
      loadProvinces();
      loadRegencies('35');
    }
  }, [isOpen]);

  const loadProvinces = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.WILAYAH.PROVINCES);
      setProvinces(res.data || []);
    } catch {
      // ignore
    }
  };

  const loadRegencies = async (provCode) => {
    try {
      const res = await request.get(API_ENDPOINTS.WILAYAH.REGENCIES(provCode));
      setRegencies(res.data || []);
    } catch {
      setRegencies([]);
    }
  };

  const filteredJatim = useMemo(() => {
    if (!searchCity.trim()) return EAST_JAVA_CITIES;
    const q = searchCity.toLowerCase();
    return EAST_JAVA_CITIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [searchCity]);

  const availableJatim = useMemo(
    () => EAST_JAVA_CITIES.filter((c) => !normalizedExisting.has(c.name.toLowerCase())),
    [normalizedExisting]
  );

  const toggleCity = (code) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleAddSelectedJatim = async () => {
    const chosen = EAST_JAVA_CITIES.filter((c) => selectedCodes.includes(c.code));
    if (chosen.length === 0) {
      toast.error('Pilih minimal 1 kota/kabupaten terlebih dahulu');
      return;
    }
    setSubmitting(true);
    try {
      await request.post(API_ENDPOINTS.BRANCHES.BATCH, {
        cities: chosen.map((c) => ({
          city_name: c.name,
          province_name: c.province,
          regency_code: c.code,
        })),
      });
      toast.success(`${chosen.length} Kota/Cabang Jawa Timur berhasil ditambahkan!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Gagal menambah kota cabang');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAllJatim = async () => {
    setSubmitting(true);
    try {
      await request.post(API_ENDPOINTS.BRANCHES.BATCH, {
        cities: EAST_JAVA_CITIES.map((c) => ({
          city_name: c.name,
          province_name: c.province,
          regency_code: c.code,
        })),
      });
      toast.success('Seluruh 38 Kota/Kabupaten Jawa Timur berhasil ditambahkan!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Gagal menambahkan seluruh kota Jawa Timur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCustom = async (e) => {
    e.preventDefault();
    if (!customCityName.trim()) {
      toast.error('Nama kota / kabupaten wajib diisi');
      return;
    }
    setSubmitting(true);
    try {
      await request.post(API_ENDPOINTS.BRANCHES.CREATE, {
        city_name: customCityName.trim(),
        province_name: provinceName || 'Jawa Timur',
        regency_code: customRegCode || null,
        notes: notes || null,
      });
      toast.success(`Kota/Cabang "${customCityName.trim()}" berhasil ditambahkan!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Gagal menambahkan kota cabang');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Kota / Cabang Operasional (Owner)"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Mode Tabs */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('jatim')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'jatim'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Pilih Kota Jawa Timur (38 Kab/Kota)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('custom')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'custom'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Tambah Manual / Luar Jatim</span>
          </button>
        </div>

        {tab === 'jatim' ? (
          <div className="space-y-3">
            {/* One-Click All Jawa Timur Banner */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>Ekspansi All Jawa Timur (29 Kab + 9 Kota)</span>
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Tambahkan seluruh 38 Kabupaten & Kota di Jawa Timur sekaligus atau pilih sebagian di bawah ini.
                </p>
              </div>
              <button
                type="button"
                disabled={submitting || availableJatim.length === 0}
                onClick={handleAddAllJatim}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm shadow-emerald-200 transition-all shrink-0 disabled:opacity-50"
              >
                {availableJatim.length === 0
                  ? 'Semua Kota Jatim Sudah Ada'
                  : `Tambah Semua Jawa Timur (${availableJatim.length})`}
              </button>
            </div>

            {/* Search & Quick Select */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="Cari Kabupaten / Kota di Jawa Timur..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCodes(availableJatim.map((c) => c.code))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[11px]"
                >
                  Pilih Belum Ada
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCodes([])}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-[11px]"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Grid of East Java Cities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {filteredJatim.map((city) => {
                const exists = normalizedExisting.has(city.name.toLowerCase());
                const checked = selectedCodes.includes(city.code);
                return (
                  <label
                    key={city.code}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      exists
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 cursor-default'
                        : checked
                        ? 'bg-blue-50 border-blue-400 text-blue-900 cursor-pointer'
                        : 'bg-white border-slate-200 hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={exists}
                        checked={exists || checked}
                        onChange={() => !exists && toggleCity(city.code)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold">{city.name}</span>
                    </div>
                    {exists ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">{city.code}</span>
                    )}
                  </label>
                );
              })}
            </div>

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
                disabled={submitting || selectedCodes.length === 0}
                onClick={handleAddSelectedJatim}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : `Simpan ${selectedCodes.length} Kota Terpilih`}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitCustom} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Provinsi
                </label>
                <AppSelect
                  value={provinceCode}
                  onChange={(val) => {
                    const p = provinces.find((item) => item.code === val);
                    setProvinceCode(val);
                    setProvinceName(p?.name || '');
                    setCustomCityName('');
                    setCustomRegCode('');
                    loadRegencies(val);
                  }}
                  options={provinces.map((p) => ({ value: p.code, label: p.name }))}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih dari Wilayah.id
                </label>
                <AppSelect
                  value={customRegCode}
                  placeholder="Pilih Kab / Kota..."
                  onChange={(val) => {
                    const r = regencies.find((item) => item.code === val);
                    setCustomRegCode(val);
                    if (r) setCustomCityName(r.name);
                  }}
                  options={regencies.map((r) => ({ value: r.code, label: r.name }))}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Atau Ketik Nama Kota / Cabang Manual *
              </label>
              <input
                type="text"
                required
                value={customCityName}
                onChange={(e) => setCustomCityName(e.target.value)}
                placeholder="Contoh: Kota Surabaya"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Catatan Cabang (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Area distribusi Jawa Timur bagian timur"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  {submitting ? 'Menyimpan...' : 'Tambah Kota Cabang'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
