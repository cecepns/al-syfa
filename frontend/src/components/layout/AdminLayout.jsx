import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Route,
  ClipboardCheck,
  BarChart3,
  BookOpenCheck,
  Store,
  Package,
  Truck,
  Sparkles,
  UserCheck,
  Users,
  Menu,
  X,
  LogOut,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Wallet,
  TrendingUp,
  Building2,
  DollarSign,
  Target
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('alsyifa_user') || '{"name":"Admin ALSYFA","role":"admin"}');
  const isOwner = user.role === 'owner';

  // Admin menu items
  const adminMenuItems = [
    { label: 'Dashboard & KPI', path: '/admin', icon: LayoutDashboard },
    { label: 'Setoran Harian Sales', path: '/admin/deposits', icon: DollarSign },
    { label: 'Target Mingguan Sales', path: '/admin/targets', icon: Target },
    { label: 'Live GPS Tracking', path: '/admin/tracking', icon: MapPin },
    { label: 'Wilayah & Rute Kerja', path: '/admin/routes', icon: Route },
    { label: 'Persetujuan Pesanan', path: '/admin/orders', icon: ClipboardCheck },
    { label: 'Tunjangan Operasional', path: '/admin/allowances', icon: Wallet },
    { label: 'Laporan & Hit Rate', path: '/admin/reports', icon: BarChart3 },
    { label: 'Sistem Pembukuan & Kas', path: '/admin/accounting', icon: BookOpenCheck },
    { label: 'Database Toko / Outlet', path: '/admin/customers', icon: Store },
    { label: 'Katalog Produk Snack', path: '/admin/products', icon: Package },
    { label: 'Stok Kendaraan (Van)', path: '/admin/van-stocks', icon: Truck },
    { label: 'Agenda Promo Bulanan', path: '/admin/promotions', icon: Sparkles },
    { label: 'Monitoring Absensi', path: '/admin/attendance', icon: UserCheck },
    { label: 'Manajemen User & Sales', path: '/admin/users', icon: Users },
  ];

  // Owner specific menu items (Sesuai Request Client)
  const ownerMenuItems = [
    { label: 'Dashboard & Modal HPP', path: '/owner', icon: LayoutDashboard },
    { label: 'Laba Cabang & Kota', path: '/owner/cabang', icon: Building2 },
    { label: 'Target Bulanan Kota', path: '/owner/target-kota', icon: Target },
    { label: 'Grafik Pertumbuhan', path: '/owner/pertumbuhan', icon: BarChart3 },
  ];

  const menuItems = isOwner ? ownerMenuItems : adminMenuItems;

  const handleLogout = () => {
    localStorage.removeItem('alsyifa_token');
    localStorage.removeItem('alsyifa_user');
    toast.success('Berhasil keluar');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-800">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg border border-slate-200/80 shrink-0 overflow-hidden">
              <img
                src="/logo-transparent.png"
                alt="Logo ALSYFA"
                className="h-full w-full object-contain filter drop-shadow-sm hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                ALSYFA Sales
              </h1>
              <p className="text-[11px] text-emerald-400 font-medium">
                {isOwner ? 'Panel Eksekutif Owner' : 'Panel Supervisor & Pusat'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 custom-scrollbar">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {isOwner ? 'Laporan Khusus Owner' : 'Manajemen Penjualan'}
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 opacity-80" />
              </Link>
            );
          })}

          {/* Quick Access to other panels for dual roles or testing */}
          {isOwner && (
            <>
              <div className="pt-4 px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Akses Operasional
              </div>
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all group"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Buka Panel Supervisor</span>
              </Link>
            </>
          )}

          <div className="pt-4 px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Mode Lapangan
          </div>
          <Link
            to="/sales"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 hover:bg-emerald-900/80 transition-colors"
          >
            <Smartphone className="h-4 w-4 text-emerald-400" />
            <span>Buka Tampilan Mobile Sales</span>
          </Link>
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate max-w-[120px]">{user.name}</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 capitalize">
                  <ShieldCheck className="h-3 w-3" /> {isOwner ? 'Owner ALSYFA' : user.role || 'Admin'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/60 rounded-lg transition-colors"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                {isOwner ? 'Eksekutif Owner' : 'Pusat Manajemen'}
              </span>
              <span className="text-xs text-slate-500 font-medium hidden md:inline-block">
                PT ALSYFA Distribusi Indonesia (Snack Coklat)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/sales"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-xs font-bold transition-colors"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Simulasi Mobile App</span>
            </Link>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2 pl-1">
              <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                {user.name?.charAt(0) || 'A'}
              </div>
              <span className="text-xs font-bold text-slate-700 hidden sm:inline-block">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
