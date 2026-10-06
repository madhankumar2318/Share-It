import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Camera, 
  Sparkles, 
  Save, 
  Loader2, 
  Trash2, 
  Star,
  LogOut,
  Globe2,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { compressImage } from '../utils/imageCompressor';

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const { language, changeLanguage, t, currentLang, languages } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [trustScore, setTrustScore] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    neighborhood: '',
    bio: '',
    avatarUrl: '',
  });

  // Fetch current user profile details & trust score
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users/profile');
        if (res.data) {
          setFormData({
            fullName: res.data.fullName || '',
            email: res.data.email || '',
            phone: res.data.phone || '',
            neighborhood: res.data.neighborhood || '',
            bio: res.data.bio || '',
            avatarUrl: res.data.avatarUrl || '',
          });
        }
        if (user?.id) {
          const trustRes = await api.get(`/users/${user.id}/trust-score`);
          setTrustScore(trustRes.data);
        }
      } catch (err) {
        console.error('Failed to load user profile', err);
        if (user) {
          setFormData({
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            neighborhood: user.neighborhood || '',
            bio: user.bio || '',
            avatarUrl: user.avatarUrl || '',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle client-side compressed photo upload
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, WebP).');
      return;
    }

    setUploadingAvatar(true);
    try {
      const compressedBlob = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
        maxSizeKB: 200,
      });

      const uploadData = new FormData();
      uploadData.append('file', compressedBlob, file.name);

      const res = await api.post('/files/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const photoUrl = res.data.fileUrl || res.data.url;
      setFormData((prev) => ({ ...prev, avatarUrl: photoUrl }));
      toast.success('Profile photo uploaded and compressed! 🎉');
    } catch (err) {
      console.error('Failed to upload avatar', err);
      toast.error(err.response?.data?.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatarUrl: '' }));
    toast.info('Profile photo removed. Save changes to confirm.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Full name is required.');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email address is required.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/users/profile', {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        neighborhood: formData.neighborhood.trim(),
        bio: formData.bio.trim(),
        avatarUrl: formData.avatarUrl,
      });

      updateUser(
        {
          ...user,
          fullName: res.data.fullName,
          email: res.data.email,
          phone: res.data.phone,
          neighborhood: res.data.neighborhood,
          bio: res.data.bio,
          avatarUrl: res.data.avatarUrl,
        },
        res.data.token
      );

      toast.success(t('savedSuccess', 'Profile and neighborhood identity updated! ✨'));
    } catch (err) {
      console.error('Failed to update profile', err);
      toast.error(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-slate-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
          <User className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          {t('settingsTitle')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('settingsSubtitle')}
        </p>
      </div>

      {/* 🌐 App Language Switcher Card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex-shrink-0">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {t('languageSectionTitle')}
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full">
                {currentLang.nativeName}
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('languageSectionDesc')}
            </p>
          </div>
        </div>

        {/* Language Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2.5 pt-1">
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  changeLanguage(lang.code);
                  toast.success(`${lang.flag} ${t('langChangedToast')}`);
                }}
                className={`p-3 rounded-2xl text-xs font-semibold transition flex items-center justify-between border ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-800 hover:bg-emerald-50/50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{lang.flag}</span>
                  <div className="text-left">
                    <span className="block font-bold">{lang.nativeName}</span>
                    <span className="block text-[10px] text-gray-400 font-normal">{lang.name}</span>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Profile Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-gray-100 dark:border-slate-800">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-3xl shadow-md border-2 border-white dark:border-slate-800">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt={formData.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{getInitials(formData.fullName || user?.fullName)}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-2 -right-2 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition border-2 border-white dark:border-slate-800"
                title={t('uploadPhoto')}
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {t('profileAvatarTitle')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
                {t('profileAvatarDesc')}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  {uploadingAvatar ? t('compressing') : t('uploadPhoto')}
                </button>
                {formData.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('remove')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Personal Details Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                {t('fullName')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder={t('fullName')}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                {t('email')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {t('phone')}
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  1-Tap WhatsApp
                </span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>
            </div>

            {/* Neighborhood / Apartment Tag */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {t('neighborhood')}
                </label>
              </div>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleInputChange}
                  placeholder="e.g. Green Glen Layout, Bellandur, Bengaluru"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                {t('neighborhoodDesc')}
              </p>
            </div>
          </div>

          {/* Neighbor Bio / Introduction */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                {t('bio')}
              </label>
              <span className="text-[11px] text-gray-400">
                {formData.bio.length}/1000
              </span>
            </div>
            <div className="relative">
              <FileText className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <textarea
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleInputChange}
                maxLength={1000}
                placeholder="e.g., DIY enthusiast & gardener — happy to lend power drills, ladder, car pressure washer, and camping gear! Let's build a greener neighborhood together."
                className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none"
              />
            </div>
            <p className="text-[11px] text-gray-400">
              {t('bioDesc')}
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('saving')}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t('saveProfile')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live Neighborhood Identity Card Preview */}
      <div className="bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('livePreviewTitle')}</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full">
            {t('communityCard')}
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-xs border border-emerald-400/30 flex-shrink-0">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt={formData.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(formData.fullName || user?.fullName)}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-gray-900 dark:text-white text-base">
                  {formData.fullName || user?.fullName || 'Neighbor'}
                </h4>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md text-[10px] font-bold">
                  {t('verifiedNeighbor')}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                {formData.neighborhood ? (
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {formData.neighborhood}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">{t('noNeighborhoodSet')}</span>
                )}
                {formData.phone && (
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Phone className="w-3 h-3 text-emerald-500" />
                    {t('whatsappEnabled')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {trustScore && (
            <div className="flex items-center gap-2 self-end sm:self-auto px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-black text-amber-800 dark:text-amber-200">
                {trustScore.averageRating?.toFixed(1) || '5.0'}
              </span>
              <span className="text-gray-400 text-[11px]">
                ({trustScore.totalReviews || 0})
              </span>
            </div>
          )}
        </div>

        {formData.bio && (
          <p className="text-xs text-gray-600 dark:text-gray-300 italic bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
            "{formData.bio}"
          </p>
        )}
      </div>

      {/* 🚪 Session & Sign Out Card inside Settings */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 flex-shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              {t('signOutTitle')}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('signOutDesc')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-2xs whitespace-nowrap self-end sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('signOutButton')}</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;
