import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Tag, Gift, CheckCircle2 } from 'lucide-react';
import MobileLayout from '../../components/layout/MobileLayout';
import { request } from '../../utils/request';
import { API_ENDPOINTS, getStorageUrl } from '../../utils/endpoints';

export default function PromoCatalog() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.PROMOTIONS.LIST, { active_only: 'true' });
      setPromotions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout title="Program Promo Pusat" showBack={true}>
      <div className="bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-2xl p-4 shadow-md mb-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
            Katalog Promo Aktif
          </span>
          <h3 className="text-base font-extrabold mt-1">Program Promo ALSYFA</h3>
          <p className="text-xs text-amber-100">Bantu closing penjualan dengan diskon spesial pusat</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center font-bold text-2xl border border-white/20">
          <Sparkles className="h-6 w-6" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-xs text-slate-400">Memuat promo...</div>
      ) : promotions.length > 0 ? (
        <div className="space-y-4">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 overflow-hidden"
            >
              {promo.banner_image && (
                <div className="w-full h-32 mb-3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={getStorageUrl(promo.banner_image)}
                    alt={promo.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> {promo.code}
                </span>
                <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">
                  {promo.discount_type === 'percentage'
                    ? `Diskon ${Number(promo.discount_value)}%`
                    : `Potongan Rp ${Number(promo.discount_value).toLocaleString('id-ID')}`}
                </span>
              </div>

              <h4 className="font-extrabold text-sm text-slate-800 mb-1">{promo.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">{promo.description}</p>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Minimal Belanja:</span>
                  <span className="font-bold text-slate-700">
                    Rp {Number(promo.min_order_amount).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Periode Berlaku:</span>
                  <span className="font-bold text-slate-700">
                    {promo.start_date} s/d {promo.end_date}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
          <Gift className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">Belum ada promo aktif</h4>
          <p className="text-xs text-slate-400 mt-1">Agenda promo dari pusat akan muncul di halaman ini.</p>
        </div>
      )}
    </MobileLayout>
  );
}
