import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Route,
  Store,
  ShoppingCart,
  Truck,
  UserCheck,
  Sparkles,
  ArrowLeft,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MobileLayout({ children, title, showBack = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('alsyifa_user') || '{"name":"Sales Lapangan","role":"sales"}');

  const navItems = [
    { label: 'Beranda', path: '/sales', icon: Home },
    { label: 'Rute Hari Ini', path: '/sales/rute', icon: Route },
    { label: 'Toko / Outlet', path: '/sales/customers', icon: Store },
    { label: 'Order Baru', path: '/sales/order', icon: ShoppingCart },
    { label: 'Stok Mobil', path: '/sales/van-stock', icon: Truck },
  ];

  const handleLogout = () => {
    localStorage.removeItem('alsyifa_token');
    localStorage.removeItem('alsyifa_user');
    toast.success('Berhasil keluar');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center selection:bg-emerald-500 selection:text-white">
      {/* Mobile Device Frame Container (max-w-md for perfect mobile-first experience) */}
      <div className="w-full max-w-md min-h-screen bg-slate-50 flex flex-col shadow-2xl relative border-x border-slate-200/60 pb-20">
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-30 bg-emerald-700 text-white shadow-md px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {showBack ? (
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-600 text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-white text-sm border border-white/20">
                A
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                {title || 'Alsyifa Sales Mobile'}
              </h1>
              <p className="text-[10px] text-emerald-200">
                {user.vehicle_number ? `${user.name} (${user.vehicle_number})` : user.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.role === 'admin' || user.role === 'supervisor' ? (
              <Link
                to="/admin"
                className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-md font-semibold transition-colors"
              >
                Ke Admin
              </Link>
            ) : null}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 overflow-y-auto">
          {children}
        </main>

        {/* Bottom Mobile Tab Bar */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 z-40 px-2 py-1.5 shadow-lg flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                  isActive ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-emerald-50 text-emerald-600' : ''}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
