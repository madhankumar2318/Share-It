import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getItemCoordinates, calculateDistanceKm, formatDistance } from '../utils/geo';
import { Navigation, MapPin, ExternalLink, Package } from 'lucide-react';

const NeighborhoodMap = ({
  items = [],
  userCoords = null,
  distanceRadius = null, // in km, or null for 'all'
  onSelectRadius,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const radiusCircleRef = useRef(null);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center: User coords if available, else Bangalore / Central India
    const initialLat = userCoords?.latitude || 12.9716;
    const initialLng = userCoords?.longitude || 77.5946;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false, // will add customized or standard
    });

    // Add standard zoom control at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Free OpenStreetMap Carto tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Radius Circle when items or userCoords change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }

    const bounds = L.latLngBounds();

    // 1. Add User Marker & Radius Ring if userCoords available
    if (userCoords?.latitude && userCoords?.longitude) {
      const userLat = Number(userCoords.latitude);
      const userLng = Number(userCoords.longitude);

      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 18px; height: 18px; border-radius: 50%; background-color: #059669; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const userMarker = L.marker([userLat, userLng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).bindPopup(`
        <div style="text-align: center; padding: 4px; font-family: sans-serif;">
          <strong style="color: #059669; font-size: 13px;">📍 You Are Here</strong>
          <p style="margin: 4px 0 0; font-size: 11px; color: #64748b;">Your neighborhood location</p>
        </div>
      `);

      layerGroup.addLayer(userMarker);
      bounds.extend([userLat, userLng]);

      // Draw Distance Radius Circle if selected
      if (distanceRadius && distanceRadius > 0) {
        const radiusMeters = distanceRadius * 1000;
        const circle = L.circle([userLat, userLng], {
          radius: radiusMeters,
          color: '#10b981',
          weight: 2,
          opacity: 0.8,
          fillColor: '#10b981',
          fillOpacity: 0.08,
          dashArray: '5, 8',
        }).addTo(map);
        radiusCircleRef.current = circle;
        bounds.extend(circle.getBounds());
      }
    }

    // 2. Add Item Markers
    items.forEach((item) => {
      const coords = getItemCoordinates(item);
      if (!coords) return;

      const { lat, lng } = coords;
      bounds.extend([lat, lng]);

      let distanceText = '';
      if (userCoords?.latitude && userCoords?.longitude) {
        const d = calculateDistanceKm(userCoords.latitude, userCoords.longitude, lat, lng);
        distanceText = formatDistance(d) || '';
      }

      const isAvailable = item.status === 'AVAILABLE';

      const itemIcon = L.divIcon({
        className: 'custom-item-marker',
        html: `
          <div style="cursor: pointer; transform: translate(-50%, -100%); transition: transform 0.2s ease;">
            <div style="background-color: ${isAvailable ? '#10b981' : '#f59e0b'}; color: white; padding: 5px 8px; border-radius: 12px; font-weight: 700; font-size: 11px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25); border: 2px solid white; white-space: nowrap;">
              <span>📦</span>
              <span style="max-width: 90px; overflow: hidden; text-overflow: ellipsis;">${item.title.replace(/"/g, '&quot;')}</span>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${isAvailable ? '#10b981' : '#f59e0b'}; margin: 0 auto;"></div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const popupHtml = `
        <div style="font-family: inherit; width: 220px; padding: 4px;">
          <div style="position: relative; width: 100%; height: 110px; border-radius: 10px; overflow: hidden; margin-bottom: 8px; background: #f1f5f9;">
            <img 
              src="${item.imageUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60'}" 
              alt="${item.title}" 
              style="width: 100%; height: 100%; object-fit: cover;" 
            />
            <span style="position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,0.65); color: white; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: 600;">
              ${item.category}
            </span>
          </div>
          <h4 style="margin: 0 0 4px; font-size: 13px; font-weight: 800; color: #0f172a; line-height: 1.3;">
            ${item.title}
          </h4>
          <p style="margin: 0 0 6px; font-size: 11px; color: #64748b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${item.description || 'Available in neighborhood'}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 11px;">
            <span style="display: inline-flex; align-items: center; gap: 3px; color: #059669; font-weight: 700;">
              📍 ${distanceText || item.location || 'Nearby'}
            </span>
            <span style="padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: 700; ${
              isAvailable
                ? 'background: #dcfce7; color: #15803d;'
                : 'background: #fef3c7; color: #b45309;'
            }">
              ${isAvailable ? 'Available' : 'In Use'}
            </span>
          </div>
          <a 
            href="/items/${item.id}" 
            style="display: block; text-align: center; background: #059669; color: white; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none;"
          >
            Borrow / View Details &rarr;
          </a>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: itemIcon }).bindPopup(popupHtml, {
        maxWidth: 240,
        className: 'custom-leaflet-popup',
      });

      layerGroup.addLayer(marker);
    });

    // Auto-fit map to items and user
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [items, userCoords, distanceRadius]);

  const handleCenterOnUser = () => {
    if (!mapInstanceRef.current || !userCoords?.latitude) return;
    mapInstanceRef.current.flyTo(
      [Number(userCoords.latitude), Number(userCoords.longitude)],
      14,
      { duration: 1.2 }
    );
  };

  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const bounds = L.latLngBounds();
    if (userCoords?.latitude) {
      bounds.extend([Number(userCoords.latitude), Number(userCoords.longitude)]);
    }
    items.forEach((item) => {
      const coords = getItemCoordinates(item);
      if (coords) bounds.extend([coords.lat, coords.lng]);
    });
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900">
      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-[450px] sm:h-[550px] z-0 focus:outline-none"
        style={{ minHeight: '400px' }}
      />

      {/* Floating Header Overlay: Counts and Quick Actions */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2 max-w-[calc(100%-60px)]">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            {items.length} {items.length === 1 ? 'Item' : 'Items'} on Map
          </span>
          {distanceRadius && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              (&le; {distanceRadius} km)
            </span>
          )}
        </div>

        {userCoords?.latitude && (
          <button
            type="button"
            onClick={handleCenterOnUser}
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-emerald-50 dark:hover:bg-slate-800 px-3 py-2 rounded-2xl shadow-md border border-gray-200 dark:border-slate-700 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 transition active:scale-95"
            title="Center map on my location"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">My Location</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleFitAll}
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-gray-100 dark:hover:bg-slate-800 px-3 py-2 rounded-2xl shadow-md border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 transition active:scale-95"
          title="Zoom to fit all items"
        >
          <MapPin className="w-3.5 h-3.5 text-gray-500" />
          <span className="hidden sm:inline">Fit All</span>
        </button>
      </div>

      {/* Floating Bottom Legend */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-gray-200 dark:border-slate-700 text-[11px] text-gray-600 dark:text-gray-300 flex items-center justify-between sm:justify-start gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 border border-white"></span>
          <span>In Use</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-700 border border-white"></span>
          <span>You</span>
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodMap;
