import React, { useState, useMemo } from 'react';
import { useLocationFilter } from '../context/LocationContext';
import { INDIAN_LOCATIONS } from '../data/indianLocations';
import { 
  MapPin, 
  Navigation, 
  Search, 
  X, 
  Loader2, 
  Check, 
  AlertCircle, 
  Globe2 
} from 'lucide-react';

const POPULAR_HUBS = [
  { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Coimbatore', state: 'Tamil Nadu' },
  { city: 'Madurai', state: 'Tamil Nadu' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi (NCT)' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Pune', state: 'Maharashtra' },
];

const LocationModal = () => {
  const {
    isModalOpen,
    setIsModalOpen,
    selectedLocation,
    setLocation,
    clearLocation,
    detectLocation,
    detectingLocation,
    locationError,
    setLocationError,
  } = useLocationFilter();

  const [searchQuery, setSearchQuery] = useState('');

  // Flattened list of all Indian districts for instant quick-search
  const allDistricts = useMemo(() => {
    const list = [];
    Object.entries(INDIAN_LOCATIONS).forEach(([state, districts]) => {
      districts.forEach((d) => {
        list.push({ district: d, state });
      });
    });
    return list;
  }, []);

  const filteredDistricts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return allDistricts
      .filter(
        (item) =>
          item.district.toLowerCase().includes(query) ||
          item.state.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [allDistricts, searchQuery]);

  if (!isModalOpen) return null;

  const handleSelect = (district, state) => {
    setLocation({
      type: 'DISTRICT',
      value: district,
      label: state ? `${district}, ${state}` : district,
      state: state,
    });
    setIsModalOpen(false);
    setSearchQuery('');
  };

  const handleSelectPincode = (pin) => {
    setLocation({
      type: 'PINCODE',
      value: pin,
      label: `PIN ${pin}`,
    });
    setIsModalOpen(false);
    setSearchQuery('');
  };

  const handleDetect = async () => {
    const result = await detectLocation();
    if (result.success) {
      setTimeout(() => {
        setIsModalOpen(false);
      }, 500);
    }
  };

  const isNumericPin = /^\d{3,6}$/.test(searchQuery.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Select Your Location
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                Discover items available for lending in your neighborhood
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsModalOpen(false);
              setLocationError('');
            }}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1">
          {/* 1-Click GPS Detect Button */}
          <div>
            <button
              onClick={handleDetect}
              disabled={detectingLocation}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/50 dark:to-teal-950/50 border border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-400 transition group text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm group-hover:scale-105 transition">
                  {detectingLocation ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Navigation className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {detectingLocation ? 'Detecting your GPS location...' : 'Use My Current Location'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Auto-detect via browser GPS (Most accurate)
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition">
                Detect 🎯
              </span>
            </button>

            {locationError && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{locationError}</span>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Or search by District, City, or 6-Digit PIN Code
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="E.g. Tiruchirappalli, Madurai, or 621211..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition"
              />
            </div>

            {/* Direct PIN prompt if user typed digits */}
            {isNumericPin && (
              <button
                onClick={() => handleSelectPincode(searchQuery.trim())}
                className="w-full mt-2 p-2.5 text-left text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium rounded-xl border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition flex items-center justify-between"
              >
                <span>Filter items matching PIN code: <strong>{searchQuery.trim()}</strong></span>
                <span className="font-bold">Apply &rarr;</span>
              </button>
            )}

            {/* Autocomplete Search Dropdown */}
            {filteredDistricts.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900 shadow-lg">
                {filteredDistricts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(item.district, item.state)}
                    className="w-full px-4 py-2.5 text-left text-xs hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center justify-between group transition"
                  >
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {item.district}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 ml-1.5">
                        ({item.state})
                      </span>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition text-xs font-semibold">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Popular Hubs */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Popular Cities & Districts
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_HUBS.map((hub) => {
                const isCurrent =
                  selectedLocation?.value?.toLowerCase() ===
                  hub.city.toLowerCase();
                return (
                  <button
                    key={hub.city}
                    onClick={() => handleSelect(hub.city, hub.state)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700/50'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{hub.city}</span>
                    {isCurrent && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-gray-50 dark:bg-slate-900/60 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => {
              clearLocation();
              setIsModalOpen(false);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            <Globe2 className="w-3.5 h-3.5" />
            Show All Items (All India)
          </button>

          {selectedLocation?.type !== 'ALL' && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Active: <strong>{selectedLocation.label}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
