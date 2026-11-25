import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share, MoreVertical, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { getPwaState, subscribePwaState, triggerPwaInstall } from '../../utils/pwaInstall';

export default function PWAInstallPrompt({ variant = 'banner', dismissible = false }) {
  const [pwaState, setPwaState] = useState(getPwaState);
  const [guideOpen, setGuideOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (!dismissible) return false;
    return sessionStorage.getItem('alsyifa_pwa_banner_dismissed') === '1';
  });

  useEffect(() => {
    return subscribePwaState(setPwaState);
  }, []);

  if (pwaState.isInstalled || (dismissible && dismissed)) {
    return null;
  }

  const handleInstallClick = async () => {
    if (pwaState.canPrompt) {
      const res = await triggerPwaInstall();
      if (res?.outcome === 'accepted') {
        toast.success('Aplikasi ALSYFA berhasil diinstall!');
      }
    } else {
      setGuideOpen(true);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('alsyifa_pwa_banner_dismissed', '1');
    setDismissed(true);
  };

  const guideModal = (
    <Modal
      isOpen={guideOpen}
      onClose={() => setGuideOpen(false)}
      title="Install Aplikasi ALSYFA"
    >
      <div className="space-y-4 text-xs">
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="h-14 w-14 rounded-2xl bg-white p-1.5 border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
            <img
              src="/pwa-192x192.png"
              alt="Logo ALSYFA"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-sm">ALSYFA</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tambahkan ke layar utama HP atau desktop untuk akses cepat tanpa buka browser.
            </p>
          </div>
        </div>

        {pwaState.isIos ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-2 text-blue-950">
            <p className="font-bold flex items-center gap-1.5">
              <Share className="h-4 w-4 text-blue-600" /> Panduan iPhone / iPad (Safari):
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-900">
              <li>Ketuk ikon <strong>Bagikan (Share)</strong> di bagian bawah layar Safari.</li>
              <li>Gulir ke bawah lalu pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</li>
              <li>Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.</li>
            </ol>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2 text-emerald-950">
            <p className="font-bold flex items-center gap-1.5">
              <MoreVertical className="h-4 w-4 text-emerald-600" /> Panduan Chrome / Android / Desktop:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-900">
              <li>Ketuk menu browser (ikon titik tiga <strong>⋮</strong> di kanan atas).</li>
              <li>Pilih <strong>Install aplikasi</strong> atau <strong>Tambahkan ke Layar Utama</strong>.</li>
              <li>Konfirmasi dengan menekan <strong>Install</strong>.</li>
            </ol>
          </div>
        )}

        <button
          type="button"
          onClick={() => setGuideOpen(false)}
          className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
        >
          Mengerti
        </button>
      </div>
    </Modal>
  );

  if (variant === 'button') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors"
          title="Install Aplikasi ALSYFA ke Perangkat"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Install ALSYFA</span>
        </button>
        {guideModal}
      </>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-emerald-200/90 p-3.5 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-xl bg-white p-1 border border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/pwa-192x192.png"
              alt="ALSYFA"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1 truncate">
              <Smartphone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Install Aplikasi ALSYFA</span>
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              Pasang di HP / Desktop untuk akses cepat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-200 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install</span>
          </button>

          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              title="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {guideModal}
    </>
  );
}
