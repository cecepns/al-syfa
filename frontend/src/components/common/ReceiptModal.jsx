import React, { useRef, useState, useEffect } from 'react';
import {
  Printer,
  Download,
  Share2,
  CheckCircle2,
  FileText,
  Smartphone,
  Copy,
  Bluetooth,
  RefreshCw,
  Unlink,
  Wifi,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import Modal from './Modal';
import toast from 'react-hot-toast';
import {
  isWebBluetoothSupported,
  getBluetoothPrinterState,
  scanAndConnectBluetoothPrinter,
  disconnectBluetoothPrinter,
  buildEscPosBytes,
  sendEscPosToBluetoothPrinter,
  openRawBtAppPrint
} from '../../utils/bluetoothPrinter';

export default function ReceiptModal({ isOpen, onClose, order }) {
  const receiptRef = useRef(null);
  const [printFormat, setPrintFormat] = useState('58mm'); // '58mm', '80mm', 'f4'

  // Bluetooth Printer States
  const [btState, setBtState] = useState(getBluetoothPrinterState());
  const [isScanning, setIsScanning] = useState(false);
  const [isPrintingBt, setIsPrintingBt] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBtState(getBluetoothPrinterState());
    }
  }, [isOpen]);

  if (!order) return null;

  // Scan & Connect Bluetooth Thermal Printer
  const handleScanBluetooth = async () => {
    setIsScanning(true);
    try {
      const res = await scanAndConnectBluetoothPrinter();
      setBtState(getBluetoothPrinterState());
      toast.success(`Printer Bluetooth "${res.deviceName}" berhasil terhubung!`);
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        toast.error(err.message || 'Gagal memindai atau menghubungkan printer bluetooth');
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Disconnect Bluetooth Thermal Printer
  const handleDisconnectBluetooth = () => {
    disconnectBluetoothPrinter();
    setBtState(getBluetoothPrinterState());
    toast.success('Koneksi printer bluetooth telah diputus');
  };

  // Direct Bluetooth Print via Web Bluetooth (ESC/POS)
  const handlePrintBluetoothDirect = async () => {
    // If not connected yet, try scanning first
    if (!btState.isConnected) {
      try {
        toast('Silakan pilih printer bluetooth thermal Anda...', { icon: '🔍' });
        const res = await scanAndConnectBluetoothPrinter();
        setBtState(getBluetoothPrinterState());
        toast.success(`Printer "${res.deviceName}" terhubung! Memulai mencetak...`);
      } catch (err) {
        if (err.name !== 'NotFoundError') {
          toast.error(err.message || 'Koneksi printer dibatalkan');
        }
        return;
      }
    }

    setIsPrintingBt(true);
    try {
      const bytes = buildEscPosBytes(order, printFormat);
      await sendEscPosToBluetoothPrinter(bytes);
      toast.success(`Struk ${order.invoice_number} berhasil dicetak via Bluetooth!`);
    } catch (err) {
      toast.error(err.message || 'Gagal mengirim data cetak ke printer bluetooth');
    } finally {
      setIsPrintingBt(false);
    }
  };

  // Print via RawBT Android App
  const handlePrintRawBt = () => {
    try {
      openRawBtAppPrint(order, printFormat);
      toast.success('Membuka aplikasi pencetak Bluetooth (RawBT)...');
    } catch (err) {
      toast.error('Gagal membuka aplikasi pencetak');
    }
  };

  // Browser / Window Print (Standard USB / PDF / System Print)
  const handlePrint = () => {
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

  // Copy Raw ESC/POS text
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
      `Metode    : ${(order.payment_method || '-').toUpperCase()}`,
      `Bayar     : Rp ${Number(order.paid_amount || 0).toLocaleString('id-ID')}`,
      `Status    : ${(order.payment_status || '-').toUpperCase()}`,
      divider,
      '       Terima kasih atas pesanan Anda!          '.substring(0, lineLen),
      '       Struk resmi ALSYFA Snack Coklat          '.substring(0, lineLen),
      divider,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Format teks cetak Bluetooth berhasil disalin ke clipboard');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cetak Bukti Transaksi & Struk">
      <div className="flex flex-col items-center max-w-lg mx-auto">
        {/* BLUETOOTH THERMAL PRINTER SCANNER BAR */}
        <div className="w-full bg-slate-900 text-white rounded-2xl p-3.5 mb-4 shadow-sm border border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl flex items-center justify-center ${btState.isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                <Bluetooth className={`h-5 w-5 ${isScanning ? 'animate-pulse text-amber-400' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">Printer Bluetooth Thermal</h4>
                  {btState.isConnected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Terhubung
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      Belum Terhubung
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                  {btState.isConnected ? btState.deviceName : 'Scan printer Bluetooth POS 58mm / 80mm'}
                </p>
              </div>
            </div>

            {/* Bluetooth Connect / Disconnect Buttons */}
            <div className="flex items-center gap-1.5">
              {btState.isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnectBluetooth}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 text-[11px] font-bold border border-slate-700 hover:border-red-800 transition-colors flex items-center gap-1"
                  title="Putus Koneksi Printer"
                >
                  <Unlink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Putus</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleScanBluetooth}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                  title="Pindai & Hubungkan Printer Bluetooth"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Memindai...' : 'Scan Bluetooth'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Paper Size Format Selector */}
        <div className="w-full flex items-center justify-center gap-1.5 bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setPrintFormat('58mm')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
              printFormat === '58mm'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Thermal 58mm
          </button>
          <button
            type="button"
            onClick={() => setPrintFormat('80mm')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
              printFormat === '80mm'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Thermal 80mm
          </button>
          <button
            type="button"
            onClick={() => setPrintFormat('f4')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
              printFormat === 'f4'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Faktur F4
          </button>
        </div>

        {/* Printable Preview Container */}
        <div className="w-full max-h-[380px] overflow-y-auto border border-slate-200 rounded-2xl p-4 bg-slate-50 flex justify-center custom-scrollbar">
          {printFormat === 'f4' ? (
            /* F4 Official Invoice Format */
            <div
              ref={receiptRef}
              className="bg-white p-6 shadow-sm border border-slate-200 w-full text-slate-800 text-xs font-sans space-y-4"
              style={{ minWidth: '400px' }}
            >
              {/* Header Invoice F4 */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 p-1 flex items-center justify-center">
                    <img src="/logo-transparent.png" alt="ALSYFA" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 tracking-tight">ALSYFA SNACK COKLAT</h3>
                    <p className="text-[11px] text-slate-600">PT ALSYFA DISTRIBUSI INDONESIA</p>
                    <p className="text-[10px] text-slate-500">Jl. Raya Sukaraja Cibinong Bogor • WA: 0812-3456-7890</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white font-extrabold text-xs tracking-wider uppercase rounded">
                    FAKTUR PENJUALAN
                  </span>
                  <p className="font-mono font-bold text-xs mt-1 text-slate-800">{order.invoice_number}</p>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs py-1">
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <span className="w-24 text-slate-500">Tanggal Faktur:</span>
                    <span className="font-semibold">{order.order_date?.substring(0, 10)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-24 text-slate-500">Sales Pembina:</span>
                    <span className="font-semibold">{order.sales_name || '-'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-24 text-slate-500">Metode Bayar:</span>
                    <span className="font-bold uppercase text-emerald-700">{order.payment_method}</span>
                  </div>
                </div>
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Toko / Pelanggan:</span>
                  <strong className="block text-slate-900 text-xs">{order.customer_name}</strong>
                  <p className="text-[11px] text-slate-600 leading-tight">{order.customer_address || '-'}</p>
                  <p className="text-[10px] text-slate-500">Telp: {order.customer_phone || '-'}</p>
                </div>
              </div>

              {/* Items Table F4 */}
              <table className="f4-table w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 text-center w-8">No</th>
                    <th className="p-2">Nama Produk Snack Coklat</th>
                    <th className="p-2 text-center w-16">Satuan</th>
                    <th className="p-2 text-center w-12">Qty</th>
                    <th className="p-2 text-right w-24">Harga (Rp)</th>
                    <th className="p-2 text-right w-28">Total (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(order.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-center">{idx + 1}</td>
                      <td className="p-2 font-medium">{it.product_name}</td>
                      <td className="p-2 text-center">{it.unit || 'pcs'}</td>
                      <td className="p-2 text-center font-bold">{it.qty}</td>
                      <td className="p-2 text-right font-mono">{Number(it.price).toLocaleString('id-ID')}</td>
                      <td className="p-2 text-right font-mono font-bold">{Number(it.total_price).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals F4 */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Subtotal Pesanan:</span>
                    <span className="font-mono font-semibold">Rp {Number(order.subtotal || 0).toLocaleString('id-ID')}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between py-1 text-emerald-700 border-b border-slate-100 font-medium">
                      <span>Potongan Diskon Promo:</span>
                      <span className="font-mono">-Rp {Number(order.discount_amount).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 text-sm font-extrabold text-slate-900 border-b-2 border-slate-900">
                    <span>TOTAL TAGIHAN:</span>
                    <span className="font-mono">Rp {Number(order.grand_total || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Jumlah Terbayar:</span>
                    <span className="font-mono font-bold">Rp {Number(order.paid_amount || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold">
                    <span>Status Transaksi:</span>
                    <span className={`uppercase font-extrabold ${order.payment_status === 'lunas' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures F4 */}
              <div className="signatures pt-4 flex justify-between text-center text-xs">
                <div className="sign-box">
                  <p className="text-slate-500">Penerima Toko,</p>
                  <div className="h-14" />
                  <p className="font-bold border-t border-slate-400 pt-1">({order.customer_name})</p>
                </div>
                <div className="sign-box">
                  <p className="text-slate-500">Sales Lapangan,</p>
                  <div className="h-14" />
                  <p className="font-bold border-t border-slate-400 pt-1">({order.sales_name || 'Petugas ALSYFA'})</p>
                </div>
                <div className="sign-box">
                  <p className="text-slate-500">Admin Distribusi,</p>
                  <div className="h-14" />
                  <p className="font-bold border-t border-slate-400 pt-1">(Hendra Wijaya)</p>
                </div>
              </div>
            </div>
          ) : (
            /* Thermal 58mm & 80mm Roll Format */
            <div
              ref={receiptRef}
              className={`bg-white p-4 shadow-sm border border-slate-200 text-black font-mono text-[11px] leading-tight ${
                printFormat === '80mm' ? 'w-[320px]' : 'w-[250px]'
              }`}
            >
              {/* Receipt Header */}
              <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-0.5">
                <div className="h-10 w-10 mx-auto rounded-lg bg-emerald-50 border border-emerald-100 p-1 flex items-center justify-center mb-1">
                  <img src="/logo-transparent.png" alt="ALSYFA" className="h-full w-full object-contain" />
                </div>
                <h4 className="font-black text-sm tracking-wide text-slate-900">ALSYFA</h4>
                <p className="text-[10px] font-bold text-slate-700">PRODUK SNACK COKLAT</p>
                <p className="text-[9px] text-slate-500">CS / WA: 0812-3456-7890</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">No Faktur:</span>
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
                <p>Struk sah sebagai bukti transaksi ALSYFA.</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Grid */}
        <div className="w-full space-y-2 mt-4">
          {/* Primary Bluetooth Print Button */}
          <button
            type="button"
            onClick={handlePrintBluetoothDirect}
            disabled={isPrintingBt || isScanning}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 px-4 text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Bluetooth className={`h-4 w-4 ${isPrintingBt ? 'animate-bounce' : ''}`} />
            <span>
              {isPrintingBt
                ? 'Mengirim ke Printer Bluetooth...'
                : btState.isConnected
                ? `Cetak Bluetooth (${btState.deviceName})`
                : 'Scan & Cetak via Printer Bluetooth'}
            </span>
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handlePrintRawBt}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              title="Cetak via App RawBT Android"
            >
              <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
              <span>RawBT App</span>
            </button>

            <button
              type="button"
              onClick={handleCopyRawPosText}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              title="Salin teks POS"
            >
              <Copy className="h-3.5 w-3.5 text-blue-600" />
              <span>Salin POS</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 px-2 text-[11px] font-bold text-white shadow-sm shadow-emerald-200 transition-colors"
              title="Cetak Browser / PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak ({printFormat})</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
