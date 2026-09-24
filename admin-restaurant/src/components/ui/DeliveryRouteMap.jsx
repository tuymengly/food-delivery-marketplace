import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Navigation2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { riderIcon, restaurantIcon, customerIcon } from './leafletMarkerIcons';

const FitToMarkers = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    map.fitBounds(points, { padding: [32, 32] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)]);

  return null;
};

const directionsUrl = (destination, origin) => {
  const params = new URLSearchParams({
    api: '1',
    destination: `${destination[0]},${destination[1]}`,
  });
  if (origin) params.set('origin', `${origin[0]},${origin[1]}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

/**
 * Rider dashboard map for the active delivery: rider + restaurant before
 * pickup, rider + customer after. All coordinates come straight from
 * Laravel (DriverController::formatOrderForDriver / the browser's own live
 * GPS fix for the rider) - this component only renders what it's given.
 */
const DeliveryRouteMap = ({ riderPosition, destination, destinationLabel, isPickupPhase }) => {
  const points = [];
  if (riderPosition) points.push(riderPosition);
  if (destination) points.push(destination);

  if (points.length === 0) return null;

  const DestinationIcon = isPickupPhase ? restaurantIcon : customerIcon;

  return (
    <div className="space-y-2">
      <div className="h-56 w-full overflow-hidden rounded-none border border-slate-300">
        <MapContainer center={points[0]} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {riderPosition && (
            <Marker position={riderPosition} icon={riderIcon}>
              <Popup>You</Popup>
            </Marker>
          )}
          {destination && (
            <Marker position={destination} icon={DestinationIcon}>
              <Popup>{destinationLabel}</Popup>
            </Marker>
          )}
          <FitToMarkers points={points} />
        </MapContainer>
      </div>
      {destination && (
        <a
          href={directionsUrl(destination, riderPosition)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-none text-[11px] font-bold uppercase tracking-wider transition"
        >
          <Navigation2 size={14} /> Get Directions
        </a>
      )}
    </div>
  );
};

export default DeliveryRouteMap;
