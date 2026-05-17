
const EARTH_RADIUS_M = 6371000; 

/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
};

/**
 * Format a distance in meters to a human-readable string
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance e.g. "200m" or "1.5 km" or "5 min walk"
 */
export const formatDistance = (meters) => {
  if (meters < 100) return `${Math.round(meters)}m`;
  if (meters < 1000) return `${Math.round(meters / 10) * 10}m`;
  if (meters < 10000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters / 1000)} km`;
};

/**
 * Get approximate walking time
 * @param {number} meters - Distance in meters
 * @returns {string} e.g. "2 min walk"
 */
export const getWalkingTime = (meters) => {
  const WALK_SPEED_MPS = 1.4; // ~5 km/h
  const minutes = Math.round(meters / WALK_SPEED_MPS / 60);
  if (minutes < 1) return "< 1 min walk";
  if (minutes > 60) return `${Math.round(minutes / 60)}h walk`;
  return `${minutes} min walk`;
};
