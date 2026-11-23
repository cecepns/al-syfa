import React, { useState, useRef } from 'react';
import { Camera, RefreshCw, Check, X } from 'lucide-react';
import Modal from './Modal';

export default function CameraCapture({ isOpen, onClose, onCapture, title = 'Ambil Foto Selfie / Toko' }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera stream error:', err);
      // Fallback file input trigger
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 480;
    canvas.height = videoRef.current.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setImageSrc(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (imageSrc) {
      onCapture(imageSrc);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setImageSrc(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center">
        {imageSrc ? (
          <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video flex items-center justify-center">
            <img src={imageSrc} alt="Captured" className="w-full h-full object-cover" />
            <button
              onClick={() => {
                setImageSrc(null);
                startCamera();
              }}
              className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Ulangi Foto
            </button>
          </div>
        ) : (
          <div className="w-full">
            <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center text-slate-400">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />
              {!cameraActive && (
                <div className="flex flex-col items-center p-6 text-center">
                  <Camera className="h-10 w-10 text-slate-500 mb-2" />
                  <p className="text-xs text-slate-400 mb-3">Tekan tombol di bawah untuk menyalakan kamera atau pilih foto</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    Nyalakan Kamera
                  </button>
                </div>
              )}
            </div>

            {cameraActive && (
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={handleTakeSnapshot}
                  className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700"
                >
                  <Camera className="h-5 w-5" /> Ambil Foto Sekarang
                </button>
              </div>
            )}

            {/* Alternative File Upload */}
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <label className="text-xs text-emerald-600 font-semibold cursor-pointer hover:underline">
                Atau pilih file dari galeri / kamera hp
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {imageSrc && (
          <div className="flex w-full gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-700"
            >
              <Check className="h-4 w-4" /> Gunakan Foto Ini
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
