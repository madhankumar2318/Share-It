import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Camera, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Save, 
  Loader2, 
  Trash2, 
  Info, 
  MessageSquare, 
  Star,
  Settings as SettingsIcon,
  Shield,
  Bell,
  Sliders,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { compressImage } from '../utils/imageCompressor';

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');
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
        // Fallback to auth context
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
      // Compress image client-side before upload to preserve DB performance
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

      // Update auth context state and localStorage
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

      toast.success('Profile and neighborhood identity updated! ✨');
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <SettingsIcon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Account & Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your personal profile, community identity, and sharing preferences
          </p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-1.5 lg:col-span-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition text-left border ${
              activeTab === 'profile'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div className="flex-1">
              <span>Profile & Neighborhood</span>
              <p className="text-[11px] font-normal text-gray-400 mt-0.5">Identity, bio, and locality</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition text-left border ${
              activeTab === 'privacy'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div className="flex-1">
              <span>Privacy & Trust</span>
              <p className="text-[11px] font-normal text-gray-400 mt-0.5">Phone shield & visibility</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition text-left border ${
              activeTab === 'notifications'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <span>Polite Reminders</span>
              <p className="text-[11px] font-normal text-gray-400 mt-0.5">Alerts & WhatsApp pings</p>
            </div>
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Form Card */}
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
                        title="Upload profile photo"
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
                        Profile Avatar & Identity Photo
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
                        Upload a photo so neighbors can easily recognize you during tool handovers.
                        Photos are automatically compressed client-side (~150KB) to ensure rapid loading.
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                        >
                          {uploadingAvatar ? 'Compressing...' : 'Upload Photo'}
                        </button>
                        {formData.avatarUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
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
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                          placeholder="Your full name"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                        Email Address <span className="text-rose-500">*</span>
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
                          Phone Number (WhatsApp Handover)
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
                      <p className="text-[11px] text-gray-400">
                        Used to coordinate item pickups, drop-offs, and polite return pings.
                      </p>
                    </div>

                    {/* Neighborhood / Apartment Tag */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                          Neighborhood / Community Tag
                        </label>
                        <span className="text-[10px] text-gray-400">Locality</span>
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
                        Helps neighbors know your locality so they can estimate proximity.
                      </p>
                    </div>
                  </div>

                  {/* Neighbor Bio / Introduction */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                        Neighbor Bio & Sharing Introduction
                      </label>
                      <span className="text-[11px] text-gray-400">
                        {formData.bio.length}/1000 characters
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
                      A warm introduction builds immediate trust with other lenders and borrowers in your area.
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
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Profile & Neighborhood</span>
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
                    <span>Live Preview: How Neighbors See You in Share-It</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full">
                    Community Card
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
                          Verified Neighbor
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                        {formData.neighborhood ? (
                          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                            <MapPin className="w-3.5 h-3.5" />
                            {formData.neighborhood}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">No neighborhood set</span>
                        )}
                        {formData.phone && (
                          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            WhatsApp Enabled
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
                        ({trustScore.totalReviews || 0} reviews)
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
                      Sign Out of Share-It
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Logged in as <strong className="text-gray-800 dark:text-gray-200 font-semibold">{user?.email}</strong>. Safely end your active session on this device.
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
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Privacy & Contact Shield
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Control who can see your phone number and location precision
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Phone Number Handover Shield
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                      Your phone number is only revealed to a borrower or lender once a request is formally ACCEPTED.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold">
                    Active (Protected)
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      In-App End-to-End Chat
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                      Communicate directly within Share-It without giving out personal social media or numbers.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-full text-xs font-bold">
                    Enabled
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Polite Return Reminders & Notification Preferences
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automated reminders to prevent awkward neighbor phone calls
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Automated 12h & Same-Day Polite Reminders
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                      Automatically nudges borrowers 12–24h before return with 1-click extension options.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold">
                    Automated (Cron 9AM & 6PM)
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      1-Tap WhatsApp Polite Ping
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                      Allows lenders to send pre-formatted friendly nudges with a 12-hour anti-spam shield.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
