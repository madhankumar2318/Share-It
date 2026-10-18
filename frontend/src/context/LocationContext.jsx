import React, { createContext, useContext, useState, useEffect } from 'react';
import { INDIAN_LOCATIONS } from '../data/indianLocations';
import { PIN_PREFIX_COORDINATES, resolveLocationCoordinates } from '../utils/geo';

const LocationContext = createContext(null);

const DEFAULT_LOCATION = {
  type: 'ALL',
  value: '',
  label: 'All India',
};

const STORAGE_KEY = 'shareit_user_location';
const LAST_COORDS_KEY = 'shareit_last_coords';

// Helper to intelligently match reverse-geocoded city/district with our Indian directory
const matchIndianLocation = (districtName, stateName) => {
  if (!districtName && !stateName) return null;
  const cleanDistrict = (districtName || '').replace(/\s+District$/i, '').trim().toLowerCase();

  // 1. Try matching within the specified state first
  if (stateName) {
    const matchedStateKey = Object.keys(INDIAN_LOCATIONS).find(
      (s) => s.toLowerCase() === stateName.trim().toLowerCase()
    );
    if (matchedStateKey) {
      const match = INDIAN_LOCATIONS[matchedStateKey].find(
        (d) => d.toLowerCase() === cleanDistrict || cleanDistrict.includes(d.toLowerCase()) || d.toLowerCase().includes(cleanDistrict)
      );
      if (match) {
        return { district: match, state: matchedStateKey };
      }
    }
  }

  // 2. Scan all states for district match
  if (cleanDistrict) {
    for (const [state, districts] of Object.entries(INDIAN_LOCATIONS)) {
      const match = districts.find(
        (d) => d.toLowerCase() === cleanDistrict || cleanDistrict.includes(d.toLowerCase()) || d.toLowerCase().includes(cleanDistrict)
      );
      if (match) {
        return { district: match, state };
      }
    }
  }

  return {
    district: (districtName || '').replace(/\s+District$/i, '').trim(),
    state: stateName || ''
  };
};

export const LocationProvider = ({ children }) => {
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clear erroneous Coimbatore ISP network fallback if stored
        if (parsed.value === 'Coimbatore' && (parsed.source === 'network' || !parsed.source)) {
          localStorage.removeItem(STORAGE_KEY);
          return DEFAULT_LOCATION;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved location', e);
    }
    return DEFAULT_LOCATION;
  });

  const [detectingLocation, setDetectingLocation] = useState(false);
  const [detectingStatus, setDetectingStatus] = useState('');
  const [locationError, setLocationError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Keep localStorage synchronized
  useEffect(() => {
    try {
      if (selectedLocation && selectedLocation.type !== 'ALL') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedLocation));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save location', e);
    }
  }, [selectedLocation]);

  const setLocation = (loc) => {
    if (loc && !loc.coordinates) {
      if (loc.type === 'PINCODE' && loc.value) {
        const pin = String(loc.value).replace(/\D/g, '').slice(0, 6);
        if (PIN_PREFIX_COORDINATES[pin]) {
          loc.coordinates = {
            latitude: PIN_PREFIX_COORDINATES[pin].lat,
            longitude: PIN_PREFIX_COORDINATES[pin].lng,
          };
        } else if (PIN_PREFIX_COORDINATES[pin.slice(0, 3)]) {
          loc.coordinates = {
            latitude: PIN_PREFIX_COORDINATES[pin.slice(0, 3)].lat,
            longitude: PIN_PREFIX_COORDINATES[pin.slice(0, 3)].lng,
          };
        }
      } else if (loc.value) {
        const coords = resolveLocationCoordinates(loc.value);
        if (coords) {
          loc.coordinates = {
            latitude: coords.lat,
            longitude: coords.lng,
          };
        }
      }
    }
    setSelectedLocation(loc);
    setLocationError('');
  };

  const clearLocation = () => {
    setSelectedLocation(DEFAULT_LOCATION);
    setLocationError('');
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LAST_COORDS_KEY);
    } catch {}
  };

  // Fast reverse-geocoding from latitude & longitude
  const reverseGeocode = async (latitude, longitude) => {
    // 1. Primary: BigDataCloud client-side reverse geocoder (< 350ms, no CORS/browser rate-limits)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const bdcData = await res.json();
        const rawCity = bdcData.city || bdcData.locality || bdcData.principalSubdivision || '';
        const rawState = bdcData.principalSubdivision || '';
        const postcode = bdcData.postcode || '';

        const matched = matchIndianLocation(rawCity, rawState);
        const finalDistrict = matched?.district || rawCity;
        const finalState = matched?.state || rawState;

        if (finalDistrict) {
          return {
            type: 'DISTRICT',
            value: finalDistrict,
            label: finalState ? `${finalDistrict}, ${finalState}` : finalDistrict,
            state: finalState,
            postcode: postcode,
            coordinates: { latitude, longitude },
          };
        }
      }
    } catch (bdcErr) {
      console.warn('BigDataCloud reverse geocode attempt:', bdcErr);
    }

    // 2. Secondary: OpenStreetMap Nominatim with strict 3.5s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
        {
          signal: controller.signal,
          headers: { 'Accept-Language': 'en' },
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const district = addr.state_district || addr.county || addr.city || addr.town || addr.suburb || addr.village || '';
        const state = addr.state || '';
        const postcode = addr.postcode || '';

        const matched = matchIndianLocation(district, state);
        const finalDistrict = matched?.district || district.replace(/\s+District$/i, '').trim();
        const finalState = matched?.state || state;

        if (finalDistrict) {
          return {
            type: 'DISTRICT',
            value: finalDistrict,
            label: finalState ? `${finalDistrict}, ${finalState}` : finalDistrict,
            state: finalState,
            postcode: postcode,
            coordinates: { latitude, longitude },
          };
        } else if (postcode) {
          return {
            type: 'PINCODE',
            value: postcode,
            label: `PIN ${postcode}${finalState ? `, ${finalState}` : ''}`,
            state: finalState,
            postcode: postcode,
            coordinates: { latitude, longitude },
          };
        }
      }
    } catch (nomErr) {
      console.warn('Nominatim reverse geocode attempt:', nomErr);
    }

    return null;
  };

  // Bulletproof IP / Network-based auto-detection fallback (Works 100% indoors or when GPS times out)
  const detectLocationFromIP = async () => {
    // 1. BigDataCloud IP Geolocation
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        'https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en',
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rawCity = data.city || data.locality || data.principalSubdivision || '';
        const rawState = data.principalSubdivision || '';
        const postcode = data.postcode || '';
        const lat = data.latitude;
        const lng = data.longitude;

        const matched = matchIndianLocation(rawCity, rawState);
        const finalDistrict = matched?.district || rawCity;
        const finalState = matched?.state || rawState;

        if (finalDistrict) {
          return {
            type: 'DISTRICT',
            value: finalDistrict,
            label: finalState ? `${finalDistrict}, ${finalState}` : finalDistrict,
            state: finalState,
            postcode: postcode,
            coordinates: lat && lng ? { latitude: lat, longitude: lng } : null,
            source: 'network',
          };
        }
      }
    } catch (e) {
      console.warn('BigDataCloud IP detection attempt:', e);
    }

    // 2. Secondary IP fallback: ipapi.co
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rawCity = data.city || data.region || '';
        const rawState = data.region || '';
        const postcode = data.postal || '';
        const lat = data.latitude;
        const lng = data.longitude;

        const matched = matchIndianLocation(rawCity, rawState);
        const finalDistrict = matched?.district || rawCity;
        const finalState = matched?.state || rawState;

        if (finalDistrict) {
          return {
            type: 'DISTRICT',
            value: finalDistrict,
            label: finalState ? `${finalDistrict}, ${finalState}` : finalDistrict,
            state: finalState,
            postcode: postcode,
            coordinates: lat && lng ? { latitude: lat, longitude: lng } : null,
            source: 'network',
          };
        }
      }
    } catch (e) {
      console.warn('ipapi.co IP detection attempt:', e);
    }

    return null;
  };

  // Resilient multi-strategy position acquirer
  const getPositionWithFallback = () => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      // Phase 1: Fast Low-Accuracy / Fused Cell & Wi-Fi Location
      // On mobile devices, enableHighAccuracy: false completes in 200ms–800ms without waiting for satellites!
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (errPhase1) => {
          // If low-accuracy was rejected by permissions, do not retry GPS; fallback to IP immediately
          if (errPhase1.code === 1) {
            reject(errPhase1);
            return;
          }

          // Phase 2: Try high-accuracy GPS with a quick 5s timeout
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (errPhase2) => reject(errPhase2),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
          );
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    });
  };

  // Multi-tier location detector: Instant Cache -> Fast Geolocation -> Seamless IP Fallback
  const detectLocation = async () => {
    setLocationError('');
    setDetectingLocation(true);
    setDetectingStatus('Detecting via GPS / Network...');

    try {
      // 1. Try browser geolocation (Phase 1 & Phase 2)
      let detectedLoc = null;

      try {
        const position = await getPositionWithFallback();
        const { latitude, longitude } = position.coords;

        // Cache last coordinates for snappy repeated clicks
        try {
          localStorage.setItem(LAST_COORDS_KEY, JSON.stringify({ latitude, longitude, ts: Date.now() }));
        } catch {}

        setDetectingStatus('Resolving neighborhood...');
        detectedLoc = await reverseGeocode(latitude, longitude);
      } catch (gpsErr) {
        console.warn('Browser GPS resolution skipped or timed out, trying network/IP fallback...', gpsErr);
      }

      // 2. If browser GPS timed out or failed to resolve, try cached coordinates if recent (< 15 mins)
      if (!detectedLoc) {
        try {
          const rawCached = localStorage.getItem(LAST_COORDS_KEY);
          if (rawCached) {
            const cached = JSON.parse(rawCached);
            if (cached?.latitude && cached?.longitude && Date.now() - (cached.ts || 0) < 15 * 60 * 1000) {
              setDetectingStatus('Resolving from recent fix...');
              detectedLoc = await reverseGeocode(cached.latitude, cached.longitude);
            }
          }
        } catch {}
      }

      // 3. ZERO-FAILURE FALLBACK: Seamless IP/Network Location
      // If GPS times out indoors or satellite lock is slow, this effortlessly finds user city in ~300ms!
      if (!detectedLoc) {
        setDetectingStatus('Connecting via network location...');
        detectedLoc = await detectLocationFromIP();
      }

      if (detectedLoc) {
        // Guard against ISP router gateway (Coimbatore 10.96 / 76.94) falsely overriding central TN users
        const lat = detectedLoc.coordinates?.latitude;
        const lng = detectedLoc.coordinates?.longitude;
        const isCoimbatoreIsp = lat && lng && Math.abs(lat - 10.9687) < 0.25 && Math.abs(lng - 76.9463) < 0.25;
        if (isCoimbatoreIsp && detectedLoc.value === 'Coimbatore') {
          const fallbackMsg = 'ISP network detected regional Coimbatore gateway. Please choose your town or enter 6-digit PIN code for local items.';
          setLocationError(fallbackMsg);
          setDetectingLocation(false);
          setDetectingStatus('');
          return { success: false, error: fallbackMsg };
        }

        setSelectedLocation(detectedLoc);
        setDetectingStatus('Location detected! 🎯');
        setDetectingLocation(false);
        return { success: true, location: detectedLoc };
      }

      // 4. Absolute fallback if device is completely offline or no network response
      const fallbackMsg = 'Could not auto-detect location. Please select your city or enter PIN code below.';
      setLocationError(fallbackMsg);
      setDetectingLocation(false);
      setDetectingStatus('');
      return { success: false, error: fallbackMsg };
    } catch (err) {
      console.error('Location detection error:', err);
      const fallbackMsg = 'Location request timed out. Please select your city or enter PIN code below.';
      setLocationError(fallbackMsg);
      setDetectingLocation(false);
      setDetectingStatus('');
      return { success: false, error: fallbackMsg };
    }
  };

  const userCoords = selectedLocation?.coordinates || null;

  return (
    <LocationContext.Provider
      value={{
        selectedLocation,
        userCoords,
        setLocation,
        clearLocation,
        detectLocation,
        detectingLocation,
        detectingStatus,
        locationError,
        setLocationError,
        isModalOpen,
        setIsModalOpen,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationFilter = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationFilter must be used within a LocationProvider');
  }
  return context;
};
