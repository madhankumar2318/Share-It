import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  MapPin, 
  KeyRound, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { compressImage } from '../utils/imageCompressor';

const ContactlessCollectModal = ({
  isOpen,
  onClose,
  request,
  mode = 'pickup', // 'pickup' (borrower collecting from guard) or 'return' (owner collecting from guard)
  onSuccess
}) => {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [conditionNote, setConditionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);

  // Hook rules: declare before early return
  if (!isOpen || !request) return null;

  const isPickupMode = mode === 'pickup';
  const dropoffLoc = isPickupMode ? request.dropoffLocation : request.returnDropoffLocation;
  const dropoffPic = isPickupMode ? request.dropoffPhotoUrl : request.returnDropoffPhotoUrl;
  const dropoffNotice = isPickupMode ? request.dropoffNote : request.returnDropoffNote;
  const dropoffTime = isPickupMode ? request.dropoffAt : request.returnDropoffAt;
  const passcode = request.dropoffPasscode;

  const handleCopyPasscode = () => {
    if (!passcode) return;
    navigator.clipboard.writeText(passcode);
    setCopiedPasscode(true);
    toast.success('Passcode copied to clipboard!');
    setTimeout(() => setCopiedPasscode(false), 2000);
  };

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, WebP)');
      return;
    }

    setUploadingPhoto(true);
    try {
      const compressedFile = await compressImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.75,
        maxSizeKB: 250,
      });

      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = res.data?.fileUrl;
      if (uploadedUrl) {
        setPhotoUrl(uploadedUrl);
        toast.success('Collection photo recorded! 📸');
      }
    } catch (err) {
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleConfirmCollection = async () => {
    setSubmitting(true);
    try {
      if (isPickupMode) {
        await api.post(`/requests/${request.id}/confirm-dropoff-pickup`, {
          photoUrl: photoUrl || '',
          conditionNote: conditionNote.trim(),
        });
        toast.success('🎉 Handover confirmed! Item is now active in your borrowings.');
      } else {
        await api.post(`/requests/${request.id}/confirm-return-dropoff`, {
          photoUrl: photoUrl || '',
          conditionNote: conditionNote.trim(),
        });
        toast.success('🎉 Return confirmed! Item returned safely.');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to confirm collection. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDropTime = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-5 sm:p-7 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white">
                  {isPickupMode ? 'Collect from Drop-off Spot' : 'Confirm Return Collection'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {request.itemTitle}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Spot Details Card */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 space-y-3">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Drop-off Spot
              </p>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">
                {dropoffLoc || 'Security Desk / Porch'}
              </p>
              {dropoffTime && (
                <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  Dropped off at {formatDropTime(dropoffTime)}
                </p>
              )}
            </div>
          </div>

          {/* Passcode (If Pickup Mode & passcode exists) */}
          {isPickupMode && passcode && (
            <div className="pt-2 border-t border-gray-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  Show Guard this Passcode:
                </span>
                <span className="text-xl font-black font-mono tracking-widest text-gray-900 dark:text-white mt-0.5 inline-block">
                  {passcode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyPasscode}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
              >
                {copiedPasscode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          )}

          {/* Instructions note */}
          {dropoffNotice && (
            <div className="pt-2 border-t border-gray-200/60 dark:border-slate-700/60">
              <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Special Note:
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 italic">
                "{dropoffNotice}"
              </p>
            </div>
          )}
        </div>

        {/* Drop-off Proof Photo (if provided by dropper) */}
        {dropoffPic && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Camera className="w-3.5 h-3.5 text-primary-500" />
              Drop-off Spot Photo
            </label>
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 group bg-black/5">
              <img
                src={dropoffPic}
                alt="Item at drop-off spot"
                className="w-full h-44 object-cover group-hover:scale-102 transition duration-300"
              />
              <a
                href={dropoffPic}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition backdrop-blur-xs text-xs flex items-center gap-1"
                title="View full image"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold backdrop-blur-xs">
                📸 Left at spot by {isPickupMode ? request.ownerName : request.borrowerName}
              </div>
            </div>
          </div>
        )}

        {/* Optional Condition Photo Taken Upon Collection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-primary-500" />
              Snap Condition Upon Collecting (Optional)
            </span>
            <span className="text-[10px] text-gray-400 font-normal lowercase">for your protection</span>
          </label>

          {photoUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700">
              <img
                src={photoUrl}
                alt="Collection proof"
                className="w-full h-36 object-cover"
              />
              <button
                type="button"
                onClick={() => setPhotoUrl('')}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition backdrop-blur-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-emerald-400 rounded-2xl p-4 text-center cursor-pointer transition bg-gray-50/50 dark:bg-slate-800/30 group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoCapture}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                <Camera className="w-4 h-4 text-emerald-500" />
                {uploadingPhoto ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                  </span>
                ) : (
                  'Take quick snapshot of item received'
                )}
              </div>
            </div>
          )}
        </div>

        {/* Optional note */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Condition Note (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Received in pristine condition with all accessories."
            value={conditionNote}
            onChange={(e) => setConditionNote(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder-gray-400 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden transition"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmCollection}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {isPickupMode ? 'I Have Collected the Item' : 'Confirm Return Received'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactlessCollectModal;
