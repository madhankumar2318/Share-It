import React, { useState, useMemo } from 'react';
import { useLocationFilter } from '../context/LocationContext';
import { INDIAN_LOCATIONS } from '../data/indianLocations';
import { 
  MapPin, 
  Search, 
  X, 
  Check, 
  Globe2 
} from 'lucide-react';

const POPULAR_HUBS = [
  { city: 'Musiri', pincode: '621211', state: 'Tamil Nadu', label: 'Musiri (621211)' },
  { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Madurai', state: 'Tamil Nadu' },
  { city: 'Salem', state: 'Tamil Nadu' },
  { city: 'Coimbatore', state: 'Tamil Nadu' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi (NCT)' },
];

const LocationModal = () => {
  const {
    isModalOpen,
    setIsModalOpen,
    selectedLocation,
    setLocation,
    clearLocation,
  } = useLocationFilter();

  const [searchQuery, setSearchQuery] = useState('');

  // Comprehensive list of Indian localities & districts for instant search
  const allDistricts = useMemo(() => {
    const list = [
      { district: 'Musiri', state: 'Tamil Nadu', pincode: '621211' },
      { district: 'Tiruchirappalli', state: 'Tamil Nadu', pincode: '620001' },
      { district: 'Srirangam', state: 'Tamil Nadu', pincode: '620006' },
      { district: 'Lalgudi', state: 'Tamil Nadu', pincode: '621601' },
      { district: 'Thuraiyur', state: 'Tamil Nadu', pincode: '621010' },
      { district: 'Kulithalai', state: 'Tamil Nadu', pincode: '639104' },
      { district: 'Manapparai', state: 'Tamil Nadu', pincode: '621306' },
    ];
    Object.entries(INDIAN_LOCATIONS).forEach(([state, districts]) => {
      districts.forEach((d) => {
        if (!list.some((existing) => existing.district.toLowerCase() === d.toLowerCase())) {
          list.push({ district: d, state });
        }
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
          item.state.toLowerCase().includes(query) ||
          (item.pincode && item.pincode.includes(query))
      )
      .slice(0, 10);
  }, [allDistricts, searchQuery]);

  if (!isModalOpen) return null;

  const handleSelect = (district, state, pincode = null) => {
    if (pincode) {
      setLocation({
        type: 'PINCODE',
        value: pincode,
        label: `${district} (${pincode})`,
        state: state,
        district: district,
      });
    } else {
      setLocation({
        type: 'DISTRICT',
        value: district,
        label: state ? `${district}, ${state}` : district,
        state: state,
      });
    }
    setIsModalOpen(false);
    setSearchQuery('');
  };

  const handleSelectHub = (hub) => {
    if (hub.pincode) {
      handleSelect(hub.city, hub.state, hub.pincode);
    } else {
      handleSelect(hub.city, hub.state);
    }
  };

  const handleSelectPincode = (pin) => {
    const isMusiri = pin === '621211';
    setLocation({
      type: 'PINCODE',
      value: pin,
      label: isMusiri ? 'Musiri (621211)' : `PIN ${pin}`,
      district: isMusiri ? 'Tiruchirappalli' : '',
      state: isMusiri ? 'Tamil Nadu' : '',
    });
    setIsModalOpen(false);
    setSearchQuery('');
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
                Discover items available for lending in your neighborhood 🇮🇳
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1">
          {/* Direct Search Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Search by Town, City, District, or 6-Digit PIN Code
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="E.g. Musiri, 621211, Tiruchirappalli, Madurai..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition"
                autoFocus
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
                    onClick={() => handleSelect(item.district, item.state, item.pincode)}
                    className="w-full px-4 py-2.5 text-left text-xs hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center justify-between group transition"
                  >
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {item.district}
                      </span>
                      {item.pincode && (
                        <span className="ml-1.5 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          ({item.pincode})
                        </span>
                      )}
                      <span className="text-gray-400 dark:text-gray-500 ml-1.5">
                        • {item.state}
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

          {/* Popular Hubs / 1-Click Quick Chips */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Quick Selection & Popular Hubs
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_HUBS.map((hub) => {
                const isCurrent =
                  (hub.pincode && selectedLocation?.value === hub.pincode) ||
                  (selectedLocation?.value?.toLowerCase() === hub.city.toLowerCase());

                return (
                  <button
                    key={hub.city}
                    onClick={() => handleSelectHub(hub)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/50'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700/50'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{hub.label || hub.city}</span>
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
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Active: <strong>{selectedLocation.label}</strong>
              </span>
              <button
                type="button"
                onClick={() => clearLocation()}
                className="text-[11px] text-gray-400 hover:text-red-500 underline font-semibold ml-1 transition"
                title="Reset active location"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
