import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  MapPin, 
  RefreshCw, 
  Loader2, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  DoorOpen, 
  PackageCheck,
  KeyRound
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { compressImage } from '../utils/imageCompressor';

const PRESET_LOCATIONS = [
  { label: 'Gate Security Desk', icon: Building2, desc: 'Left with apartment gate security guard' },
  { label: 'Doorstep / Shoe Rack', icon: DoorOpen, desc: 'Placed safely outside flat door' },
  { label: 'Tower Lobby / Reception', icon: Building2, desc: 'Left at reception or parcel area' },
];

const generatePasscode = () => String(Math.floor(1000 + Math.random() * 9000));

const ContactlessDropoffModal = ({ 
  isOpen, 
  onClose, 
  request, 
  mode = 'pickup', // 'pickup' (owner dropping off) or 'return' (borrower returning)
  onSuccess 
}) => {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [note, setNote] = useState('');
  const [passcode, setPasscode] = useState(() => generatePasscode());
  const [submitting, setSubmitting] = useState(false);

  // Hook rules: declare before early return
  if (!isOpen || !request) return null;

  const isPickupMode = mode === 'pickup';
  const effectiveLocation = customLocation.trim() || location;

  const handleSelectPreset = (presetLabel) => {
    setLocation(presetLabel);
    setCustomLocation('');
  };

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid photo (JPEG, PNG, WebP)');
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
        toast.success('Drop-off spot photo uploaded! 📸');
      }
    } catch {
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!effectiveLocation) {
      toast.error('Please specify where you left the item (e.g. Gate Security)');
      return;
    }

    setSubmitting(true);
    try {
      if (isPickupMode) {
        await api.post(`/requests/${request.id}/dropoff`, {
          location: effectiveLocation,
          photoUrl: photoUrl || '',
          note: note.trim(),
          passcode: passcode,
        });
        toast.success('🚪 Contactless drop-off recorded! Borrower has been notified.');
      } else {
        await api.post(`/requests/${request.id}/return-dropoff`, {
          location: effectiveLocation,
          photoUrl: photoUrl || '',
          note: note.trim(),
        });
        toast.success('🚪 Return drop-off recorded! Owner has been notified.');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record drop-off. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
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
              <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white">
                  {isPickupMode ? 'Contactless / Guard Drop-off' : 'Return via Drop-off'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isPickupMode 
                    ? `Drop "${request.itemTitle}" safely without waiting to meet in person`
                    : `Leave "${request.itemTitle}" at security or porch for owner retrieval`}
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preset Location Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-primary-500" />
              Drop-off Spot / Location <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESET_LOCATIONS.map((preset) => {
                const isSelected = location === preset.label && !customLocation;
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPreset(preset.label)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col items-start gap-1.5 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/30 text-primary-900 dark:text-primary-100'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                    <span className="text-xs font-bold leading-tight">{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Location Input */}
            <input
              type="text"
              placeholder="Or type specific spot (e.g. Tower B - Flat 402 shoe rack, Guard Bahadur)"
              value={customLocation}
              onChange={(e) => {
                setCustomLocation(e.target.value);
                if (e.target.value) setLocation('');
              }}
              className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder-gray-400 text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-hidden transition"
            />
          </div>

          {/* Photo Snap / Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-primary-500" />
                Proof Photo at Spot
              </span>
              <span className="text-[10px] text-gray-400 font-normal lowercase">recommended</span>
            </label>

            {photoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                <img 
                  src={photoUrl} 
                  alt="Drop-off proof" 
                  className="w-full h-44 object-cover" 
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition backdrop-blur-xs"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold backdrop-blur-xs flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Photo Attached
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 rounded-2xl p-5 text-center cursor-pointer transition bg-gray-50/50 dark:bg-slate-800/30 group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoCapture} 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xs group-hover:scale-105 transition text-gray-500 group-hover:text-primary-500">
                    {uploadingPhoto ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {uploadingPhoto ? 'Compressing & uploading...' : 'Snap or upload photo of the item'}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Helps the other person easily identify where the item is sitting
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Passcode (Only for pickup drop-off) */}
          {isPickupMode && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Guard / Collection Passcode
                </div>
                <button
                  type="button"
                  onClick={() => setPasscode(generatePasscode())}
                  className="text-[11px] text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black font-mono tracking-widest text-amber-900 dark:text-amber-100">
                    {passcode}
                  </span>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                    Write on package or tell guard Bahadur. Borrower shows this code to collect.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Note / Special Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Instructions for {isPickupMode ? 'Borrower' : 'Owner'} (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Left in a green canvas bag. Guard on duty is Bahadur. You can pick up anytime before 10 PM."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder-gray-400 text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-hidden transition resize-none"
            />
          </div>

          {/* Safety Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-blue-900 dark:text-blue-200 text-xs">
            <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              {isPickupMode 
                ? 'Once you record drop-off, the borrower gets an instant alert with your photo, spot details, and passcode.'
                : 'Owner will receive your drop-off photo and spot location so they can retrieve it at their convenience.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !effectiveLocation}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 shadow-md shadow-primary-500/20 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Recording Drop-off...
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" />
                  {isPickupMode ? 'Confirm Drop-off & Notify Borrower' : 'Confirm Return Drop-off'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactlessDropoffModal;
