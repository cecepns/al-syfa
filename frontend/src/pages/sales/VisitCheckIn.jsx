import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  Store,
  PhoneCall,
  History,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import MobileLayout from '../../components/layout/MobileLayout';
import CameraCapture from '../../components/common/CameraCapture';
import AppSelect from '../../components/common/AppSelect';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { useGeolocation } from '../../hooks/useGeolocation';

export default function VisitCheckIn() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const geo = useGeolocation();

  const [customer, setCustomer] = useState(null);
  const [activeVisit, setActiveVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [resultType, setResultType] = useState('order');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomerDetail();
  }, [customerId]);

  const fetchCustomerDetail = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.CUSTOMERS.DETAIL(customerId));
      setCustomer(res.data);
    } catch (err) {
      toast.error('Gagal memuat detail toko');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCheckIn = () => {
    setCameraOpen(true);
  };

  const handleCheckInPhoto = async (photoBase64) => {
    setSubmitting(true);
    try {
      const res = await request.post(API_ENDPOINTS.VISITS.CHECK_IN, {
        customer_id: customerId,
        check_in_lat: geo.latitude,
        check_in_lng: geo.longitude,
        image: photoBase64,
        notes: `Check-in di ${customer?.name}`,
      });

      toast.success('Check-in berhasil dicatat!');
      setActiveVisit(res.data);
    } catch (err) {
      toast.error(err.message || 'Gagal check-in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeVisit?.visit_id) {
      toast.error('Belum ada sesi check-in aktif');
      return;
    }

    setSubmitting(true);
    try {
      await request.post(API_ENDPOINTS.VISITS.CHECK_OUT, {
        visit_id: activeVisit.visit_id,
        check_out_lat: geo.latitude,
        check_out_lng: geo.longitude,
        result_type: resultType,
        notes: checkoutNotes || `Kunjungan selesai dengan hasil: ${resultType}`,
      });

      toast.success('Kunjungan selesai dicatat!');
      navigate('/sales');
    } catch (err) {
      toast.error(err.message || 'Gagal check-out');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout title="Kunjungan Toko" showBack={true}>
        <div className="p-8 text-center text-xs text-slate-400">Memuat data toko...</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title={`Kunjungan: ${customer?.name || 'Toko'}`} showBack={true}>
      {/* Store Header Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              {customer?.shop_type}
            </span>
            <h3 className="text-base font-extrabold text-slate-800 mt-1">{customer?.name}</h3>
            <p className="text-xs text-slate-500">Pemilik: {customer?.owner_name || '-'}</p>
          </div>
          {customer?.phone && (
            <a
              href={`https://wa.me/62${customer.phone.replace(/^0/, '')}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            >
              <PhoneCall className="h-5 w-5" />
            </a>
          )}
        </div>

        <p className="text-xs text-slate-600 mt-2 flex items-start gap-1.5">
          <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <span>{customer?.address}</span>
        </p>

        {Number(customer?.current_balance) > 0 && (
          <div className="mt-3 bg-amber-50 rounded-xl p-2.5 text-xs text-amber-800 flex justify-between font-semibold">
            <span>Sisa Piutang:</span>
            <span>Rp {Number(customer.current_balance).toLocaleString('id-ID')}</span>
          </div>
        )}
      </div>

      {/* GPS Location Validation */}
      <div className="bg-slate-900 text-white rounded-2xl p-3.5 mb-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-400" />
          <div>
            <p className="font-bold">Verifikasi Titik GPS Sales</p>
            <p className="text-[10px] text-slate-400 font-mono">
              {geo.latitude.toFixed(6)}, {geo.longitude.toFixed(6)}
            </p>
          </div>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md font-bold">
          GPS Akurat
        </span>
      </div>

      {/* Step 1: Check-In */}
      {!activeVisit ? (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center mb-4">
          <Camera className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">Check-In Kedatangan di Toko</h4>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Ambil foto fisik toko / selfie di lokasi untuk memverifikasi kedatangan Anda.
          </p>

          <button
            type="button"
            onClick={handleStartCheckIn}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
          >
            <Camera className="h-4 w-4" />
            <span>{submitting ? 'Memproses...' : 'Ambil Foto & Check-In Sekarang'}</span>
          </button>
        </div>
      ) : (
        /* Step 2: During Visit / In Progress */
        <div className="space-y-4 mb-4">
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Sedang Berkunjung
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700">
                Mulai: {activeVisit.check_in_time}
              </span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Lakukan interaksi, pengecekan stok display toko, dan catat pesanan pelanggan.
            </p>

            <Link
              to={`/sales/order?customer_id=${customerId}&visit_id=${activeVisit.visit_id}`}
              className="mt-3 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Input Pesanan Toko Ini (Order Capturing)</span>
            </Link>
          </div>

          {/* Checkout Form */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Selesai Kunjungan (Check-Out)
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Hasil Kunjungan:</label>
                <AppSelect
                  value={resultType}
                  onChange={(val) => setResultType(val)}
                  options={[
                    { value: 'order', label: 'Closing Order (Pesanan Masuk)' },
                    { value: 'follow_up', label: 'Follow Up / Negosiasi' },
                    { value: 'stok_penuh', label: 'Stok Toko Masih Cukup' },
                    { value: 'toko_tutup', label: 'Toko Sedang Tutup / Pemilik Keluar' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Catatan Interaksi:</label>
                <textarea
                  rows={2}
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="Catatan hasil diskusi dengan pemilik toko..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
                />
              </div>

              <button
                type="button"
                onClick={handleCheckOut}
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition-all"
              >
                {submitting ? 'Menyimpan...' : 'Check-Out Kunjungan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Past Order History */}
      {customer?.recent_orders && customer.recent_orders.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-slate-500" /> Riwayat Belanja Sebelumnya
          </h4>
          <div className="divide-y divide-slate-100 text-xs">
            {customer.recent_orders.map((ord) => (
              <div key={ord.id} className="py-2 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{ord.invoice_number}</p>
                  <p className="text-[10px] text-slate-400">{ord.order_date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    Rp {Number(ord.grand_total).toLocaleString('id-ID')}
                  </p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${ord.payment_status === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {ord.payment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCheckInPhoto}
        title={`Foto Check-In di ${customer?.name || 'Toko'}`}
      />
    </MobileLayout>
  );
}
