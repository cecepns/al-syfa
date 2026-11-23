import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Truck,
  Battery,
  Store,
  Clock,
  PhoneCall,
  RefreshCw,
  Compass,
  Layers,
  Crosshair,
  UserCheck
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AdminLayout from '../../components/layout/AdminLayout';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function LiveTracking() {
  const [salesLocations, setSalesLocations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSales, setSelectedSales] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const storesLayerRef = useRef(null);
  const markersMapRef = useRef({});

  useEffect(() => {
    initMap();
    fetchTrackingData();
    fetchCustomerStores();

    const interval = setInterval(fetchTrackingData, 10000); // 10s auto refresh
    return () => {
      clearInterval(interval);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initMap = () => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center near Bogor / Cibinong
    const map = L.map(mapContainerRef.current, {
      center: [-6.482000, 106.845000],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    storesLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
  };

  const fetchTrackingData = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.TRACKING.SALES_LOCATIONS);
      const data = res.data || [];
      setSalesLocations(data);
      if (data.length > 0 && !selectedSales) {
        setSelectedSales(data[0]);
      }
      renderSalesMarkers(data);
    } catch (err) {
      console.error('Failed to load tracking data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerStores = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.CUSTOMERS.LIST, { limit: 50 });
      const storeData = res.data || [];
      setCustomers(storeData);
      renderStoreMarkers(storeData);
    } catch (err) {
      console.error('Failed to load customer stores:', err);
    }
  };

  const renderSalesMarkers = (salesList) => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    markersMapRef.current = {};

    salesList.forEach((s) => {
      const lat = parseFloat(s.latitude || -6.482000);
      const lng = parseFloat(s.longitude || 106.845000);
      const isSelected = selectedSales?.sales_id === s.sales_id;
      const vehicleEmoji = s.vehicle_type === 'motor' ? '🛵' : '🚐';
      const statusColor = s.attendance_status === 'hadir' ? '#059669' : '#d97706';

      // Custom HTML Pin DivIcon
      const icon = L.divIcon({
        className: 'custom-live-sales-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
            <!-- Label Badge -->
            <div style="background: ${isSelected ? '#047857' : '#1e293b'}; color: white; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2px solid white; display: flex; align-items: center; gap: 4px;">
              <span>${vehicleEmoji}</span>
              <span>${s.sales_name}</span>
            </div>
            <!-- Pointer Arrow -->
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${isSelected ? '#047857' : '#1e293b'}; margin-top: -1px;"></div>
            <!-- Radar Pulsing Dot -->
            <div style="position: relative; width: 16px; height: 16px; margin-top: 2px;">
              <div style="position: absolute; inset: 0; border-radius: 50%; background: ${statusColor}; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; width: 16px; height: 16px; border-radius: 50%; background: ${statusColor}; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lng], { icon });

      // Popup Content
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; min-width: 200px; color: #1e293b; padding: 4px;">
          <div style="font-weight: 800; font-size: 13px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span>${vehicleEmoji} ${s.sales_name}</span>
            <span style="font-size: 10px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">${s.vehicle_type}</span>
          </div>
          <div style="margin-bottom: 4px; color: #475569;">
            <strong>Kendaraan:</strong> ${s.vehicle_number || '-'}
          </div>
          <div style="margin-bottom: 4px; color: #475569;">
            <strong>Lokasi:</strong> ${s.address_note || 'Jalur Kunjungan'}
          </div>
          <div style="margin-bottom: 4px; color: #475569;">
            <strong>Kunjungan Hari Ini:</strong> <span style="font-weight: 700; color: #059669;">${s.visits_today || 0} Toko</span>
          </div>
          <div style="margin-bottom: 8px; color: #475569;">
            <strong>Status Baterai:</strong> ${s.battery_level || 85}%
          </div>
          ${s.sales_phone ? `
            <a href="https://wa.me/62${s.sales_phone.replace(/^0/, '')}" target="_blank" style="display: block; text-align: center; background: #059669; color: white; text-decoration: none; font-weight: 700; padding: 6px; border-radius: 8px; font-size: 11px;">
              💬 Hubungi via WhatsApp
            </a>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setSelectedSales(s);
      });

      marker.addTo(markersLayerRef.current);
      markersMapRef.current[s.sales_id] = marker;
    });
  };

  const renderStoreMarkers = (storeList) => {
    if (!mapInstanceRef.current || !storesLayerRef.current) return;
    storesLayerRef.current.clearLayers();

    storeList.forEach((st) => {
      if (!st.latitude || !st.longitude) return;
      const lat = parseFloat(st.latitude);
      const lng = parseFloat(st.longitude);

      const storeIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
            <div style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 6px; font-size: 9px; font-weight: 700; border: 1.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2); white-space: nowrap;">
              🏬 ${st.name.substring(0, 16)}
            </div>
            <div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; border: 2px solid white; margin-top: 1px;"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const storeMarker = L.marker([lat, lng], { icon: storeIcon });
      storeMarker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 12px; min-width: 180px;">
          <strong style="color: #1e293b; font-size: 13px;">${st.name}</strong>
          <p style="color: #64748b; font-size: 11px; margin: 4px 0;">${st.address}</p>
          <p style="color: #059669; font-weight: 700; font-size: 11px;">Tipe: ${st.shop_type.toUpperCase()}</p>
          ${st.phone ? `<a href="https://wa.me/62${st.phone.replace(/^0/, '')}" target="_blank" style="color: #059669; font-weight: bold; text-decoration: underline; font-size: 11px;">WhatsApp Toko</a>` : ''}
        </div>
      `);
      storeMarker.addTo(storesLayerRef.current);
    });
  };

  const handleSelectSales = (s) => {
    setSelectedSales(s);
    renderSalesMarkers(salesLocations);

    const lat = parseFloat(s.latitude || -6.482000);
    const lng = parseFloat(s.longitude || 106.845000);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 15, {
        animate: true,
        duration: 0.8,
      });

      const marker = markersMapRef.current[s.sales_id];
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 850);
      }
    }
  };

  const handleFitBounds = () => {
    if (!mapInstanceRef.current) return;
    const points = salesLocations
      .filter((s) => s.latitude && s.longitude)
      .map((s) => [parseFloat(s.latitude), parseFloat(s.longitude)]);

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Live GPS Tracking Sales Lapangan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pantau posisi terkini sales di peta digital interaktif, baterai HP, dan kunjungan toko secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFitBounds}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm transition-all"
            title="Pusatkan Seluruh Marker Sales"
          >
            <Crosshair className="h-4 w-4 text-emerald-600" />
            <span>Pusatkan Semua</span>
          </button>
          <button
            onClick={fetchTrackingData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-200 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Segarkan Posisi</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Sales Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Sales Terdaftar ({salesLocations.length} Petugas)</span>
            <span className="text-[10px] text-emerald-600 font-semibold">● Live GPS</span>
          </h3>

          {salesLocations.map((s) => {
            const isSelected = selectedSales?.sales_id === s.sales_id;
            return (
              <div
                key={s.sales_id}
                onClick={() => handleSelectSales(s)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-white shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      {s.sales_name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{s.sales_name}</h4>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {s.vehicle_type === 'motor' ? 'Motoris' : 'Mobil Van'} • {s.vehicle_number || '-'}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    s.attendance_status === 'hadir'
                      ? 'bg-emerald-100 text-emerald-800'
                      : s.attendance_status === 'terlambat'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {s.attendance_status ? `Absen: ${s.attendance_status}` : 'Belum Absen'}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] text-slate-600 space-y-1 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-emerald-600" /> Posisi Terkini:
                    </span>
                    <span className="font-medium text-slate-700 truncate max-w-[150px]">
                      {s.address_note || 'Di Jalur Wilayah'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Store className="h-3 w-3 text-blue-600" /> Kunjungan Hari Ini:
                    </span>
                    <span className="font-bold text-slate-800">{s.visits_today || 0} Toko</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Battery className="h-3 w-3 text-emerald-500" /> Baterai: {s.battery_level || 85}%
                  </span>
                  {s.sales_phone && (
                    <a
                      href={`https://wa.me/62${s.sales_phone.replace(/^0/, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-emerald-600 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <PhoneCall className="h-3 w-3" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Interactive Real Leaflet Map Container */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[620px] relative">
          {/* Map Header Toolbar */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-emerald-400 animate-spin-slow" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Peta Digital Wilayah Sales ({selectedSales?.sales_name || 'Semua Sales'})
                </h4>
                <p className="text-[10px] text-slate-400">
                  Marker Hijau: Sales Aktif • Marker Biru: Toko/Outlet
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                Live Tracker Aktif
              </span>
            </div>
          </div>

          {/* Leaflet Map DOM Element */}
          <div className="flex-1 w-full h-full relative z-0">
            <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '520px' }} />
          </div>

          {/* Floating Selected Sales Quick Card */}
          {selectedSales && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-200 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-extrabold text-slate-900 text-sm">{selectedSales.sales_name}</span>
                  <span className="text-slate-500 text-[11px]">({selectedSales.vehicle_number || selectedSales.vehicle_type})</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Posisi: {selectedSales.address_note || 'Area Kerja Sales'} • GPS: {selectedSales.latitude}, {selectedSales.longitude}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-[11px]">
                  Kunjungan: {selectedSales.visits_today} Toko
                </div>
                {selectedSales.sales_phone && (
                  <a
                    href={`https://wa.me/62${selectedSales.sales_phone.replace(/^0/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow-sm text-[11px]"
                  >
                    <PhoneCall className="h-3.5 w-3.5" /> Hubungi
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
