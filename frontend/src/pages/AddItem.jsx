import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PlusCircle, AlertCircle, ArrowLeft, Upload, CheckCircle2, Image as ImageIcon, MapPin, Loader2, Sparkles } from 'lucide-react';

const CATEGORIES = [
  'Electronics',
  'Tools & DIY',
  'Outdoors & Camping',
  'Home & Kitchen',
  'Books & Study',
  'Sports & Fitness',
  'Party & Games',
];

const AddItem = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Derive registered profile location if available
  const userProfileLocation = [
    user?.city,
    user?.district,
    user?.state,
    user?.pincode ? `(${user.pincode})` : ''
  ]
    .filter(Boolean)
    .join(', ');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    imageUrl: '',
    location: '',
  });

  // Pre-fill location from logged-in user profile once available
  useEffect(() => {
    if (userProfileLocation && !formData.location) {
      setFormData((prev) => ({ ...prev, location: userProfileLocation }));
    }
  }, [userProfileLocation]);

  const [quickPin, setQuickPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinStatus, setPinStatus] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Quick 6-digit PIN code auto-fill for item location
  const handleQuickPinChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setQuickPin(pin);
    setPinStatus('');

    if (pin.length === 6) {
      setPinLoading(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await response.json();
        if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          const autoLoc = `${po.Name}, ${po.District}, ${po.State} (${pin})`;
          setFormData((prev) => ({ ...prev, location: autoLoc }));
          setPinStatus(`✅ Auto-filled: ${po.District}`);
        } else {
          setPinStatus('⚠️ Invalid PIN code');
        }
      } catch (err) {
        setPinStatus('⚠️ Could not lookup PIN');
      } finally {
        setPinLoading(false);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (PNG, JPG, WEBP)');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return null;
    const uploadData = new FormData();
    uploadData.append('file', selectedFile);

    setUploadingImage(true);
    try {
      const response = await api.post('/files/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.fileUrl;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Fix 4 Validation: Either a device photo or an image URL is mandatory
    if (!selectedFile && !formData.imageUrl.trim()) {
      setError('Item photo is mandatory. Please upload an image from your device or provide an image URL.');
      return;
    }

    // Fix 3 Validation: Description is mandatory
    if (!formData.description.trim()) {
      setError('Description & Guidelines are required. Please describe the item condition and instructions.');
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = formData.imageUrl.trim();

      // If user selected a file from device, upload it first
      if (selectedFile) {
        finalImageUrl = await handleUploadImage();
      }

      await api.post('/items', {
        ...formData,
        imageUrl: finalImageUrl,
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to list item.');
    } finally {
      setLoading(false);
    }
  };

  const hasPhoto = !!selectedFile || !!formData.imageUrl.trim();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-emerald-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">List an Item for Lending</h1>
          <p className="text-sm text-gray-500 mt-1">
            Share what you don't regularly use with your community 🇮🇳
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Item Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Item Title *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Sony Alpha A6400 Camera or DeWalt Cordless Drill"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm"
            />
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Location with Auto-fill helper */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700">Location *</label>
                {userProfileLocation && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, location: userProfileLocation }))}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 hover:underline"
                    title="Auto-fill with your registered profile address"
                  >
                    <Sparkles className="w-3 h-3" />
                    Use Profile Location
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Musiri, Tiruchirappalli, Tamil Nadu"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm"
                />
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Location PIN Code Quick-Lookup Bar */}
          <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs">
            <span className="font-semibold text-gray-600 whitespace-nowrap flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              PIN Auto-Fill:
            </span>
            <input
              type="text"
              maxLength={6}
              value={quickPin}
              onChange={handleQuickPinChange}
              placeholder="Type 6-digit PIN (e.g. 621211)"
              className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 tracking-wider font-semibold w-52"
            />
            {pinLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />}
            {pinStatus && <span className="text-[11px] font-medium text-emerald-700">{pinStatus}</span>}
          </div>

          {/* Photo Upload Box - MANDATORY */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Item Photo * <span className="text-xs font-normal text-gray-500">(Upload from device OR paste Image URL)</span>
              </label>
              {hasPhoto ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Photo Ready
                </span>
              ) : (
                <span className="text-xs text-amber-600 font-medium">Required *</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="w-full sm:w-1/2 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition bg-slate-50">
                <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                <span className="text-xs font-semibold text-gray-700">Upload from Device</span>
                <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Preview */}
              <div className="w-full sm:w-1/2 h-36 rounded-2xl bg-slate-100 border border-gray-200 overflow-hidden flex items-center justify-center relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="URL Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs">No image selected yet</span>
                  </div>
                )}
              </div>
            </div>

            {/* URL input */}
            <div className="mt-3">
              <span className="text-xs text-gray-500 block mb-1">Or paste an Image Web URL:</span>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value) setPreviewUrl('');
                }}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Description - MANDATORY */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description & Guidelines *</label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe condition, accessories included, rules, or any instructions for borrowers..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            {loading || uploadingImage ? 'Uploading & Publishing...' : 'List Item Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItem;
