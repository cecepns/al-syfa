import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, LogIn, Sparkles, Shield, Smartphone, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';

export default function Login() {
  const [username, setUsername] = useState('sales2');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username || !password) {
      toast.error('Masukkan username dan password');
      return;
    }

    setLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUTH.LOGIN, { username, password });
      if (res.success && res.data) {
        localStorage.setItem('alsyifa_token', res.data.token);
        localStorage.setItem('alsyifa_user', JSON.stringify(res.data.user));
        toast.success(`Selamat datang, ${res.data.user.name}!`);

        if (res.data.user.role === 'admin' || res.data.user.role === 'supervisor') {
          navigate('/admin');
        } else {
          navigate('/sales');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Login gagal, periksa kembali username/password Anda');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uname) => {
    setUsername(uname);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img
              src="/logo-transparent.png"
              alt="Logo Alsyifa Herbal"
              className="h-20 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
            />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">ALSYIFA SALES</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Sistem Manajemen Sales Lapangan & Distributor Herbal
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Username atau Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Masuk Sekarang</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Switcher */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            Pilihan Cepat Akun Demo (Password: password123)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('sales2')}
              className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                username === 'sales2'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="overflow-hidden">
                <p className="truncate font-semibold">Budi (Van 1)</p>
                <p className="text-[10px] text-slate-500">Sales Van</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('sales1')}
              className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                username === 'sales1'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Smartphone className="h-4 w-4 text-blue-600 shrink-0" />
              <div className="overflow-hidden">
                <p className="truncate font-semibold">Ahmad Fauzi</p>
                <p className="text-[10px] text-slate-500">Sales Motoris</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                username === 'admin'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Shield className="h-4 w-4 text-purple-600 shrink-0" />
              <div className="overflow-hidden">
                <p className="truncate font-semibold">Pak Cecep</p>
                <p className="text-[10px] text-slate-500">Sales Manager</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('supervisor')}
              className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                username === 'supervisor'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Shield className="h-4 w-4 text-amber-600 shrink-0" />
              <div className="overflow-hidden">
                <p className="truncate font-semibold">Hendra W.</p>
                <p className="text-[10px] text-slate-500">Supervisor</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
