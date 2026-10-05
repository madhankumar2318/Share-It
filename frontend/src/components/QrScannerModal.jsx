import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, CheckCircle2, RefreshCw, KeyRound, ShieldAlert } from 'lucide-react';

const QrScannerModal = ({
  isOpen,
  onClose,
  request,
  type = 'pickup',
  onScanSuccess,
}) => {
  if (!isOpen || !request) return null;

  const [scanError, setScanError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [scannedPin, setScannedPin] = useState('');
  const [cameraStarting, setCameraStarting] = useState(true);
  const scannerRef = useRef(null);
  const isPickup = type === 'pickup';

  useEffect(() => {
    let html5QrCode = null;
    let isMounted = true;
    const scannerElementId = 'shareit-qr-reader';

    const startScanner = async () => {
      setCameraStarting(true);
      setScanError(null);

      try {
        html5QrCode = new Html5Qrcode(scannerElementId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            // QR Scanned Successfully
            handleSuccessfulScan(decodedText, html5QrCode);
          },
          () => {
            // Frame scan failure (safe to ignore for stream)
          }
        );

        if (isMounted) {
          setCameraStarting(false);
        }
      } catch (err) {
        if (isMounted) {
          setCameraStarting(false);
          const errorMsg =
            typeof err === 'string'
              ? err
              : err?.message || 'Unable to access camera. Please check camera permissions.';
          setScanError(errorMsg);
        }
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch((e) => console.warn('QR scanner stop error:', e));
      }
    };
  }, []);

  const handleSuccessfulScan = async (decodedText, scannerInstance) => {
    let pinExtracted = '';

    try {
      // 1. Try parsing JSON payload
      const data = JSON.parse(decodedText);
      if (data && data.app === 'SHARE_IT') {
        if (data.requestId && Number(data.requestId) !== Number(request.id)) {
          setScanError(
            `Mismatch: This QR is for request #${data.requestId}, but you are verifying item request #${request.id} (${request.itemTitle}).`
          );
          return;
        }
        pinExtracted = String(data.pin || '').trim();
      } else if (data && data.pin) {
        pinExtracted = String(data.pin).trim();
      }
    } catch {
      // 2. Fallback: Raw PIN string (6 digits or 4 digits)
      const cleaned = decodedText.replace(/\D/g, '').trim();
      if (cleaned.length === 6 || cleaned.length === 4) {
        pinExtracted = cleaned;
      }
    }

    if (!pinExtracted || (pinExtracted.length !== 6 && pinExtracted.length !== 4)) {
      setScanError('Scanned QR code does not contain a valid 6-digit Handover PIN.');
      return;
    }

    // Stop scanner
    try {
      if (scannerInstance && scannerInstance.isScanning) {
        await scannerInstance.stop();
      }
    } catch (e) {
      console.warn('Error stopping scanner:', e);
    }

    // Haptic vibration feedback if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch (_) {}
    }

    setIsSuccess(true);
    setScannedPin(pinExtracted);

    // Auto-verify after short visual confirmation
    setTimeout(() => {
      onScanSuccess(pinExtracted);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-4 text-white flex items-center justify-between ${
            isPickup
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-xs tracking-wide">
                {isPickup ? 'Scan Borrower Pickup QR' : 'Scan Borrower Return QR'}
              </h3>
              <p className="text-[10px] text-white/80">
                Point camera at {request.borrowerName}&apos;s screen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="p-4 flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[280px] bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-gray-300 dark:border-slate-700">
            {/* HTML5 QR Code Container */}
            <div id="shareit-qr-reader" className="w-full h-full object-cover" />

            {/* Scanning Overlay Animation */}
            {!isSuccess && !scanError && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-48 h-48 border-2 border-emerald-400/90 rounded-2xl relative shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  {/* Laser Sweeper */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2 -translate-y-1/2" />
                  {/* Corner Accents */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-md" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-md" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-md" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-md" />
                </div>
                <span className="text-[11px] font-semibold text-white/90 bg-black/60 px-3 py-1 rounded-full mt-3 backdrop-blur-xs">
                  Align QR Code in frame
                </span>
              </div>
            )}

            {/* Success Overlay */}
            {isSuccess && (
              <div className="absolute inset-0 bg-emerald-600/95 flex flex-col items-center justify-center text-white p-4 animate-fade-in text-center z-20">
                <CheckCircle2 className="w-14 h-14 mb-2 animate-bounce" />
                <h4 className="font-bold text-base">QR Code Verified!</h4>
                <div className="font-mono text-2xl font-black tracking-widest mt-1 bg-white/20 px-4 py-1 rounded-xl">
                  {scannedPin}
                </div>
                <p className="text-xs text-white/90 mt-2">Confirming handover with server...</p>
              </div>
            )}

            {/* Error Overlay */}
            {scanError && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white p-4 text-center z-20 space-y-2">
                <AlertCircle className="w-10 h-10 text-amber-400" />
                <p className="text-xs text-amber-200 font-medium px-2">{scanError}</p>
                <button
                  onClick={() => {
                    setScanError(null);
                    window.location.reload();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
                </button>
              </div>
            )}
          </div>

          {/* Quick Manual Entry Reminder */}
          <div className="mt-3 w-full bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <p className="text-[11px] text-gray-600 dark:text-gray-300">
                Can&apos;t scan? You can close and type the 6-digit PIN manually.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap ml-2"
            >
              Manual PIN
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrScannerModal;
