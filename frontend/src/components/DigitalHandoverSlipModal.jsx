import React, { useRef } from 'react';
import {
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  Mail,
  Clock,
} from 'lucide-react';

const DigitalHandoverSlipModal = ({ isOpen, onClose, request }) => {
  const printRef = useRef(null);

  if (!isOpen || !request) return null;

  const isReturned = request.status === 'RETURNED';
  const txnId = `SI-TXN-${String(request.id).padStart(6, '0')}`;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #shareit-printable-slip, #shareit-printable-slip * {
            visibility: visible;
          }
          #shareit-printable-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden transform transition-all my-8 print:my-0 print:border-none print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Printable Slip Content */}
        <div id="shareit-printable-slip" ref={printRef} className="p-6 sm:p-7 text-gray-900 dark:text-gray-100 space-y-5 bg-white dark:bg-slate-900">
          {/* Slip Header with Watermark & Logo */}
          <div className="flex items-start justify-between border-b pb-4 border-gray-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-xs">
                  S
                </div>
                <div>
                  <h2 className="font-black text-lg tracking-tight text-emerald-700 dark:text-emerald-400">
                    Share-It
                  </h2>
                  <p className="text-[10px] tracking-wider uppercase text-gray-400 font-semibold">
                    Peer-to-Peer Neighborhood Sharing
                  </p>
                </div>
              </div>
              <div className="mt-2 text-xs font-mono font-bold text-gray-500 dark:text-gray-400">
                Ref: {txnId}
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  isReturned
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isReturned ? 'Return Verified' : 'Handover Confirmed'}
              </span>
              <p className="text-[10px] text-gray-400 mt-1">
                Issued: {formatDateTime(new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Item Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center gap-4">
            {request.itemImageUrl ? (
              <img
                src={request.itemImageUrl}
                alt={request.itemTitle}
                className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-slate-700 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-500 text-sm font-bold flex-shrink-0">
                Item
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                {request.itemCategory || 'Household Item'}
              </span>
              <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                {request.itemTitle}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {request.startDate} to {request.endDate}
              </p>
            </div>
          </div>

          {/* Parties Involved */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Lender */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                Item Lender (Owner)
              </span>
              <div className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                {request.ownerName}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 truncate">
                <Mail className="w-3 h-3 text-gray-400" />
                {request.ownerEmail}
              </div>
              {request.ownerPhone && (
                <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-gray-400" />
                  {request.ownerPhone}
                </div>
              )}
            </div>

            {/* Borrower */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                Item Borrower
              </span>
              <div className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                {request.borrowerName}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 truncate">
                <Mail className="w-3 h-3 text-gray-400" />
                {request.borrowerEmail}
              </div>
              {request.borrowerPhone && (
                <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-gray-400" />
                  {request.borrowerPhone}
                </div>
              )}
            </div>
          </div>

          {/* Timestamps & PIN Proof Verification Ledger */}
          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 space-y-2 text-xs">
            <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Pickup Handover Confirmed:
              </span>
              <span className="font-bold text-emerald-800 dark:text-emerald-300 font-mono">
                {formatDateTime(request.handoverAt)}
              </span>
            </div>

            {request.returnedAt && (
              <div className="flex items-center justify-between text-gray-700 dark:text-gray-300 pt-1.5 border-t border-emerald-200/50 dark:border-emerald-800/30">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Item Return Confirmed:
                </span>
                <span className="font-bold text-blue-800 dark:text-blue-300 font-mono">
                  {formatDateTime(request.returnedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Item Condition Proof Snapshots */}
          {(request.pickupPhotoUrl || request.returnPhotoUrl) && (
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                📸 Condition Proof Snapshots
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {request.pickupPhotoUrl && (
                  <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">
                      Pickup Condition Snapshot
                    </span>
                    <img
                      src={request.pickupPhotoUrl}
                      alt="Pickup condition"
                      className="w-full h-28 object-cover rounded-lg border border-emerald-300 dark:border-emerald-700"
                    />
                    {request.pickupConditionNote && (
                      <p className="text-[10px] text-gray-600 dark:text-gray-300 italic">
                        "{request.pickupConditionNote}"
                      </p>
                    )}
                  </div>
                )}

                {request.returnPhotoUrl && (
                  <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-1.5">
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 block">
                      Return Condition Snapshot
                    </span>
                    <img
                      src={request.returnPhotoUrl}
                      alt="Return condition"
                      className="w-full h-28 object-cover rounded-lg border border-blue-300 dark:border-blue-700"
                    />
                    {request.returnConditionNote && (
                      <p className="text-[10px] text-gray-600 dark:text-gray-300 italic">
                        "{request.returnConditionNote}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Digital Security Seal */}
          <div className="text-center pt-3 border-t border-dashed border-gray-200 dark:border-slate-800 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-[10px] font-bold text-gray-600 dark:text-gray-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Cryptographically verified via Screen PIN / QR Scan
            </div>
            <p className="text-[9px] text-gray-400">
              This digital receipt serves as tamper-evident proof of custody transfer on the Share-It Peer-to-Peer Network.
            </p>
          </div>
        </div>

        {/* Modal Action Bar (Hidden during print) */}
        <div className="no-print p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalHandoverSlipModal;
