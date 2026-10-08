import React, { useState } from 'react';
import {
  Camera,
  X,
  ShieldCheck,
  Clock,
  ArrowRight,
  ZoomIn,
  Upload,
  CheckCircle2,
  DollarSign,
  Loader2,
  Eye,
  Info
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const ConditionProofModal = ({
  isOpen,
  onClose,
  request,
  currentUser,
  onSettleRefund,
  onSnapshotUpdated,
  isSettlingRefund = false
}) => {
  const toast = useToast();
  const [lightboxImage, setLightboxImage] = useState(null);
  const [uploadingStage, setUploadingStage] = useState(null);
  const [pickupNoteInput, setPickupNoteInput] = useState('');
  const [returnNoteInput, setReturnNoteInput] = useState('');
  const [editingNoteStage, setEditingNoteStage] = useState(null);

  if (!isOpen || !request) return null;

  const {
    id,
    itemTitle,
    borrowerName,
    ownerName,
    ownerId,
    handoverAt,
    returnedAt,
    pickupPhotoUrl,
    pickupConditionNote,
    returnPhotoUrl,
    returnConditionNote,
    securityDeposit = 0,
    refundAmount,
    paymentStatus,
    status
  } = request;

  const isOwner = currentUser?.id === ownerId;
  const isReturned = status === 'RETURNED' || !!returnedAt;
  const isRefundSettled = paymentStatus === 'REFUND_SETTLED';
  const effectiveRefund = refundAmount != null ? refundAmount : securityDeposit;

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

  const handleFileUpload = async (e, stage) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setUploadingStage(stage);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const photoUrl = uploadRes.data.url;
      const note = stage === 'pickup' 
        ? (pickupNoteInput || pickupConditionNote || '') 
        : (returnNoteInput || returnConditionNote || '');

      const updateRes = await api.post(`/requests/${id}/condition-photo`, {
        stage,
        photoUrl,
        conditionNote: note
      });

      toast.success(`${stage === 'pickup' ? 'Pickup' : 'Return'} snapshot uploaded! 📸`);
      if (onSnapshotUpdated) {
        onSnapshotUpdated(updateRes.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingStage(null);
    }
  };

  const handleSaveNote = async (stage) => {
    const note = stage === 'pickup' ? pickupNoteInput : returnNoteInput;
    const photoUrl = stage === 'pickup' ? pickupPhotoUrl : returnPhotoUrl;

    try {
      const updateRes = await api.post(`/requests/${id}/condition-photo`, {
        stage,
        photoUrl: photoUrl || '',
        conditionNote: note
      });

      toast.success('Condition notes updated! 📝');
      setEditingNoteStage(null);
      if (onSnapshotUpdated) {
        onSnapshotUpdated(updateRes.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update note');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl p-5 sm:p-7 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-6 max-h-[92vh] overflow-y-auto animate-scaleUp"
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
                Before & After Condition Snapshots
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Deposit protection & verified physical condition records for <strong>{itemTitle}</strong>
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
          <div className="flex items-center gap-2">
            {pickupPhotoUrl && returnPhotoUrl ? (
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Both Snapshots Recorded
              </span>
            ) : pickupPhotoUrl || returnPhotoUrl ? (
              <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50">
                <Info className="w-3.5 h-3.5" />
                1 of 2 Snapshots Recorded
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                <ShieldCheck className="w-3.5 h-3.5" />
                Ready for Inspection
              </span>
            )}
          </div>
        </div>

        {/* Deposit Protection Status Banner */}
        {securityDeposit > 0 && (
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isRefundSettled
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
              : isReturned
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200'
              : 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50 text-indigo-900 dark:text-indigo-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                isRefundSettled
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400'
              }`}>
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm">
                    Security Deposit: ₹{securityDeposit}
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isRefundSettled
                      ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
                      : isReturned
                      ? 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300'
                      : 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                  }`}>
                    {isRefundSettled ? 'REFUND SETTLED' : isReturned ? 'AWAITING REFUND' : 'HELD IN ESCROW'}
                  </span>
                </div>
                <p className="text-xs opacity-80 mt-0.5">
                  {isRefundSettled
                    ? `✓ Full security deposit refund of ₹${effectiveRefund} was settled to ${borrowerName}.`
                    : isReturned
                    ? isOwner
                      ? 'Inspect the return photo below. If condition matches pickup, release the deposit in 1-click!'
                      : `Awaiting lender inspection. ₹${effectiveRefund} refundable upon spotless return.`
                    : 'Held securely during rental period. Protected against accidental damage disputes.'}
                </p>
              </div>
            </div>

            {/* Lender 1-Click Release Action */}
            {isOwner && isReturned && !isRefundSettled && onSettleRefund && (
              <button
                type="button"
                onClick={() => onSettleRefund(id, effectiveRefund)}
                disabled={isSettlingRefund}
                className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow active:scale-98 disabled:opacity-50"
              >
                {isSettlingRefund ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Settling...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Release ₹{effectiveRefund} Deposit Now
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Side-by-Side Before & After Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* 1. Pickup Condition (Before) */}
          <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/60 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
                  1. Pickup Snapshot (Before)
                </span>
                {handoverAt && (
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    {formatDate(handoverAt)}
                  </span>
                )}
              </div>

              {/* Photo Area */}
              <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center group">
                {pickupPhotoUrl ? (
                  <>
                    <img
                      src={pickupPhotoUrl}
                      alt="Item condition at pickup"
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => setLightboxImage({
                        url: pickupPhotoUrl,
                        title: 'Pickup Snapshot (Before Handover)',
                        date: formatDate(handoverAt),
                        note: pickupConditionNote
                      })}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white font-semibold text-xs transition backdrop-blur-2xs cursor-pointer"
                    >
                      <ZoomIn className="w-5 h-5" />
                      Click to Inspect Full Photo
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4 space-y-2 text-gray-400 dark:text-gray-500">
                    <Camera className="w-8 h-8 mx-auto opacity-50" />
                    <p className="text-xs font-semibold">No pickup photo captured yet</p>
                    <p className="text-[10px]">Take a snapshot to document pre-existing condition</p>
                  </div>
                )}
              </div>

              {/* Remarks */}
              {editingNoteStage === 'pickup' ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={pickupNoteInput}
                    onChange={(e) => setPickupNoteInput(e.target.value)}
                    placeholder="E.g., Minor scratch on lower edge, comes with battery & charger"
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingNoteStage(null)}
                      className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveNote('pickup')}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Pickup Condition Remarks
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPickupNoteInput(pickupConditionNote || '');
                        setEditingNoteStage('pickup');
                      }}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      {pickupConditionNote ? 'Edit' : '+ Add Note'}
                    </button>
                  </div>
                  {pickupConditionNote ? (
                    <p className="text-gray-700 dark:text-gray-300 italic">
                      "{pickupConditionNote}"
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">
                      No remarks added yet.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Upload / Replace Action */}
            <div className="pt-2">
              <label className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold cursor-pointer transition">
                {uploadingStage === 'pickup' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    {pickupPhotoUrl ? 'Update Pickup Photo' : 'Upload Pickup Photo'}
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'pickup')}
                  disabled={uploadingStage !== null}
                />
              </label>
            </div>
          </div>

          {/* 2. Return Condition (After) */}
          <div className="space-y-3 p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/60 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
                  2. Return Snapshot (After)
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

              {/* Photo Area */}
              <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center group">
                {returnPhotoUrl ? (
                  <>
                    <img
                      src={returnPhotoUrl}
                      alt="Item condition at return"
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => setLightboxImage({
                        url: returnPhotoUrl,
                        title: 'Return Snapshot (After Return)',
                        date: formatDate(returnedAt),
                        note: returnConditionNote
                      })}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white font-semibold text-xs transition backdrop-blur-2xs cursor-pointer"
                    >
                      <ZoomIn className="w-5 h-5" />
                      Click to Inspect Full Photo
                    </button>
                  </>
                ) : returnedAt ? (
                  <div className="text-center p-4 space-y-2 text-gray-400 dark:text-gray-500">
                    <Camera className="w-8 h-8 mx-auto opacity-50" />
                    <p className="text-xs font-semibold">No return photo captured yet</p>
                    <p className="text-[10px]">Snap return state to conclude handover</p>
                  </div>
                ) : (
                  <div className="text-center p-4 space-y-2 text-gray-400 dark:text-gray-500">
                    <Clock className="w-8 h-8 mx-auto text-amber-500 opacity-60" />
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Item currently in use
                    </p>
                    <p className="text-[10px]">
                      Take snapshot upon return for deposit release
                    </p>
                  </div>
                )}
              </div>

              {/* Remarks */}
              {editingNoteStage === 'return' ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={returnNoteInput}
                    onChange={(e) => setReturnNoteInput(e.target.value)}
                    placeholder="E.g., Returned in clean original condition with accessories"
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingNoteStage(null)}
                      className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveNote('return')}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-blue-200/60 dark:border-blue-800/40 text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Return Condition Remarks
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReturnNoteInput(returnConditionNote || '');
                        setEditingNoteStage('return');
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      {returnConditionNote ? 'Edit' : '+ Add Note'}
                    </button>
                  </div>
                  {returnConditionNote ? (
                    <p className="text-gray-700 dark:text-gray-300 italic">
                      "{returnConditionNote}"
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">
                      {returnedAt
                        ? 'No special remarks recorded at return.'
                        : 'Remarks will be recorded at return verification.'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Upload / Replace Action */}
            <div className="pt-2">
              <label className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold cursor-pointer transition">
                {uploadingStage === 'return' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    {returnPhotoUrl ? 'Update Return Photo' : 'Upload Return Photo'}
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'return')}
                  disabled={uploadingStage !== null}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Mutual Protection Info Note */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>
            These timestamped before & after photos serve as indisputable mutual proof of condition, protecting both parties and ensuring 100% fair security deposit refunds.
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold transition"
          >
            Done Inspecting
          </button>
        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900/90 flex items-center justify-between border-b border-slate-800">
              <div>
                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  {lightboxImage.title}
                </h4>
                {lightboxImage.date && (
                  <p className="text-slate-400 text-xs mt-0.5">{lightboxImage.date}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[75vh] flex items-center justify-center overflow-auto p-2 bg-black/40">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            {lightboxImage.note && (
              <div className="p-3.5 bg-slate-900 border-t border-slate-800 text-xs text-slate-300">
                <span className="text-slate-500 font-bold block mb-0.5 uppercase text-[10px]">
                  Condition Notes
                </span>
                <p className="italic">"{lightboxImage.note}"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionProofModal;
