import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Package,
  Building2,
  BarChart3,
  Shield,
  RefreshCw,
  Sparkles,
  Edit3,
  Download,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  Coins,
  ChevronRight,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function OwnerDashboard() {
  const user = JSON.parse(localStorage.getItem('alsyifa_user') || '{"name":"Owner ALSYFA","role":"owner"}');

  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);

  // Search & filter for products table
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal State: Edit HPP & Harga Jual Product
  const [isHppModalOpen, setIsHppModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [updateOrdersHpp, setUpdateOrdersHpp] = useState(false);
  const [savingHpp, setSavingHpp] = useState(false);

  // Modal State: Edit Cash Capital
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [savingCash, setSavingCash] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, productsRes] = await Promise.all([
        request.get(API_ENDPOINTS.OWNER.ANALYTICS),
        request.get(API_ENDPOINTS.OWNER.PRODUCTS)
      ]);
      setAnalytics(analyticsRes.data);
      setProducts(productsRes.data || []);
    } catch (err) {
      toast.error(err.message || 'Gagal memuat analitik keuangan Owner');
    } finally {
      setLoading(false);
    }
  };

  const capital = analytics?.capital || {};
  const financials = analytics?.global_profit || {};

  // Categories list
  const categories = useMemo(() => {
    const setCat = new Set(products.map((p) => p.category).filter(Boolean));
    return ['ALL', ...Array.from(setCat)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.code.toLowerCase().includes(searchProduct.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchProduct, selectedCategory]);

  // Total calculated product capital value
  const totalProductsCapitalValue = products.reduce((sum, p) => sum + Number(p.total_capital_value || 0), 0);

  // Open Edit HPP Modal
  const handleOpenEditHpp = (product) => {
    setSelectedProduct(product);
    setNewCostPrice(product.cost_price || 0);
    setNewSellingPrice(product.price || 0);
    setUpdateOrdersHpp(false);
    setIsHppModalOpen(true);
  };

  // Submit Edit HPP Modal
  const handleSaveHpp = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (newCostPrice === '' || isNaN(newCostPrice) || Number(newCostPrice) < 0) {
      toast.error('Masukkan nominal HPP / Modal yang valid');
      return;
    }

    setSavingHpp(true);
    try {
      await request.put(API_ENDPOINTS.OWNER.UPDATE_PRICING(selectedProduct.id), {
        cost_price: Number(newCostPrice),
        price: Number(newSellingPrice),
        update_orders: updateOrdersHpp
      });
      toast.success(`HPP & Harga Jual untuk ${selectedProduct.name} berhasil diperbarui!`);
      setIsHppModalOpen(false);
      // Refresh data
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui HPP & Harga Jual produk');
    } finally {
      setSavingHpp(false);
    }
  };

  // Open Edit Cash Modal
  const handleOpenEditCash = () => {
    setCashAmount(capital.additional_cash_capital || 0);
    setIsCashModalOpen(true);
  };

  // Submit Edit Cash Modal
  const handleSaveCash = async (e) => {
    e.preventDefault();
    if (cashAmount === '' || isNaN(cashAmount) || Number(cashAmount) < 0) {
      toast.error('Masukkan nominal modal kas yang valid');
      return;
    }

    setSavingCash(true);
    try {
      await request.post(API_ENDPOINTS.OWNER.UPDATE_CASH_CAPITAL, {
        amount: Number(cashAmount)
      });
      toast.success('Modal kas / cadangan operasional berhasil disimpan!');
      setIsCashModalOpen(false);
      // Refresh data
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui modal kas');
    } finally {
      setSavingCash(false);
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (products.length === 0) {
      toast.error('Tidak ada data produk untuk diunduh');
      return;
    }

    const headers = [
      'No',
      'Kode Produk',
      'Nama Produk',
      'Kategori',
      'Stok Gudang',
      'Stok Kendaraan',
      'Total Stok',
      'Harga Modal / HPP (Rp)',
      'Harga Jual (Rp)',
      'Margin Per Unit (Rp)',
      'Margin (%)',
      'Total Nilai Modal Produk (Rp)'
    ];

    const rows = products.map((p, idx) => {
      return [
        idx + 1,
        `"${p.code}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category || '-'}"`,
        p.warehouse_stock,
        p.van_stock,
        p.total_stock,
        Number(p.cost_price || 0),
        Number(p.price || 0),
        Number(p.unit_margin || 0),
        `"${p.margin_percent}%"`,
        Number(p.total_capital_value || 0)
      ].join(',');
    });

    // Summary row
    rows.push([
      'TOTAL',
      '-',
      '"SEMUA PRODUK ALSYFA"',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      totalProductsCapitalValue
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Modal_HPP_ALSYFA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Laporan Modal & HPP berhasil diunduh (CSV)');
  };

  return (
    <AdminLayout>
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Dashboard Eksekutif & Penentuan Modal / HPP
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Shield className="h-3 w-3" /> Panel Khusus Owner
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kendali penuh penetapan modal produk (HPP), modal cadangan kas, laba kotor & bersih global ALSYFA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            title="Segarkan Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-sm shadow-emerald-200 transition-all"
            title="Download CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-sm transition-all"
            title="Cetak Ringkasan"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </div>

      {/* Welcome Greeting Banner (Clean Light) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" /> Ikhtisar Eksekutif Perusahaan ALSYFA
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-800">
            Selamat Datang, {user.name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Anda memiliki wewenang untuk <strong>mengubah dan menetapkan harga modal (HPP)</strong> produk, mengalokasikan modal kas cadangan, serta mengontrol efisiensi margin keuntungan bisnis.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-emerald-800 uppercase font-bold block">Status Margin Bersih</span>
            <span className="text-xl font-black text-emerald-700 font-mono">
              +{financials.net_margin_percent || 0}%
            </span>
          </div>
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 4 Core Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Modal Keseluruhan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Modal (Kapital)
              </span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 font-mono tracking-tight">
              Rp {Number(capital.grand_total_capital || 0).toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Stok Gudang (HPP):</span>
              <span className="text-slate-800 font-semibold font-mono">
                Rp {Number(capital.warehouse_inventory || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Stok di Kendaraan:</span>
              <span className="text-slate-800 font-semibold font-mono">
                Rp {Number(capital.van_inventory || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Beban Tunjangan:</span>
              <span className="text-slate-800 font-semibold font-mono">
                Rp {Number(capital.total_allowance_capital || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 pt-1 border-t border-dashed border-slate-200">
              <span>Modal Kas / Cadangan:</span>
              <span className="text-emerald-700 font-bold font-mono">
                Rp {Number(capital.additional_cash_capital || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
          <button
            onClick={handleOpenEditCash}
            className="mt-3 w-full py-1.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Coins className="h-3.5 w-3.5" />
            <span>Atur Modal Kas Usaha</span>
          </button>
        </div>

        {/* Card 2: Total Omzet Penjualan (Revenue) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Omzet Penjualan
              </span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 font-mono tracking-tight">
              Rp {Number(financials.total_revenue || 0).toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Total Pesanan Masuk:</span>
              <span className="text-slate-800 font-semibold font-mono">
                {financials.total_orders || 0} Faktur
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total Modal HPP Terjual:</span>
              <span className="text-slate-800 font-semibold font-mono">
                Rp {Number(financials.total_cogs || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Gross Margin (%):</span>
              <span className="text-blue-600 font-bold">
                {financials.gross_margin_percent || 0}%
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 text-[10px] text-slate-400 text-center">
            Perhitungan omzet dari seluruh transaksi sales
          </div>
        </div>

        {/* Card 3: Laba Kotor Global */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Laba Kotor (Gross Profit)
              </span>
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <PieChart className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-teal-700 font-mono tracking-tight">
              Rp {Number(financials.gross_profit || 0).toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Selisih Omzet Penjualan dikurangi Modal HPP Produk
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Gross Margin:</span>
            <span className="font-bold text-teal-700">
              {financials.gross_margin_percent || 0}%
            </span>
          </div>
          <div className="mt-3 pt-2 text-[10px] text-slate-400 text-center">
            Otomatis terbarui saat HPP produk disesuaikan
          </div>
        </div>

        {/* Card 4: Laba Bersih Global */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-white p-5 rounded-2xl border border-emerald-300 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Laba Bersih (Net Profit)
              </span>
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              Rp {Number(financials.net_profit || 0).toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-emerald-700/80 mt-1">
              Laba Bersih setelah beban Tunjangan Operasional (BBM + Sewa Motor)
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Net Profit Margin:</span>
            <span className="font-extrabold text-emerald-700 font-mono text-sm">
              +{financials.net_margin_percent || 0}%
            </span>
          </div>
          <div className="mt-3 pt-2 text-[10px] text-emerald-800/60 text-center font-medium">
            Keuntungan bersih realisasi perusahaan
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards to Separate Detail Pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Link
          to="/owner/cabang"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                Buka Laporan Lengkap Tiap Cabang (Kota)
                <ChevronRight className="h-4 w-4" />
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Lihat rincian omzet, modal, dan laba per wilayah kota & unduh laporan CSV/Cetak.
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/owner/pertumbuhan"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 group-hover:text-purple-600 transition-colors flex items-center gap-1.5">
                Buka Grafik Pertumbuhan & Tren Bisnis
                <ChevronRight className="h-4 w-4" />
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualisasi tren bulanan & tahunan (Omzet vs Modal vs Laba) & unduh laporan.
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* CORE FEATURE: Penentuan & Manajemen Modal / HPP Produk ALSYFA */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Edit3 className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Penentuan & Manajemen Modal / HPP Produk ALSYFA
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik <strong>"Ubah HPP / Modal"</strong> pada produk mana saja untuk menentukan nilai modal pokok. Perubahan HPP otomatis memperbarui perhitungan laba kotor & modal aktif.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                placeholder="Cari produk / kode..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all font-medium"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none font-medium"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'Semua Kategori' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5">Kode & Nama Produk</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5 text-center">Stok Gudang</th>
                <th className="px-4 py-3.5 text-center">Stok Van</th>
                <th className="px-4 py-3.5 text-center">Total Stok</th>
                <th className="px-4 py-3.5 text-right bg-amber-50/50 text-amber-900 border-x border-amber-100">
                  Modal Pokok (HPP)
                </th>
                <th className="px-4 py-3.5 text-right">Harga Jual</th>
                <th className="px-4 py-3.5 text-right">Total Nilai Modal</th>
                <th className="px-4 py-3.5 text-center">Aksi Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p, idx) => {
                  const hpp = Number(p.cost_price || 0);
                  const price = Number(p.price || 0);
                  const totalStock = Number(p.total_stock || 0);
                  const capitalValue = Number(p.total_capital_value || (totalStock * hpp));

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div>
                          <span className="font-mono text-[10px] text-slate-400 block font-semibold">
                            {p.code}
                          </span>
                          <strong className="text-slate-800 font-bold block text-xs">
                            {p.name}
                          </strong>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {p.category || 'SNACK COKLAT'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-600">
                        {p.warehouse_stock} {p.unit}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-600">
                        {p.van_stock} {p.unit}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                        {totalStock} {p.unit}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-extrabold text-amber-700 bg-amber-50/40 border-x border-amber-100">
                        Rp {hpp.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-800">
                        Rp {price.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                        Rp {capitalValue.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleOpenEditHpp(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-sm shadow-amber-200 transition-all"
                          title="Ubah Modal / HPP Produk"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Ubah HPP</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada produk yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
            {/* Footer Total */}
            {filteredProducts.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-800">
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-right">
                    TOTAL ESTIMASI NILAI MODAL INVENTARIS BARANG:
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-amber-800 font-black text-sm">
                    Rp {totalProductsCapitalValue.toLocaleString('id-ID')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL 1: UBAH HPP / MODAL PRODUK */}
      <Modal
        isOpen={isHppModalOpen}
        onClose={() => setIsHppModalOpen(false)}
        title="Ubah Nilai Modal / HPP Produk"
      >
        {selectedProduct && (
          <form onSubmit={handleSaveHpp} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="h-4 w-4 text-amber-600" />
                <span>Ketentuan Penentuan Modal / HPP Produk</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Mengubah Harga Pokok Produk (HPP) akan mempengaruhi nilai modal stok barang aktif dan margin laba penjualan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Kode & Produk</span>
                <strong className="text-slate-800 block truncate font-mono">{selectedProduct.code}</strong>
                <span className="text-slate-700 block truncate">{selectedProduct.name}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Harga Jual Saat Ini</span>
                <strong className="text-slate-800 block font-mono text-sm">
                  Rp {Number(selectedProduct.price || 0).toLocaleString('id-ID')}
                </strong>
                <span className="text-slate-500 text-[10px]">Per {selectedProduct.unit}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Harga Jual Produk (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(e.target.value)}
                    placeholder="Contoh: 15000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Terhubung langsung ke Admin & Sales</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Harga Modal (HPP) (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                    placeholder="Contoh: 7000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono font-bold text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Modal dasar produk Owner</span>
              </div>
            </div>

            {/* Preview Margin Baru */}
            {Number(newCostPrice) > 0 && Number(newSellingPrice) > 0 && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                <span>Estimasi Margin Laba Per Unit:</span>
                <span className="font-extrabold text-emerald-700 font-mono">
                  Rp {(Number(newSellingPrice) - Number(newCostPrice)).toLocaleString('id-ID')} (
                  {(((Number(newSellingPrice) - Number(newCostPrice)) / Number(newSellingPrice)) * 100).toFixed(1)}%)
                </span>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateOrdersHpp}
                  onChange={(e) => setUpdateOrdersHpp(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 mt-0.5"
                />
                <span className="text-xs text-slate-700">
                  <strong>Sinkronkan ke Riwayat Transaksi:</strong> Perbarui juga nilai HPP pada transaksi order yang sudah tercatat agar margin laba historis otomatis tersinkronisasi.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsHppModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingHpp}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-200 transition-all disabled:opacity-50"
              >
                {savingHpp ? 'Menyimpan HPP...' : 'Simpan HPP Baru'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 2: ATUR MODAL KAS / CADANGAN USAHA */}
      <Modal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        title="Atur Modal Kas / Cadangan Operasional"
      >
        <form onSubmit={handleSaveCash} className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Coins className="h-4 w-4 text-emerald-600" />
              <span>Modal Kas & Likuiditas Usaha</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-800">
              Modal kas adalah modal tunai / cadangan likuid yang disuntikkan Owner untuk keperluan operasional perusahaan di luar modal stok barang.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nominal Modal Kas Tambahan (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="100000"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="Contoh: 25000000"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Saat ini: Rp {Number(capital.additional_cash_capital || 0).toLocaleString('id-ID')}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCashModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingCash}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all disabled:opacity-50"
            >
              {savingCash ? 'Menyimpan...' : 'Simpan Modal Kas'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
