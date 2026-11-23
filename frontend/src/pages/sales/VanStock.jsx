import React, { useState, useEffect } from 'react';
import { Truck, RotateCcw, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import MobileLayout from '../../components/layout/MobileLayout';
import Modal from '../../components/common/Modal';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function VanStock() {
  const user = JSON.parse(localStorage.getItem('alsyifa_user') || '{}');
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Return to warehouse modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnNotes, setReturnNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVanStock();
  }, []);

  const fetchVanStock = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.VAN_STOCKS.CURRENT(user.id));
      setStocks(res.data || []);
    } catch (err) {
      toast.error('Gagal memuat stok kendaraan');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReturn = (stock) => {
    setSelectedProduct(stock);
    setReturnQty(Math.min(stock.current_stock, 1));
    setModalOpen(true);
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (returnQty <= 0 || returnQty > selectedProduct.current_stock) {
      toast.error('Jumlah pengembalian tidak valid');
      return;
    }

    setSubmitting(true);
    try {
      await request.post(API_ENDPOINTS.VAN_STOCKS.RETURN, {
        sales_id: user.id,
        product_id: selectedProduct.product_id,
        qty: returnQty,
        notes: returnNotes || 'Pengembalian sisa stok fisik ke gudang pusat',
      });

      toast.success('Sisa stok berhasil dikembalikan ke gudang!');
      setModalOpen(false);
      fetchVanStock();
    } catch (err) {
      toast.error(err.message || 'Gagal mengembalikan stok');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Stok Kendaraan (Van Sales)" showBack={true}>
      {/* Vehicle Info Card */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl p-4 shadow-md mb-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
            Unit Kendaraan Sales
          </span>
          <h3 className="text-base font-extrabold mt-1">
            {user.vehicle_type === 'motor' ? 'Motor Box Lapangan' : 'Mobil Van Distribusi'}
          </h3>
          <p className="text-xs text-blue-200">Plat: {user.vehicle_number || '-'}</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center font-bold text-2xl border border-white/20">
          <Truck className="h-6 w-6" />
        </div>
      </div>

      {/* Stock List Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Package className="h-4 w-4 text-emerald-600" /> Sisa Stok Fisik Hari Ini
        </h4>

        {loading ? (
          <div className="text-center py-6 text-xs text-slate-400">Memuat stok...</div>
        ) : stocks.length > 0 ? (
          <div className="space-y-3">
            {stocks.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">{item.product_name}</h5>
                    <p className="text-[10px] text-slate-400 font-mono">{item.product_code}</p>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                    Sisa: {item.current_stock} {item.unit}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-white p-2 rounded-lg border border-slate-100 mb-2">
                  <div>
                    <span className="text-slate-400 block">Stok Awal</span>
                    <strong className="text-slate-700 font-bold">{item.initial_stock}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Terjual</span>
                    <strong className="text-blue-600 font-bold">{item.sold_stock}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Sisa Fisik</span>
                    <strong className="text-emerald-600 font-bold">{item.current_stock}</strong>
                  </div>
                </div>

                {item.current_stock > 0 && (
                  <button
                    type="button"
                    onClick={() => handleOpenReturn(item)}
                    className="w-full py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3 text-slate-500" />
                    <span>Kembalikan Sisa ke Gudang</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            Belum ada barang yang dialokasikan ke kendaraan ini untuk hari ini.
          </div>
        )}
      </div>

      {/* Return to Warehouse Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Kembalikan Stok ke Gudang">
        <form onSubmit={handleSubmitReturn} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Nama Produk:</label>
            <p className="font-bold text-sm text-slate-800">{selectedProduct?.product_name}</p>
            <p className="text-[11px] text-slate-500">
              Sisa stok fisik di kendaraan: <strong>{selectedProduct?.current_stock} {selectedProduct?.unit}</strong>
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Jumlah Dikembalikan ({selectedProduct?.unit}) *
            </label>
            <input
              type="number"
              min={1}
              max={selectedProduct?.current_stock || 1}
              value={returnQty}
              onChange={(e) => setReturnQty(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-bold text-sm"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Catatan Pengembalian:</label>
            <input
              type="text"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Catatan retur gudang sore hari..."
              className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow disabled:opacity-50"
            >
              {submitting ? 'Memproses...' : 'Konfirmasi Retur'}
            </button>
          </div>
        </form>
      </Modal>
    </MobileLayout>
  );
}
