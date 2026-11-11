import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useLocationFilter } from '../context/LocationContext';
import { INDIAN_LOCATIONS } from '../data/indianLocations';
import { X, Sparkles, AlertCircle, Loader2, MapPin, Search, CheckCircle2 } from 'lucide-react';

const CATEGORIES = [
  'Electronics',
  'Tools & DIY',
  'Outdoors & Camping',
  'Home & Kitchen',
  'Books & Study',
  'Sports & Fitness',
  'Party & Games',
];

const URGENCIES = [
  { label: '⚡ Urgently Today', value: 'Urgently Today' },
  { label: '⏳ Within 2 Days', value: 'Within 2 Days' },
  { label: '📅 This Weekend', value: 'This Weekend' },
  { label: '🌿 Flexible', value: 'Flexible' },
];

const CreateWishlistModal = ({ isOpen, onClose, onSuccess }) => {
  const { selectedLocation } = useLocationFilter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    urgency: 'Urgently Today',
  });

  // Structured Indian Location State
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
  const [availableDistricts, setAvailableDistricts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Indian Postal PIN code auto-lookup (6 digits)
  const handlePincodeLookup = async (pin) => {
    if (!pin || pin.length !== 6) return;
    setPincodeLoading(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await response.json();

      if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const poList = data[0].PostOffice;
        const firstPO = poList[0];

        const apiState = firstPO.State || '';
        const matchedState =
          Object.keys(INDIAN_LOCATIONS).find(
            (s) => s.toLowerCase() === apiState.toLowerCase()
          ) || apiState;

        const districtList = INDIAN_LOCATIONS[matchedState] || [];
        const apiDistrict = firstPO.District || '';
        const matchedDistrict =
          districtList.find(
            (d) => d.toLowerCase() === apiDistrict.toLowerCase()
          ) || apiDistrict;

        const poNames = poList.map((po) => po.Name);
        setAvailablePostOffices(poNames);
        setAvailableDistricts(districtList);

        const bestPO = poNames[0] || '';

        setLocationData((prev) => ({
          ...prev,
          pincode: pin,
          state: matchedState,
          district: matchedDistrict,
          area: prev.area && poNames.includes(prev.area) ? prev.area : bestPO,
        }));

        setPincodeMessage(`✅ Verified: ${bestPO ? bestPO + ', ' : ''}${matchedDistrict}, ${matchedState} (${pin})`);
      } else {
        setPincodeMessage('⚠️ Invalid Indian PIN code. Please check.');
      }
    } catch {
      setPincodeMessage('⚠️ Could not verify PIN code online. You can choose manually below.');
    } finally {
      setPincodeLoading(false);
    }
  };

  // Pre-fill location from active header filter or saved context on modal open
  useEffect(() => {
    if (!isOpen) return;

    if (selectedLocation && selectedLocation.type !== 'ALL') {
      if (selectedLocation.type === 'PINCODE' && selectedLocation.value) {
        const pin = String(selectedLocation.value).replace(/\D/g, '').slice(0, 6);
        if (pin.length === 6) {
          setLocationData((prev) => ({ ...prev, pincode: pin }));
          handlePincodeLookup(pin);
          return;
        }
      }

      if (selectedLocation.state) {
        const distList = INDIAN_LOCATIONS[selectedLocation.state] || [];
        setAvailableDistricts(distList);
        setLocationData((prev) => ({
          ...prev,
          state: selectedLocation.state,
          district: selectedLocation.district || selectedLocation.value || '',
        }));
      }
    }
  }, [isOpen, selectedLocation]);

  // Update district dropdown when state changes manually
  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    const districts = INDIAN_LOCATIONS[selectedState] || [];
    setAvailableDistricts(districts);
    setLocationData((prev) => ({
      ...prev,
      state: selectedState,
      district: '',
      area: '',
    }));
  };

  const handlePincodeChange = (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setLocationData((prev) => ({ ...prev, pincode: pin }));
    setPincodeMessage('');
    setAvailablePostOffices([]);

    if (pin.length === 6) {
      handlePincodeLookup(pin);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please specify what item you are looking for.');
      return;
    }

    if (!locationData.district || !locationData.state) {
      setError('Please provide your 6-digit PIN code (or select State and District) so neighbors know where you are asking from.');
      return;
    }

    // Combine structured location into clear, standardized format
    const formattedLocation = [
      locationData.area,
      locationData.landmark,
      locationData.district,
      locationData.state,
      locationData.pincode ? `(${locationData.pincode})` : '',
    ]
      .filter(Boolean)
      .join(', ');

    setLoading(true);
    try {
      await api.post('/wishlists', {
        ...formData,
        location: formattedLocation,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post item request.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Real-time preview of formatted address
  const previewAddress = [
    locationData.area,
    locationData.landmark,
    locationData.district,
    locationData.state,
    locationData.pincode ? `(${locationData.pincode})` : '',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Post a Community Request
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                Ask neighbors in your area to lend an item you need
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Item Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              What do you need to borrow? *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="E.g. 1080p Projector, Hammer Drill, DSLR Tripod, Camping Tent..."
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Category & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                When do you need it?
              </label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {URGENCIES.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 🇮🇳 Structured Indian Location Picker Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Your Location in India 🇮🇳 *</span>
              </div>
              <span className="text-[10px] text-gray-400">PIN code auto-fills city</span>
            </div>

            {/* 6-Digit PIN Code Input */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                6-Digit PIN Code (e.g. 621211) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={locationData.pincode}
                  onChange={handlePincodeChange}
                  placeholder="Enter 6-digit PIN code"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none tracking-wider"
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
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                >
                  <option value="">-- Choose State / UT --</option>
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
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-400"
                >
                  <option value="">
                    {locationData.state ? '-- Choose District --' : '-- Choose State First --'}
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

            {/* Town / Locality & Landmark */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Town / Area / Locality
                </label>
                {availablePostOffices.length > 0 ? (
                  <select
                    value={locationData.area}
                    onChange={(e) => setLocationData((prev) => ({ ...prev, area: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
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
                    placeholder="E.g. Musiri, Gandhi Nagar"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Street / Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={locationData.landmark}
                  onChange={(e) => setLocationData((prev) => ({ ...prev, landmark: e.target.value }))}
                  placeholder="E.g. Near Bus Stand / Temple"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                />
              </div>
            </div>

            {/* Address Preview Pill */}
            {previewAddress && (
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="truncate">
                  Neighbors will see: <strong className="text-emerald-700 dark:text-emerald-300 font-semibold">{previewAddress}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Details / Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Details & Duration (Optional)
            </label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="E.g. Needed for a family movie night from 6 PM to 10 PM. Will return it safely and clean!"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Posting Request...</span>
                </>
              ) : (
                <span>Post to Community 🚀</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWishlistModal;
