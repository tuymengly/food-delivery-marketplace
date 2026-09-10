const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

const getAddressParts = (result) => {
  const parts = result?.address || {};
  const city = parts.city || parts.town || parts.municipality || parts.village || '';
  const country = parts.country || '';

  return {
    address: result?.display_name || '',
    city,
    country,
  };
};

export const reverseGeocode = async (latitude, longitude) => {
  const response = await fetch(
    `${NOMINATIM_URL}/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
  );
  if (!response.ok) throw new Error('Unable to identify this location.');
  return getAddressParts(await response.json());
};

export const searchLocation = async (query) => {
  const response = await fetch(
    `${NOMINATIM_URL}/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`
  );
  if (!response.ok) throw new Error('Unable to search for that location.');
  const results = await response.json();
  if (!results.length) throw new Error('No matching location was found.');
  const result = results[0];
  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    ...getAddressParts(result),
  };
};

export const detectCurrentLocation = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Location is not available in this browser.'));
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const location = await reverseGeocode(coords.latitude, coords.longitude);
        resolve({ latitude: coords.latitude, longitude: coords.longitude, ...location });
      } catch {
        resolve({ latitude: coords.latitude, longitude: coords.longitude, address: 'Current location', city: '', country: '' });
      }
    },
    (error) => {
      const permissionDenied = error.code === error.PERMISSION_DENIED;
      const locationError = new Error(permissionDenied
        ? 'Location access is disabled. Please select your delivery location manually.'
        : 'We could not detect your location. Please select it manually.');
      locationError.name = permissionDenied ? 'LocationPermissionDenied' : 'LocationUnavailable';
      reject(locationError);
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
});

export const getStoredLocation = () => {
  try {
    const stored = localStorage.getItem('deliveryLocation');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const saveStoredLocation = (location) => {
  localStorage.setItem('deliveryLocation', JSON.stringify(location));
  localStorage.setItem('deliveryAddress', location.address || '');
  if (Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
    localStorage.setItem('deliveryCoords', JSON.stringify({ lat: location.latitude, lng: location.longitude }));
  }
  window.dispatchEvent(new Event('locationChanged'));
};

export const distanceBetweenCoordinates = (first, second) => {
  if (!first || !second) return null;
  const earthRadiusKm = 6371;
  const toRadians = (value) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(first.latitude)) * Math.cos(toRadians(second.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};