import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to retrieve user GPS location with fallback
 */
export function useGeolocation() {
  const [location, setLocation] = useState({
    latitude: -6.482000,
    longitude: 106.845000,
    accuracy: null,
    error: null,
    loading: true,
  });

  const getCurrentPosition = useCallback(() => {
    setLocation((prev) => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setLocation({
        latitude: -6.482000,
        longitude: 106.845000,
        accuracy: 10,
        error: 'Geolokasi tidak didukung oleh browser Anda. Menggunakan koordinat default (Cibinong).',
        loading: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (err) => {
        // Fallback default coordinate near Cibinong / Bogor
        setLocation({
          latitude: -6.482000,
          longitude: 106.845000,
          accuracy: 15,
          error: `Izin lokasi: ${err.message}. Menggunakan titik kerja default.`,
          loading: false,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  return { ...location, refresh: getCurrentPosition };
}
