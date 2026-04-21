/**
 * Builds a GeoJSON Point object from latitude and longitude.
 * @param {Object} params - The location parameters.
 * @param {number|string} params.latitude - The latitude.
 * @param {number|string} params.longitude - The longitude.
 * @param {string} [params.locationAddress] - The address string.
 * @returns {Object} An object containing the location GeoJSON and locationAddress.
 */
const buildLocationGeoJSON = ({ latitude, longitude, locationAddress }) => {
  if (!latitude || !longitude) return {};

  return {
    location: {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    },
    locationAddress: locationAddress || null,
  };
};

module.exports = { buildLocationGeoJSON };
