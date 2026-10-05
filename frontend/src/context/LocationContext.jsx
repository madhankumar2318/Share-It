import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext(null);

const DEFAULT_LOCATION = {
  type: 'ALL',
  value: '',
  label: 'All India',
};

const STORAGE_KEY = 'shareit_user_location';

export const LocationProvider = ({ children }) => {
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved location', e);
    }
    return DEFAULT_LOCATION;
  });

  const [detectingLocation, setDetectingLocation] = useState(false);
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
    setSelectedLocation(loc);
    setLocationError('');
  };

  const clearLocation = () => {
    setSelectedLocation(DEFAULT_LOCATION);
    setLocationError('');
  };

  // Browser GPS auto-detection with free reverse geocoding
  const detectLocation = () => {
    return new Promise((resolve) => {
      setLocationError('');

      if (!('geolocation' in navigator)) {
        const msg = 'Geolocation is not supported by your browser.';
        setLocationError(msg);
        resolve({ success: false, error: msg });
        return;
      }

      setDetectingLocation(true);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Free OpenStreetMap Nominatim reverse geocode lookup
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
              {
                signal: controller.signal,
                headers: {
                  'Accept-Language': 'en',
                },
              }
            );
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error('Failed to resolve coordinates');

            const data = await res.json();
            const addr = data.address || {};

            // Prioritize Indian district, city, or town
            const district =
              addr.state_district ||
              addr.county ||
              addr.city ||
              addr.town ||
              addr.suburb ||
              addr.village ||
              '';

            const state = addr.state || '';
            const postcode = addr.postcode || '';

            // Clean up district name (remove trailing "District")
            const cleanedDistrict = district.replace(/\s+District$/i, '').trim();

            if (cleanedDistrict) {
              const detected = {
                type: 'DISTRICT',
                value: cleanedDistrict,
                label: state ? `${cleanedDistrict}, ${state}` : cleanedDistrict,
                postcode: postcode,
                state: state,
              };
              setSelectedLocation(detected);
              setDetectingLocation(false);
              resolve({ success: true, location: detected });
            } else if (postcode) {
              const detected = {
                type: 'PINCODE',
                value: postcode,
                label: `PIN ${postcode}${state ? `, ${state}` : ''}`,
                postcode: postcode,
                state: state,
              };
              setSelectedLocation(detected);
              setDetectingLocation(false);
              resolve({ success: true, location: detected });
            } else {
              throw new Error('Could not identify your city or district.');
            }
          } catch (err) {
            console.warn('Reverse geocoding fallback error:', err);
            // Fallback: try BigDataCloud client-side free reverse geocode
            try {
              const bdcRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );
              const bdcData = await bdcRes.json();
              const bdcCity =
                bdcData.city ||
                bdcData.locality ||
                bdcData.principalSubdivision ||
                '';

              if (bdcCity) {
                const detected = {
                  type: 'DISTRICT',
                  value: bdcCity,
                  label: bdcData.principalSubdivision
                    ? `${bdcCity}, ${bdcData.principalSubdivision}`
                    : bdcCity,
                  state: bdcData.principalSubdivision || '',
                  postcode: bdcData.postcode || '',
                };
                setSelectedLocation(detected);
                setDetectingLocation(false);
                resolve({ success: true, location: detected });
                return;
              }
            } catch (fallbackErr) {
              console.warn('Secondary reverse geocode error:', fallbackErr);
            }

            const msg = 'Could not resolve exact district from GPS. Please select your city manually.';
            setLocationError(msg);
            setDetectingLocation(false);
            resolve({ success: false, error: msg });
          }
        },
        (err) => {
          setDetectingLocation(false);
          let msg = 'Unable to retrieve your location.';
          if (err.code === 1) {
            msg = 'Location access was denied. Please allow GPS permission in your browser or select your city manually.';
          } else if (err.code === 2) {
            msg = 'Location unavailable. Please select your city manually.';
          } else if (err.code === 3) {
            msg = 'Location request timed out. Please try again or select manually.';
          }
          setLocationError(msg);
          resolve({ success: false, error: msg });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  return (
    <LocationContext.Provider
      value={{
        selectedLocation,
        setLocation,
        clearLocation,
        detectLocation,
        detectingLocation,
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
