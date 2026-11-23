import React, { useRef } from 'react';
import { Printer, Download, Share2, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import toast from 'react-hot-toast';

export default function ReceiptModal({ isOpen, onClose, order }) {
  const receiptRef = useRef(null);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const lines = [
      '================================',
      '     ALSYIFA HERBAL & SALES     ',
      '  Distribusi Produk Alami Sehat ',
      '  Telp / WA: 0812-3456-7890     ',
      '================================',
      `No Faktur: ${order.invoice_number}`,
      `Tanggal  : ${order.order_date}`,
      `Sales    : ${order.sales_name || '-'}`,
      `Pelanggan: ${order.customer_name || '-'}`,
      `Alamat   : ${order.customer_address || '-'}`,
      '--------------------------------',
      'ITEM             QTY   TOTAL',
      '--------------------------------',
      ...(order.items || []).map(
        (it) => `${it.product_name.substring(0, 16).padEnd(16)} ${String(it.qty).padStart(3)} Rp ${Number(it.total_price).toLocaleString('id-ID')}`
      ),
      '--------------------------------',
      `Subtotal : Rp ${Number(order.subtotal || 0).toLocaleString('id-ID')}`,
      ...(order.discount_amount > 0 ? [`Diskon   : -Rp ${Number(order.discount_amount).toLocaleString('id-ID')}`] : []),
      `TOTAL    : Rp ${Number(order.grand_total || 0).toLocaleString('id-ID')}`,
      `Metode   : ${(order.payment_method || 'tunai').toUpperCase()}`,
      `Bayar    : Rp ${Number(order.paid_amount || 0).toLocaleString('id-ID')}`,
      `Status   : ${(order.payment_status || 'belum_lunas').toUpperCase()}`,
      '================================',
      '  Terima kasih atas pesanan Anda ',
      '     Barang yang dibeli tidak    ',
      '    dapat ditukar/dikembalikan   ',
      '================================',
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Format struk thermal ESC/POS berhasil disalin!');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Struk Faktur Penjualan" maxWidth="max-w-md">
      <div className="flex flex-col items-center">
        {/* Printable Thermal Receipt Box */}
        <div
          ref={receiptRef}
          id="printable-receipt"
          className="w-full bg-white p-5 rounded-xl border border-dashed border-slate-300 font-mono text-xs text-slate-800 shadow-inner my-2"
          style={{ maxWidth: '320px' }}
        >
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h4 className="font-bold text-sm tracking-wide text-slate-900">ALSYIFA HERBAL SALES</h4>
            <p className="text-[10px] text-slate-500">Distribusi Produk Alami & Kesehatan</p>
            <p className="text-[10px] text-slate-500">CS / WA: 0812-3456-7890</p>
          </div>

          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">No Inv:</span>
              <span className="font-semibold text-slate-800">{order.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal:</span>
              <span>{order.order_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sales:</span>
              <span>{order.sales_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Toko:</span>
              <span className="font-semibold text-right max-w-[170px] truncate">{order.customer_name}</span>
            </div>
          </div>

          {/* Items */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-2">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="font-medium text-slate-800">{item.product_name}</span>
                <div className="flex justify-between text-slate-500">
                  <span>{item.qty} {item.unit || 'pcs'} x Rp {Number(item.price).toLocaleString('id-ID')}</span>
                  <span className="font-semibold text-slate-800">Rp {Number(item.total_price).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>Rp {Number(order.subtotal || 0).toLocaleString('id-ID')}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Diskon Promo:</span>
                <span>-Rp {Number(order.discount_amount).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
              <span>Grand Total:</span>
              <span>Rp {Number(order.grand_total || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-1">
              <span>Metode:</span>
              <span className="uppercase font-semibold">{order.payment_method}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Dibayar:</span>
              <span>Rp {Number(order.paid_amount || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Status Bayar:</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${order.payment_status === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {order.payment_status}
              </span>
            </div>
          </div>

          <div className="text-center pt-3 text-[10px] text-slate-400">
            <p>Terima kasih atas kemitraan Anda.</p>
            <p>Struk ini sah sebagai bukti transaksi mobile sales.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full gap-2 mt-4">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Salin Teks
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 px-3 text-xs font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Cetak Struk
          </button>
        </div>
      </div>
    </Modal>
  );
}
