import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import PWAInstallPrompt from '../components/common/PWAInstallPrompt';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

        if (res.data.user.role === 'owner') {
          navigate('/owner');
        } else if (res.data.user.role === 'admin' || res.data.user.role === 'supervisor') {
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

  return (
    <div className="min-h-screen bg-slate-100/80 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-4">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-6 sm:p-8 border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="h-24 w-24 rounded-2xl bg-white p-2 flex items-center justify-center shadow-md border border-slate-200 overflow-hidden">
                <img
                  src="/logo-transparent.png"
                  alt="Logo ALSYFA"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">ALSYFA</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Sistem Manajemen Distribusi & Penjualan Snack Coklat
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
                  placeholder="Masukkan username atau email..."
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
        </div>

        {/* PWA Install Prompt Card */}
        <PWAInstallPrompt variant="banner" />
      </div>
    </div>
  );
}
