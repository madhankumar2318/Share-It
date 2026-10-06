import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';

const HandoverQrModal = ({ isOpen, onClose, request, type = 'pickup' }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !request) return null;

  const isPickup = type === 'pickup';
  const pin = isPickup ? request.pickupOtp : request.returnOtp;
  const targetName = request.ownerName || 'Lender';

  // Secure standardized JSON payload for scanning
  const qrPayload = JSON.stringify({
    app: 'SHARE_IT',
    action: isPickup ? 'PICKUP_HANDOVER' : 'RETURN_HANDOVER',
    requestId: request.id,
    pin: pin,
  });

  const handleCopy = () => {
    if (pin) {
      navigator.clipboard.writeText(pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-5 text-white relative flex items-center justify-between ${
            isPickup
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              {isPickup ? <KeyRound className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                {isPickup ? '🔑 Pickup Handover QR' : '🛡️ Return Handover QR'}
              </h3>
              <p className="text-[11px] text-white/80">
                {isPickup ? 'Show this to lender at pickup' : 'Show to lender when returning item'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          {/* Item Mini Card */}
          <div className="w-full bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl flex items-center gap-3 border border-gray-100 dark:border-slate-800 text-left">
            {request.itemImageUrl ? (
              <img
                src={request.itemImageUrl}
                alt={request.itemTitle}
                className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-slate-700 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0">
                Item
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {request.itemTitle}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                Lender: <strong>{targetName}</strong>
              </p>
            </div>
          </div>

          {/* QR Code Container with High Contrast & Soft Glow */}
          <div className="relative p-4 bg-white rounded-2xl shadow-md border-2 border-dashed border-gray-200 dark:border-slate-700 flex items-center justify-center">
            {pin ? (
              <QRCodeSVG
                value={qrPayload}
                size={200}
                level="H"
                includeMargin={true}
                className="w-48 h-48 rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-xs">
                PIN not available
              </div>
            )}
          </div>

          {/* 6-Digit PIN Display + Quick Copy */}
          <div className="w-full">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
              Or tell 6-digit PIN directly:
            </span>
            <div className="flex items-center justify-center gap-2">
              <div className="font-mono text-3xl font-black tracking-widest text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 px-5 py-2 rounded-xl shadow-inner border border-gray-200 dark:border-slate-700">
                {pin || '------'}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                title="Copy PIN"
                className="p-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Helper Instructions */}
          <div className="text-[11px] text-gray-500 dark:text-gray-400 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-2.5 rounded-xl w-full flex items-center gap-2 text-left">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>
              Ask <strong>{targetName}</strong> to click <strong>"Scan QR"</strong> on their screen for instant 1-second verification!
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default HandoverQrModal;
