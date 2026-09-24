import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../utils/leafletDefaultIcon';

// Phnom Penh - only used when nothing has been picked yet, purely so the map
// doesn't open on the middle of the ocean (0, 0).
const DEFAULT_CENTER = [11.5564, 104.9282];

const ClickToPick = ({ onPick }) => {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
};

// Keeps the map centered on the position this component is fed (e.g. after
// "Use my current location" or a search result lands), without fighting the
// user's own pan/zoom on every render.
const RecenterOnExternalChange = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 15));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.[0], position?.[1]]);

  return null;
};

/**
 * Interactive Leaflet/OpenStreetMap picker: click anywhere or drag the
 * marker to choose a point, in addition to whatever search/GPS button set
 * `latitude`/`longitude` initially. Calls onChange(lat, lng) - the caller
 * (AddressPickerModal, restaurant Profile, ...) owns reverse-geocoding the
 * result into a display address and persisting it to Laravel.
 */
const LocationMapPicker = ({ latitude, longitude, onChange, height = 220 }) => {
  const hasPosition = Number.isFinite(latitude) && Number.isFinite(longitude);
  const position = hasPosition ? [latitude, longitude] : null;

  return (
    <div
      style={{ height }}
      className="w-full overflow-hidden rounded-lg border border-slate-200"
    >
      <MapContainer
        center={position || DEFAULT_CENTER}
        zoom={hasPosition ? 16 : 12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && (
          <Marker
            position={position}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const { lat, lng } = event.target.getLatLng();
                onChange(lat, lng);
              },
            }}
          />
        )}
        <ClickToPick onPick={onChange} />
        <RecenterOnExternalChange position={position} />
      </MapContainer>
    </div>
  );
};

export default LocationMapPicker;
