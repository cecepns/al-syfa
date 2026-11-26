import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  Printer,
  CheckCircle2,
  CreditCard,
  Banknote,
  Clock,
  Store,
  Package
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import MobileLayout from '../../components/layout/MobileLayout';
import ReceiptModal from '../../components/common/ReceiptModal';
import AppSelect from '../../components/common/AppSelect';
import DebouncedAsyncSelect from '../../components/common/DebouncedAsyncSelect';
import { request } from '../../utils/request';
import { API_ENDPOINTS, getStorageUrl } from '../../utils/endpoints';

export default function OrderCapture() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedCustomerId = searchParams.get('customer_id');
  const preselectedVisitId = searchParams.get('visit_id');

  const user = JSON.parse(localStorage.getItem('alsyifa_user') || '{}');

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId || '');
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [selectedPromoId, setSelectedPromoId] = useState('');
  const [vanStocks, setVanStocks] = useState({});

  // Cart Items: [{ product_id, name, price, qty, unit, stock }]
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('tunai');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Completed Order & Receipt Modal
  const [createdOrder, setCreatedOrder] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [custRes, prodRes, promoRes, stockRes] = await Promise.all([
        request.get(API_ENDPOINTS.CUSTOMERS.LIST, { sales_id: user.id || undefined, limit: 100 }),
        request.get(API_ENDPOINTS.PRODUCTS.LIST, { limit: 100 }),
        request.get(API_ENDPOINTS.PROMOTIONS.LIST, { active_only: 'true' }),
        request.get(API_ENDPOINTS.VAN_STOCKS.CURRENT(user.id)).catch(() => ({ data: [] }))
      ]);

      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      setPromotions(promoRes.data || []);

      // Map van stock current quantities
      const stockMap = {};
      (stockRes.data || []).forEach((st) => {
        stockMap[st.product_id] = st.current_stock;
      });
      setVanStocks(stockMap);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCustomerOptions = async (inputValue) => {
    try {
      const res = await request.get(API_ENDPOINTS.CUSTOMERS.LIST, {
        sales_id: user.id || undefined,
        search: inputValue || '',
        limit: 25,
      });
      return (res.data || []).map((c) => ({
        value: c.id,
        label: `${c.name} (${c.district_name || c.address})`,
      }));
    } catch (e) {
      return [];
    }
  };

  const addToCart = (product) => {
    const existingIndex = cart.findIndex((i) => i.product_id === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].qty += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          name: product.name,
          price: Number(product.price),
          unit: product.unit,
          qty: 1,
          stock: vanStocks[product.id] || product.warehouse_stock || 100,
        },
      ]);
    }
    toast.success(`${product.name} ditambahkan`);
  };

  const updateCartQty = (productId, delta) => {
    const updated = cart
      .map((item) => {
        if (item.product_id === productId) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);
    setCart(updated);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((i) => i.product_id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, it) => acc + it.price * it.qty, 0);

  // Promo Calculation
  const activePromo = promotions.find((p) => String(p.id) === String(selectedPromoId));
  let discountAmount = 0;
  if (activePromo && subtotal >= Number(activePromo.min_order_amount)) {
    if (activePromo.discount_type === 'percentage') {
      discountAmount = (subtotal * Number(activePromo.discount_value)) / 100;
    } else {
      discountAmount = Number(activePromo.discount_value);
    }
  }

  const grandTotal = Math.max(0, subtotal - discountAmount);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Pilih toko pelanggan');
      return;
    }
    if (cart.length === 0) {
      toast.error('Pilih minimal 1 produk untuk pesanan');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_id: selectedCustomerId,
        visit_id: preselectedVisitId || null,
        promo_id: selectedPromoId || null,
        payment_method: paymentMethod,
        due_date: paymentMethod === 'tempo' ? dueDate : null,
        notes,
        items: cart.map((it) => ({
          product_id: it.product_id,
          qty: it.qty,
          price: it.price,
        })),
      };

      const res = await request.post(API_ENDPOINTS.ORDERS.CREATE, payload);

      // Trigger Celebration Confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      toast.success('Pesanan berhasil dibuat & faktur diterbitkan!');

      // Find customer info for receipt
      const custObj = customers.find((c) => String(c.id) === String(selectedCustomerId));

      setCreatedOrder({
        invoice_number: res.data.invoice_number,
        order_date: new Date().toISOString().split('T')[0],
        sales_name: user.name,
        customer_name: custObj?.name || 'Toko Pelanggan',
        customer_address: custObj?.address || '-',
        items: cart.map((it) => ({
          product_name: it.name,
          unit: it.unit,
          qty: it.qty,
          price: it.price,
          total_price: it.price * it.qty,
        })),
        subtotal,
        discount_amount: discountAmount,
        grandTotal: grandTotal,
        grand_total: grandTotal,
        payment_method: paymentMethod,
        paid_amount: res.data.paid_amount,
        payment_status: res.data.payment_status,
      });

      setReceiptOpen(true);
      setCart([]);
    } catch (err) {
      toast.error(err.message || 'Gagal membuat pesanan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Pencatatan Pesanan (Order Capturing)" showBack={true}>
      <form onSubmit={handleSubmitOrder} className="space-y-4">
        {/* Customer Select */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Store className="h-4 w-4 text-emerald-600" /> Pilih Toko Pelanggan *
          </label>
          <DebouncedAsyncSelect
            loadOptions={loadCustomerOptions}
            value={selectedCustomerId}
            onChange={(val) => setSelectedCustomerId(val)}
            selectedLabel={customers.find((c) => String(c.id) === String(selectedCustomerId))?.name}
            placeholder="Ketik nama toko untuk mencari dari database..."
          />
        </div>

        {/* Product Catalog Grid (Adding Items) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Package className="h-4 w-4 text-blue-600" /> Pilih Produk ALSYFA Snack Coklat
          </h4>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {products.map((p) => {
              const currentVanStock = vanStocks[p.id];
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-xl border border-slate-100 hover:bg-slate-50 text-xs"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {p.image ? (
                        <img
                          src={getStorageUrl(p.image)}
                          alt={p.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Package className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[11px] text-emerald-600 font-semibold">
                        Rp {Number(p.price).toLocaleString('id-ID')} / {p.unit}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Stok Mobil: <span className="font-bold text-slate-600">{currentVanStock !== undefined ? `${currentVanStock} ${p.unit}` : 'Tersedia di Gudang'}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(p)}
                    className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors shrink-0"
                    title="Tambah ke keranjang"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Cart Items */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShoppingCart className="h-4 w-4 text-emerald-600" /> Rincian Keranjang ({cart.length} Item)
            </span>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-[10px] text-red-500 hover:underline font-semibold"
              >
                Kosongkan
              </button>
            )}
          </h4>

          {cart.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.product_id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="overflow-hidden pr-2">
                    <p className="font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.qty} x Rp {item.price.toLocaleString('id-ID')} ={' '}
                      <strong className="text-slate-800">
                        Rp {(item.qty * item.price).toLocaleString('id-ID')}
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.product_id, -1)}
                      className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-bold text-slate-800 w-5 text-center">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.product_id, 1)}
                      className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-1 text-slate-300 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">Keranjang masih kosong. Pilih produk di atas.</p>
          )}
        </div>

        {/* Promo Selector */}
        {promotions.length > 0 && (
          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200">
            <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-600" /> Program Promo Dari Pusat
            </label>
            <AppSelect
              value={selectedPromoId}
              onChange={(val) => setSelectedPromoId(val)}
              placeholder="-- Tanpa Promo --"
              isClearable={true}
              options={promotions.map((pr) => ({
                value: pr.id,
                label: `${pr.title} (Min: Rp ${Number(pr.min_order_amount).toLocaleString('id-ID')})`,
              }))}
            />

            {discountAmount > 0 && (
              <p className="text-[11px] text-emerald-700 font-bold mt-1.5">
                🎉 Selamat! Diskon promo terpasang: -Rp {discountAmount.toLocaleString('id-ID')}
              </p>
            )}
          </div>
        )}

        {/* Payment Method & Terms */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'tunai', label: 'Tunai (Cash)', icon: Banknote },
              { key: 'transfer', label: 'Transfer Bank', icon: CreditCard },
              { key: 'tempo', label: 'Tempo (Kredit)', icon: Clock },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button
                  type="button"
                  key={m.key}
                  onClick={() => setPaymentMethod(m.key)}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 text-xs font-bold ${
                    paymentMethod === m.key
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[11px]">{m.label}</span>
                </button>
              );
            })}
          </div>

          {paymentMethod === 'tempo' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Jatuh Tempo Pembayaran:
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan Pesanan:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan nota..."
              className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800"
            />
          </div>
        </div>

        {/* Grand Total Summary Box & Submit */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl">
          <div className="space-y-1.5 text-xs text-slate-300 pb-3 border-b border-slate-800">
            <div className="flex justify-between">
              <span>Subtotal Item:</span>
              <span className="font-semibold text-white">Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Potongan Promo:</span>
                <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-white pt-1">
              <span>Grand Total:</span>
              <span className="text-emerald-400 text-base">Rp {grandTotal.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || cart.length === 0}
            className="w-full mt-3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-900/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            <span>{submitting ? 'Memproses Pesanan...' : 'Simpan Order & Cetak Struk (Nota)'}</span>
          </button>
        </div>
      </form>

      {/* Mini Bluetooth Printer Receipt Modal */}
      <ReceiptModal
        isOpen={receiptOpen}
        onClose={() => {
          setReceiptOpen(false);
          navigate('/sales');
        }}
        order={createdOrder}
      />
    </MobileLayout>
  );
}
