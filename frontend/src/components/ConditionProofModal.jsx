import React from 'react';
import {
  Camera,
  CheckCircle2,
  Calendar,
  X,
  ShieldCheck,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';

const ConditionProofModal = ({ isOpen, onClose, request }) => {
  if (!isOpen || !request) return null;

  const {
    itemTitle,
    borrowerName,
    ownerName,
    handoverAt,
    returnedAt,
    pickupPhotoUrl,
    pickupConditionNote,
    returnPhotoUrl,
    returnConditionNote,
  } = request;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-5 sm:p-7 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-6 max-h-[92vh] overflow-y-auto animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white">
                Item Condition Proof
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Verified physical condition records for <strong>{itemTitle}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Summary Pill */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span>
            <strong>Lender:</strong> {ownerName}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
          <span>
            <strong>Borrower:</strong> {borrowerName}
          </span>
          <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            PIN Verified
          </span>
        </div>

        {/* Before & After Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* 1. Pickup Condition (Before) */}
          <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/60">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
                Before Handover
              </span>
              {handoverAt && (
                <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  {formatDate(handoverAt)}
                </span>
              )}
            </div>

            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center">
              {pickupPhotoUrl ? (
                <img
                  src={pickupPhotoUrl}
                  alt="Item condition at pickup"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4 space-y-1 text-gray-400 dark:text-gray-500">
                  <Camera className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-xs font-semibold">No pickup photo captured</p>
                  <p className="text-[10px]">PIN verification was completed without image</p>
                </div>
              )}
            </div>

            {pickupConditionNote ? (
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">
                  Pickup Condition Remarks
                </span>
                <p className="text-gray-700 dark:text-gray-300 italic">
                  "{pickupConditionNote}"
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 italic text-center">
                No special condition remarks recorded at pickup.
              </p>
            )}
          </div>

          {/* 2. Return Condition (After) */}
          <div className="space-y-3 p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/60">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
                After Return
              </span>
              {returnedAt ? (
                <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-600" />
                  {formatDate(returnedAt)}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  Awaiting Return
                </span>
              )}
            </div>

            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center">
              {returnPhotoUrl ? (
                <img
                  src={returnPhotoUrl}
                  alt="Item condition at return"
                  className="w-full h-full object-cover"
                />
              ) : returnedAt ? (
                <div className="text-center p-4 space-y-1 text-gray-400 dark:text-gray-500">
                  <Camera className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-xs font-semibold">No return photo captured</p>
                  <p className="text-[10px]">Return verified safely via PIN</p>
                </div>
              ) : (
                <div className="text-center p-4 space-y-1 text-gray-400 dark:text-gray-500">
                  <Clock className="w-8 h-8 mx-auto text-amber-500 opacity-60" />
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Item currently in use
                  </p>
                  <p className="text-[10px]">
                    Return photo will be recorded upon drop-off
                  </p>
                </div>
              )}
            </div>

            {returnConditionNote ? (
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-blue-200/60 dark:border-blue-800/40 text-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">
                  Return Condition Remarks
                </span>
                <p className="text-gray-700 dark:text-gray-300 italic">
                  "{returnConditionNote}"
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 italic text-center">
                {returnedAt
                  ? 'No special condition remarks recorded at return.'
                  : 'Remarks will be recorded at return verification.'}
              </p>
            )}
          </div>
        </div>

        {/* Protection Note */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>
            These timestamped photos and remarks serve as mutual proof of condition, protecting both lender and borrower from disputes.
          </span>
        </div>

        {/* Footer */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold transition"
        >
          Close Record
        </button>
      </div>
    </div>
  );
};

export default ConditionProofModal;
