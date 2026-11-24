import React, { useRef, useState } from 'react';
import { Printer, Download, Share2, CheckCircle2, FileText, Smartphone, Copy } from 'lucide-react';
import Modal from './Modal';
import toast from 'react-hot-toast';

export default function ReceiptModal({ isOpen, onClose, order }) {
  const receiptRef = useRef(null);
  const [printFormat, setPrintFormat] = useState('58mm'); // '58mm', '80mm', 'f4'

  if (!order) return null;

  const handlePrint = () => {
    // Generate specialized print stylesheet for selected format
    const printArea = receiptRef.current;
    if (!printArea) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const isF4 = printFormat === 'f4';
    const is80mm = printFormat === '80mm';
    const paperWidth = isF4 ? '210mm' : is80mm ? '80mm' : '58mm';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Nota - ${order.invoice_number}</title>
          <style>
            @page {
              size: ${paperWidth} auto;
              margin: ${isF4 ? '15mm' : '2mm'};
            }
            body {
              font-family: ${isF4 ? "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" : "'Courier New', Courier, monospace"};
              font-size: ${isF4 ? '12px' : is80mm ? '12px' : '10px'};
              color: #000;
              margin: 0;
              padding: ${isF4 ? '10px' : '4px'};
              background: #fff;
              line-height: 1.3;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-b { border-bottom: 1px dashed #000; }
            .border-double { border-bottom: 2px solid #000; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 3px 0; }
            .f4-table th, .f4-table td {
              border: 1px solid #333;
              padding: 6px 8px;
            }
            .f4-table th { background: #f0f0f0; }
            .signatures {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              text-align: center;
            }
            .sign-box {
              width: 150px;
              display: inline-block;
            }
          </style>
        </head>
        <body>
          ${printArea.innerHTML}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(() => { window.close(); }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyRawPosText = () => {
    const is80 = printFormat === '80mm';
    const divider = is80 ? '================================================' : '================================';
    const subdivider = is80 ? '------------------------------------------------' : '--------------------------------';
    const lineLen = is80 ? 48 : 32;

    const lines = [
      divider,
      '               ALSYFA SNACK COKLAT              '.substring(0, lineLen),
      '        Distribusi Snack & Coklat Pilihan       '.substring(0, lineLen),
      '             Telp/WA: 0812-3456-7890            '.substring(0, lineLen),
      divider,
      `No Faktur : ${order.invoice_number}`,
      `Tanggal   : ${order.order_date?.substring(0, 10)}`,
      `Sales     : ${order.sales_name || '-'}`,
      `Pelanggan : ${order.customer_name || '-'}`,
      `Alamat    : ${order.customer_address || '-'}`,
      subdivider,
      is80 ? 'PRODUK                          QTY  HARGA       TOTAL' : 'ITEM             QTY   TOTAL',
      subdivider,
      ...(order.items || []).map((it) => {
        if (is80) {
          const name = it.product_name.substring(0, 30).padEnd(30);
          const qty = String(it.qty).padStart(4);
          const price = Number(it.price).toLocaleString('id-ID').padStart(10);
          const total = Number(it.total_price).toLocaleString('id-ID').padStart(12);
          return `${name} ${qty} ${price} ${total}`;
        }
        const name = it.product_name.substring(0, 16).padEnd(16);
        const qty = String(it.qty).padStart(3);
        const total = Number(it.total_price).toLocaleString('id-ID');
        return `${name} ${qty} Rp ${total}`;
      }),
      subdivider,
      `Subtotal  : Rp ${Number(order.subtotal || 0).toLocaleString('id-ID')}`,
      ...(order.discount_amount > 0 ? [`Diskon    : -Rp ${Number(order.discount_amount).toLocaleString('id-ID')}`] : []),
      `TOTAL     : Rp ${Number(order.grand_total || 0).toLocaleString('id-ID')}`,
      `Metode    : ${(order.payment_method || 'tunai').toUpperCase()}`,
      `Dibayar   : Rp ${Number(order.paid_amount || 0).toLocaleString('id-ID')}`,
      `Sisa      : Rp ${Number(order.remaining_balance || 0).toLocaleString('id-ID')}`,
      `Status    : ${(order.payment_status || 'belum_lunas').toUpperCase()}`,
      divider,
      '         Terima kasih atas pesanan Anda         '.substring(0, lineLen),
      '     Barang yang dibeli tidak dapat ditukar     '.substring(0, lineLen),
      divider,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Format struk ESC/POS siap cetak Bluetooth (RawBT)!');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cetak Faktur & Struk Penjualan"
      maxWidth={printFormat === 'f4' ? 'max-w-2xl' : 'max-w-md'}
    >
      <div className="flex flex-col items-center">
        {/* Format Selector Pills */}
        <div className="w-full bg-slate-100 p-1.5 rounded-2xl flex gap-1 mb-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => setPrintFormat('58mm')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all text-center flex items-center justify-center gap-1 ${
              printFormat === '58mm'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" /> Thermal 58mm
          </button>
          <button
            type="button"
            onClick={() => setPrintFormat('80mm')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all text-center flex items-center justify-center gap-1 ${
              printFormat === '80mm'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="h-3.5 w-3.5" /> Thermal 80mm
          </button>
          <button
            type="button"
            onClick={() => setPrintFormat('f4')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all text-center flex items-center justify-center gap-1 ${
              printFormat === 'f4'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> Faktur F4 / Standar
          </button>
        </div>

        {/* Printable Area */}
        <div className="w-full flex justify-center max-h-[60vh] overflow-y-auto py-2">
          {printFormat === 'f4' ? (
            /* F4 / A4 Formal Invoice Preview */
            <div
              ref={receiptRef}
              className="w-full bg-white p-6 rounded-xl border border-slate-300 text-slate-800 text-xs shadow-sm font-sans"
            >
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">ALSYFA</h3>
                  <p className="text-xs font-bold text-emerald-700">DISTRIBUTOR RESMI SNACK COKLAT</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Jl. Raya Distribusi No. 88, Cibinong, Bogor • Telp/WA: 0812-3456-7890
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase tracking-wider font-extrabold bg-slate-100 px-3 py-1 rounded-lg">
                    FAKTUR PENJUALAN
                  </span>
                  <p className="text-sm font-bold text-slate-900 font-mono mt-1">
                    {order.invoice_number}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Tgl: {order.order_date?.substring(0, 10)}
                  </p>
                </div>
              </div>

              {/* Customer & Sales Information */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Kepada Toko:</span>
                  <p className="font-extrabold text-slate-900">{order.customer_name}</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">{order.customer_address || '-'}</p>
                  <p className="text-slate-600 text-[11px]">Telp: {order.customer_phone || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Petugas Sales:</span>
                  <p className="font-extrabold text-slate-900">{order.sales_name || '-'}</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">Metode Bayar: {order.payment_method?.toUpperCase()}</p>
                  <p className="text-slate-600 text-[11px]">
                    Status: <span className="font-bold text-emerald-700 uppercase">{order.payment_status}</span>
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs border-collapse mb-4 f4-table">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold">
                    <th className="border border-slate-300 p-2 text-center w-8">No</th>
                    <th className="border border-slate-300 p-2 text-left">Nama Produk Snack</th>
                    <th className="border border-slate-300 p-2 text-center w-16">Qty</th>
                    <th className="border border-slate-300 p-2 text-right w-24">Harga (Rp)</th>
                    <th className="border border-slate-300 p-2 text-right w-28">Total (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((it, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 font-medium">{it.product_name}</td>
                      <td className="border border-slate-300 p-2 text-center">{it.qty} {it.unit || 'pcs'}</td>
                      <td className="border border-slate-300 p-2 text-right">{Number(it.price).toLocaleString('id-ID')}</td>
                      <td className="border border-slate-300 p-2 text-right font-bold">{Number(it.total_price).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="border border-slate-300 p-2 text-right font-bold">Subtotal</td>
                    <td className="border border-slate-300 p-2 text-right font-bold">Rp {Number(order.subtotal || 0).toLocaleString('id-ID')}</td>
                  </tr>
                  {order.discount_amount > 0 && (
                    <tr>
                      <td colSpan={4} className="border border-slate-300 p-2 text-right text-emerald-700 font-bold">Diskon Promo</td>
                      <td className="border border-slate-300 p-2 text-right text-emerald-700 font-bold">-Rp {Number(order.discount_amount).toLocaleString('id-ID')}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 font-black text-sm">
                    <td colSpan={4} className="border border-slate-300 p-2 text-right">TOTAL TAGIHAN</td>
                    <td className="border border-slate-300 p-2 text-right text-emerald-800">Rp {Number(order.grand_total || 0).toLocaleString('id-ID')}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures */}
              <div className="signatures pt-6 flex justify-between text-center text-xs mt-6">
                <div className="sign-box">
                  <p className="text-slate-500 mb-14">Tanda Terima Toko / Outlet,</p>
                  <p className="font-bold text-slate-800 border-t border-slate-400 pt-1">
                    ( {order.customer_name} )
                  </p>
                </div>
                <div className="sign-box">
                  <p className="text-slate-500 mb-14">Hormat Kami (Sales ALSYFA),</p>
                  <p className="font-bold text-slate-800 border-t border-slate-400 pt-1">
                    ( {order.sales_name || 'Petugas Sales'} )
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Thermal Receipt Preview (58mm or 80mm) */
            <div
              ref={receiptRef}
              className={`w-full bg-white p-4 rounded-xl border border-dashed border-slate-400 font-mono text-slate-900 shadow-inner ${
                printFormat === '80mm' ? 'max-w-sm text-xs' : 'max-w-[280px] text-[11px]'
              }`}
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <h4 className="font-extrabold text-sm tracking-wide text-slate-900">ALSYFA</h4>
                <p className="text-[10px] font-bold text-slate-600">PRODUK SNACK COKLAT</p>
                <p className="text-[9px] text-slate-500">CS / WA: 0812-3456-7890</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">No Inv:</span>
                  <span className="font-bold">{order.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tgl:</span>
                  <span>{order.order_date?.substring(0, 10)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sales:</span>
                  <span>{order.sales_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Toko:</span>
                  <span className="font-bold truncate max-w-[140px] text-right">{order.customer_name}</span>
                </div>
              </div>

              {/* Items */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-1.5">
                {(order.items || []).map((item, idx) => (
                  <div key={idx}>
                    <p className="font-semibold text-slate-900 truncate">{item.product_name}</p>
                    <div className="flex justify-between text-slate-600">
                      <span>{item.qty} {item.unit || 'pcs'} x {Number(item.price).toLocaleString('id-ID')}</span>
                      <span className="font-bold text-slate-900">Rp {Number(item.total_price).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>Rp {Number(order.subtotal || 0).toLocaleString('id-ID')}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Diskon:</span>
                    <span>-Rp {Number(order.discount_amount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-slate-900 pt-1 text-xs">
                  <span>TOTAL:</span>
                  <span>Rp {Number(order.grand_total || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-0.5">
                  <span>Metode:</span>
                  <span className="uppercase">{order.payment_method}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Bayar:</span>
                  <span>Rp {Number(order.paid_amount || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Status:</span>
                  <span className={`uppercase ${order.payment_status === 'lunas' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {order.payment_status}
                  </span>
                </div>
              </div>

              <div className="text-center pt-2 text-[9px] text-slate-500">
                <p>Terima kasih atas pesanan Anda.</p>
                <p>Struk ini sah sebagai bukti transaksi ALSYFA.</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex w-full gap-2 mt-4">
          <button
            type="button"
            onClick={handleCopyRawPosText}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Copy className="h-4 w-4" />
            Salin Bluetooth POS
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 px-3 text-xs font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Cetak Nota ({printFormat.toUpperCase()})
          </button>
        </div>
      </div>
    </Modal>
  );
}
