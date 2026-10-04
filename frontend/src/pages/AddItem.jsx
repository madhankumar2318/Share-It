import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { INDIAN_LOCATIONS } from '../data/indianLocations';
import { 
  PlusCircle, 
  AlertCircle, 
  ArrowLeft, 
  Upload, 
  CheckCircle2, 
  Image as ImageIcon, 
  MapPin, 
  Loader2, 
  Sparkles, 
  Search 
} from 'lucide-react';

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

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    imageUrl: '',
  });

  // Structured Indian location states for lending pickup point
  const [locationData, setLocationData] = useState({
    pincode: '',
    state: 'Tamil Nadu',
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

  // Pre-populate with logged-in user's profile location if present
  useEffect(() => {
    if (user) {
      const userState = user.state || 'Tamil Nadu';
      const userDistrict = user.district || INDIAN_LOCATIONS[userState]?.[0] || '';
      setLocationData({
        pincode: user.pincode || '',
        state: userState,
        district: userDistrict,
        area: user.city || '',
        landmark: user.address || '',
      });
      if (user.city) {
        setAvailablePostOffices([user.city]);
      }
    }
  }, [user]);

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
    const defaultDistrict = INDIAN_LOCATIONS[selectedState]?.[0] || '';
    setLocationData((prev) => ({
      ...prev,
      state: selectedState,
      district: defaultDistrict,
      area: '',
    }));
    setAvailablePostOffices([]);
  };

  const handleUseProfileAddress = () => {
    if (user) {
      const userState = user.state || 'Tamil Nadu';
      const userDistrict = user.district || INDIAN_LOCATIONS[userState]?.[0] || '';
      setLocationData({
        pincode: user.pincode || '',
        state: userState,
        district: userDistrict,
        area: user.city || '',
        landmark: user.address || '',
      });
      if (user.city) {
        setAvailablePostOffices([user.city]);
      }
      setPincodeMessage(user.district ? `✅ Loaded from your profile: ${user.district}` : '');
    }
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
    const uploadData = new FormData();
    uploadData.append('file', selectedFile);

    setUploadingImage(true);
    try {
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
      setError('Please select your State and District for the pickup location.');
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

      await api.post('/items', {
        ...formData,
        imageUrl: finalImageUrl,
        location: formattedLocation,
      });

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
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Post an Item for Lending</h1>
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
          {/* Item Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Item Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Sony Alpha A6400 Camera or DeWalt Drill"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Structured Indian Pickup Location Box */}
          <div className="p-5 bg-slate-50/80 border border-gray-200 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Pickup / Handover Location 🇮🇳 *</span>
              </div>
              {user && (user.district || user.city || user.pincode) && (
                <button
                  type="button"
                  onClick={handleUseProfileAddress}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Use My Profile Address
                </button>
              )}
            </div>

            {/* PIN Code Lookup */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                6-Digit Indian PIN Code (Auto-Fills State, District & Town)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={locationData.pincode}
                  onChange={handlePincodeChange}
                  placeholder="Enter 6-digit PIN code"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none tracking-widest"
                />
                <div className="absolute right-3 top-2.5">
                  {pincodeLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <Search className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              {pincodeMessage && (
                <p className={`text-[11px] mt-1 font-medium ${pincodeMessage.includes('✅') ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {pincodeMessage}
                </p>
              )}
            </div>

            {/* State and District Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">State / UT *</label>
                <select
                  value={locationData.state}
                  onChange={handleStateChange}
                  className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                >
                  {Object.keys(INDIAN_LOCATIONS).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">District / City *</label>
                <select
                  value={locationData.district}
                  onChange={(e) => setLocationData((prev) => ({ ...prev, district: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                >
                  <option value="">-- Choose District --</option>
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
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Town / Area / Locality *
                </label>
                {availablePostOffices.length > 0 ? (
                  <select
                    value={locationData.area}
                    onChange={(e) => setLocationData((prev) => ({ ...prev, area: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
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
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Landmark / Street / Gate (Optional)
                </label>
                <input
                  type="text"
                  value={locationData.landmark}
                  onChange={(e) => setLocationData((prev) => ({ ...prev, landmark: e.target.value }))}
                  placeholder="Enter landmark or street (optional)"
                  className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
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
            {loading || uploadingImage ? 'Uploading Photo & Publishing...' : 'Post Item for Lending'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItem;
