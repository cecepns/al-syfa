import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Hapus',
  message = 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
  confirmText = 'Hapus Data',
  cancelText = 'Batal',
  loading = false,
  danger = true
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center p-2">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${danger ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'} mb-4`}>
          {danger ? <Trash2 className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
        </div>
        <p className="text-sm text-slate-600 mb-6">{message}</p>

        <div className="flex w-full gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50 ${
              danger
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            {loading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
