import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { INDIAN_LOCATIONS } from '../data/indianLocations';
import { getItemCoordinates } from '../utils/geo';
import { 
  PlusCircle, 
  AlertCircle, 
  ArrowLeft, 
  Upload, 
  CheckCircle2, 
  Image as ImageIcon, 
  MapPin, 
  Loader2, 
  Search,
  Coins,
  Baby,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { compressImage } from '../utils/imageCompressor';
import VoiceNoteRecorder from '../components/VoiceNoteRecorder';

const CATEGORIES = [
  'Electronics',
  'Tools & DIY',
  'Outdoors & Camping',
  'Home & Kitchen',
  'Books & Study',
  'Sports & Fitness',
  'Party & Games',
  'Kids & Play Rotation',
];

const AddItem = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    imageUrl: '',
    dailyRate: '',
    securityDeposit: '',
    ageGroup: '',
    isCleanedSanitized: false,
    seasonalTag: 'NONE',
    seasonalActive: true,
    voiceNoteUrl: '',
    voiceNoteDuration: 0,
  });

  // Structured Indian location states for lending pickup point
  const [locationData, setLocationData] = useState({
    pincode: '',
    state: '',
    district: '',
    area: '',
    landmark: '',
  });

  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeMessage, setPincodeMessage] = useState('');
  const [availablePostOffices, setAvailablePostOffices] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Indian Postal PIN code auto-lookup (6 digits)
  const handlePincodeChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setLocationData((prev) => ({ ...prev, pincode: pin }));
    setPincodeMessage('');
    setAvailablePostOffices([]);

    if (pin.length === 6) {
      setPincodeLoading(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await response.json();

        if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const poList = data[0].PostOffice;
          const firstPO = poList[0];

          const apiState = firstPO.State || '';
          const matchedState = Object.keys(INDIAN_LOCATIONS).find(
            (s) => s.toLowerCase() === apiState.toLowerCase()
          ) || apiState || locationData.state;

          const districtList = INDIAN_LOCATIONS[matchedState] || [];
          const apiDistrict = firstPO.District || '';
          const matchedDistrict = districtList.find(
            (d) => d.toLowerCase() === apiDistrict.toLowerCase()
          ) || apiDistrict;

          const poNames = poList.map((po) => po.Name);
          setAvailablePostOffices(poNames);

          setLocationData((prev) => ({
            ...prev,
            pincode: pin,
            state: matchedState,
            district: matchedDistrict,
            area: poNames[0] || prev.area,
          }));

          setPincodeMessage(`✅ Verified: ${matchedDistrict}, ${matchedState}`);
        } else {
          setPincodeMessage('⚠️ Invalid Indian PIN code. Please check.');
        }
      } catch (err) {
        setPincodeMessage('⚠️ Could not verify PIN code online. You can choose manually.');
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setLocationData((prev) => ({
      ...prev,
      state: selectedState,
      district: '',
      area: '',
    }));
    setAvailablePostOffices([]);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    setUploadingImage(true);
    try {
      const compressedFile = await compressImage(selectedFile, { maxWidth: 1280, maxHeight: 1280, quality: 0.75 });
      const uploadData = new FormData();
      uploadData.append('file', compressedFile);

      const response = await api.post('/files/upload', uploadData);
      return response.data.fileUrl;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to upload photo';
      throw new Error(msg);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Category is mandatory
    if (!formData.category) {
      setError('Please choose a valid Category for your item.');
      return;
    }

    // Photo is mandatory (file upload OR image URL)
    if (!selectedFile && !formData.imageUrl.trim()) {
      setError('Item photo is required. Please upload an image from your device or paste an image URL.');
      return;
    }

    // Description is mandatory
    if (!formData.description.trim()) {
      setError('Description & Guidelines are required. Please describe the item condition and rules.');
      return;
    }

    // Location validation
    if (!locationData.district || !locationData.state) {
      setError('Please select your State and District for the pickup location (or enter 6-digit PIN code).');
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = formData.imageUrl.trim();

      // If user selected a file from device, upload it first
      if (selectedFile) {
        finalImageUrl = await handleUploadImage();
      }

      // Combine structured location into comprehensive pickup address
      const formattedLocation = [
        locationData.landmark,
        locationData.area,
        locationData.district,
        locationData.state,
        locationData.pincode ? `(${locationData.pincode})` : ''
      ]
        .filter(Boolean)
        .join(', ');

      // Auto-resolve neighborhood coordinates for interactive map
      const sampleCoords = getItemCoordinates({ location: formattedLocation, id: Date.now() });

      await api.post('/items', {
        ...formData,
        dailyRate: formData.dailyRate ? Math.max(0, parseFloat(formData.dailyRate)) : 0,
        securityDeposit: formData.securityDeposit ? Math.max(0, parseFloat(formData.securityDeposit)) : 0,
        imageUrl: finalImageUrl,
        location: formattedLocation,
        latitude: sampleCoords?.lat || null,
        longitude: sampleCoords?.lng || null,
      });

      toast.success('🎉 Your item has been listed to the community catalog!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to list item.');
    } finally {
      setLoading(false);
    }
  };

  const availableDistricts = INDIAN_LOCATIONS[locationData.state] || [];
  const hasPhoto = !!selectedFile || !!formData.imageUrl.trim();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-5 sm:space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Post an Item for Lending</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Share what you don't regularly use with your community 🇮🇳
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Item Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Item Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Sony Alpha A6400 Camera or DeWalt Drill"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Category *</label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-medium"
              >
                <option value="">-- Choose Category * --</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Structured Indian Pickup Location Box */}
          <div className="p-5 bg-slate-50/80 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Pickup / Handover Location 🇮🇳 *</span>
            </div>

            {/* PIN Code Lookup */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                6-Digit Indian PIN Code (Auto-Fills State, District & Town)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={locationData.pincode}
                  onChange={handlePincodeChange}
                  placeholder="Enter 6-digit PIN code"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none tracking-widest"
                />
                <div className="absolute right-3 top-2.5">
                  {pincodeLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Search className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              {pincodeMessage && (
                <p className={`text-[11px] mt-1 font-medium ${pincodeMessage.includes('✅') ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  {pincodeMessage}
                </p>
              )}
            </div>

            {/* State and District Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">State / UT *</label>
                <select
                  value={locationData.state}
                  onChange={handleStateChange}
                  required
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                >
                  <option value="">-- Choose State / UT * --</option>
                  {Object.keys(INDIAN_LOCATIONS).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">District / City *</label>
                <select
                  value={locationData.district}
                  onChange={(e) => setLocationData((prev) => ({ ...prev, district: e.target.value }))}
                  required
                  disabled={!locationData.state}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium disabled:bg-gray-100 dark:disabled:bg-slate-800/50 disabled:text-gray-400"
                >
                  <option value="">
                    {locationData.state ? '-- Choose District * --' : '-- Choose State First --'}
                  </option>
                  {locationData.district && !availableDistricts.includes(locationData.district) && (
                    <option value={locationData.district}>{locationData.district}</option>
                  )}
                  {availableDistricts.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Town / Pickup Locality Dropdown & Landmark */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Town / Area / Locality *
                </label>
                {availablePostOffices.length > 0 ? (
                  <select
                    value={locationData.area}
                    onChange={(e) => setLocationData((prev) => ({ ...prev, area: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                  >
                    <option value="">-- Choose Locality --</option>
                    {availablePostOffices.map((po) => (
                      <option key={po} value={po}>
                        {po}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={locationData.area}
                    onChange={(e) => setLocationData((prev) => ({ ...prev, area: e.target.value }))}
                    placeholder="Enter town or locality"
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl border border-gray-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Landmark / Street / Gate (Optional)
                </label>
                <input
                  type="text"
                  value={locationData.landmark}
                  onChange={(e) => setLocationData((prev) => ({ ...prev, landmark: e.target.value }))}
                  placeholder="Enter landmark or street (optional)"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl border border-gray-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Photo Upload Box - MANDATORY */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Item Photo * <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(Upload from device OR paste Image URL)</span>
              </label>
              {hasPhoto && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Photo Ready
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="w-full sm:w-1/2 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition bg-slate-50 dark:bg-slate-800/40">
                <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Upload from Device</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">PNG, JPG, WEBP up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Preview */}
              <div className="w-full sm:w-1/2 h-36 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 overflow-hidden flex items-center justify-center relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="URL Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs">No image selected yet</span>
                  </div>
                )}
              </div>
            </div>

            {/* URL input */}
            <div className="mt-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Or paste an Image Web URL:</span>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value) setPreviewUrl('');
                }}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Description - MANDATORY */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description & Guidelines *</label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe condition, accessories included, rules, or any instructions for borrowers..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm"
            />
          </div>

          {/* Pricing & Refundable Security Deposit Section */}
          <div className="p-4 sm:p-5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Rental Pricing & Advance Deposit (Optional)
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Set daily borrow rent and refundable advance caution deposit, or leave as ₹0 for free sharing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Daily Rental Fee (₹ / day)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="dailyRate"
                    value={formData.dailyRate}
                    onChange={handleChange}
                    placeholder="0 (Free to borrow)"
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">Leave 0 if you are lending for free.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Advance Security Deposit (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="securityDeposit"
                    value={formData.securityDeposit}
                    onChange={handleChange}
                    placeholder="0 (No advance deposit)"
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">Upfront deposit returned to borrower minus rental fee.</span>
              </div>
            </div>

            {(Number(formData.dailyRate) > 0 || Number(formData.securityDeposit) > 0) && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-slate-800 text-[11px] text-gray-600 dark:text-gray-300 space-y-1">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  💡 Net Settlement Preview (Example: 1-Day Borrow)
                </span>
                <p>
                  • Upfront Advance collected at pickup: <strong>₹{Number(formData.securityDeposit) || 0}</strong>
                </p>
                <p>
                  • Rental charge earned: <strong>₹{Number(formData.dailyRate) || 0}</strong>
                </p>
                <p>
                  • Net refund you return to neighbor: <strong>₹{Math.max(0, (Number(formData.securityDeposit) || 0) - (Number(formData.dailyRate) || 0))}</strong>
                </p>
              </div>
            )}
          </div>

          {/* 🧸 Toy & Book Rotate Club (Kids & Family Gear) */}
          {(formData.category === 'Kids & Play Rotation' || formData.category === 'Books & Study' || formData.category === 'Party & Games') && (
            <div className="p-4 sm:p-5 bg-pink-50/60 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/60 rounded-2xl space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-600 text-white rounded-xl shadow-xs">
                  <Baby className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    🧸 Kids & Play Rotation Details
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Help neighborhood parents find toys & books suited for their child's age group
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Recommended Age Group
                  </label>
                  <select
                    name="ageGroup"
                    value={formData.ageGroup}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl border border-pink-200 dark:border-pink-900/60 text-xs focus:ring-2 focus:ring-pink-500 outline-none"
                  >
                    <option value="">-- Choose Age Range --</option>
                    <option value="0-2 yrs">👶 0 - 2 years (Babies & Toddlers)</option>
                    <option value="3-5 yrs">🧒 3 - 5 years (Preschool & Kindergarten)</option>
                    <option value="6-8 yrs">👦 6 - 8 years (Early Elementary)</option>
                    <option value="9-12 yrs">🧑 9 - 12 years (Pre-Teens)</option>
                    <option value="All Ages">👨‍👩‍👧 All Ages / Family Fun</option>
                  </select>
                </div>

                <div className="flex items-center pt-2 sm:pt-5">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-700 dark:text-gray-300 font-medium select-none">
                    <input
                      type="checkbox"
                      name="isCleanedSanitized"
                      checked={formData.isCleanedSanitized}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isCleanedSanitized: e.target.checked }))}
                      className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-gray-300 dark:border-slate-700"
                    />
                    <span>🧼 Sanitized & Cleaned for Child Safety</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 🪔 Seasonal Festival & Event Vault */}
          <div className="p-4 sm:p-5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  🪔 Seasonal Festival & Event Vault
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Tag items used during festivals, holidays, or special occasions for spotlight discovery
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Seasonal Occasion Tag
                </label>
                <select
                  name="seasonalTag"
                  value={formData.seasonalTag}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="NONE">None (Regular Year-Round Item)</option>
                  <option value="DIWALI_FESTIVE">🪔 Diwali & Festive Spotlight (Lights, Pooja, Decor)</option>
                  <option value="TRAVEL_CAMPING">⛺ Travel, Trekking & Vacation (Luggage, Tents)</option>
                  <option value="PARTY_CELEBRATION">🎈 Party, Birthday & Events (Grill, Mic, Projector)</option>
                  <option value="SUMMER_MONSOON">🌧️ Monsoon & Seasonal Comfort</option>
                </select>
              </div>

              {formData.seasonalTag !== 'NONE' && (
                <div className="flex items-center pt-2 sm:pt-5">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-amber-900 dark:text-amber-200 font-medium select-none">
                    <input
                      type="checkbox"
                      name="seasonalActive"
                      checked={formData.seasonalActive}
                      onChange={(e) => setFormData((prev) => ({ ...prev, seasonalActive: e.target.checked }))}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-gray-300 dark:border-slate-700"
                    />
                    <span>🔥 Feature this item in Current Seasonal Vault</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* 🎙️ Voice Note Care Instructions (Audio Guide) */}
          <VoiceNoteRecorder
            existingUrl={formData.voiceNoteUrl}
            existingDuration={formData.voiceNoteDuration}
            onAudioUploaded={({ voiceNoteUrl, voiceNoteDuration }) => {
              setFormData((prev) => ({ ...prev, voiceNoteUrl, voiceNoteDuration }));
            }}
            onAudioRemoved={() => {
              setFormData((prev) => ({ ...prev, voiceNoteUrl: '', voiceNoteDuration: 0 }));
            }}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            {loading || uploadingImage ? 'Uploading Photo & Publishing...' : 'Post Item for Lending'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItem;
