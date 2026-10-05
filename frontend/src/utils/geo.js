/**
 * Geographic calculations and coordinates resolution for Share-It
 * Uses Haversine distance formula and Indian city centroid mappings.
 */

export const KNOWN_COORDINATES = {
  // Tamil Nadu
  chennai: { lat: 13.0827, lng: 80.2707 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
  trichy: { lat: 10.7905, lng: 78.7047 },
  salem: { lat: 11.6643, lng: 78.1460 },
  tiruppur: { lat: 11.1085, lng: 77.3411 },
  erode: { lat: 11.3410, lng: 77.7172 },
  vellore: { lat: 12.9165, lng: 79.1325 },
  tirunelveli: { lat: 8.7139, lng: 77.7567 },
  thanjavur: { lat: 10.7870, lng: 79.1378 },
  dindigul: { lat: 10.3673, lng: 77.9803 },
  kanchipuram: { lat: 12.8342, lng: 79.7036 },
  cuddalore: { lat: 11.7480, lng: 79.7714 },
  hosur: { lat: 12.7409, lng: 77.8253 },

  // Karnataka
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
  hubli: { lat: 15.3647, lng: 75.1240 },
  mangalore: { lat: 12.9141, lng: 74.8560 },
  belgaum: { lat: 15.8497, lng: 74.4977 },

  // Maharashtra
  mumbai: { lat: 19.0760, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  thane: { lat: 19.2183, lng: 72.9781 },
  aurangabad: { lat: 19.8762, lng: 75.3433 },

  // Delhi NCR
  delhi: { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  noida: { lat: 28.5355, lng: 77.3910 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  ghaziabad: { lat: 28.6692, lng: 77.4538 },
  faridabad: { lat: 28.4089, lng: 77.3178 },

  // Telangana & Andhra Pradesh
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  secunderabad: { lat: 17.4399, lng: 78.4983 },
  visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  vizag: { lat: 17.6868, lng: 83.2185 },
  vijayawada: { lat: 16.5062, lng: 80.6480 },
  guntur: { lat: 16.3067, lng: 80.4365 },
  warangal: { lat: 17.9689, lng: 79.5941 },

  // Kerala
  kochi: { lat: 9.9312, lng: 76.2673 },
  cochin: { lat: 9.9312, lng: 76.2673 },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  trivandrum: { lat: 8.5241, lng: 76.9366 },
  kozhikode: { lat: 11.2588, lng: 75.7804 },
  calicut: { lat: 11.2588, lng: 75.7804 },
  thrissur: { lat: 10.5276, lng: 76.2144 },

  // Other Major Indian Metros & Hubs
  kolkata: { lat: 22.5726, lng: 88.3639 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  surat: { lat: 21.1702, lng: 72.8311 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  indore: { lat: 22.7196, lng: 75.8577 },
  patna: { lat: 25.5941, lng: 85.1376 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  ranchi: { lat: 23.3441, lng: 85.3096 },
  guwahati: { lat: 26.1445, lng: 91.7362 },
  dehradun: { lat: 30.3165, lng: 78.0322 },
};

/**
 * Calculates straight-line distance in kilometers between two GPS coordinates using the Haversine formula.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return null;

  const R = 6371; // Earth's mean radius in km
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats distance into a human-friendly label (e.g. "450 m away" or "2.3 km away")
 */
export function formatDistance(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm)) return null;
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters < 50 ? 50 : meters} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Retrieves valid { lat, lng } for an item.
 * If explicitly saved on item, uses it.
 * Otherwise, scans item.location against KNOWN_COORDINATES and applies a gentle pseudo-random offset
 * based on item.id so neighbor items don't overlap on the exact same coordinate point.
 */
export function getItemCoordinates(item) {
  if (!item) return null;

  if (item.latitude != null && item.longitude != null) {
    const lat = Number(item.latitude);
    const lng = Number(item.longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng };
    }
  }

  const loc = (item.location || '').toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (loc.includes(key)) {
      // Deterministic small jitter based on item ID (within ~300m - 1.2km)
      const id = Number(item.id) || 1;
      const angle = (id * 137.5 * Math.PI) / 180;
      const dist = 0.004 + ((id % 10) * 0.001);
      return {
        lat: Number((coords.lat + Math.sin(angle) * dist).toFixed(6)),
        lng: Number((coords.lng + Math.cos(angle) * dist).toFixed(6)),
      };
    }
  }

  // Fallback default: Bangalore / Central Indian Hub
  const id = Number(item.id) || 1;
  const angle = (id * 137.5 * Math.PI) / 180;
  return {
    lat: Number((12.9716 + Math.sin(angle) * 0.015).toFixed(6)),
    lng: Number((77.5946 + Math.cos(angle) * 0.015).toFixed(6)),
  };
}
