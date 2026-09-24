import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { restaurantIcon, riderIcon, customerIcon } from './leafletMarkerIcons';

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

/**
 * Read-only map for the customer order-tracking page: shows the assigned
 * rider's last reported position alongside the restaurant (still
 * preparing/picking up) or the delivery address (once picked up). Reuses
 * exactly the coordinates Laravel already returns from GET /api/orders/{id}
 * (order.delivery.rider, order.restaurant, order.address) - no separate
 * tracking endpoint or polling loop of its own.
 */
const DeliveryTrackingMap = ({ rider, restaurant, address, hasBeenPickedUp }) => {
  const points = [];
  const riderPosition = rider?.current_latitude != null && rider?.current_longitude != null
    ? [Number(rider.current_latitude), Number(rider.current_longitude)]
    : null;
  const restaurantPosition = restaurant?.latitude != null && restaurant?.longitude != null
    ? [Number(restaurant.latitude), Number(restaurant.longitude)]
    : null;
  const addressPosition = address?.latitude != null && address?.longitude != null
    ? [Number(address.latitude), Number(address.longitude)]
    : null;

  if (riderPosition) points.push(riderPosition);
  if (!hasBeenPickedUp && restaurantPosition) points.push(restaurantPosition);
  if (hasBeenPickedUp && addressPosition) points.push(addressPosition);

  if (points.length === 0) return null;

  return (
    <div className="h-56 w-full overflow-hidden rounded-lg border border-[#D6DBE3] mb-6">
      <MapContainer center={points[0]} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {riderPosition && (
          <Marker position={riderPosition} icon={riderIcon}>
            <Popup>Your rider</Popup>
          </Marker>
        )}
        {!hasBeenPickedUp && restaurantPosition && (
          <Marker position={restaurantPosition} icon={restaurantIcon}>
            <Popup>{restaurant?.name || 'Restaurant'}</Popup>
          </Marker>
        )}
        {hasBeenPickedUp && addressPosition && (
          <Marker position={addressPosition} icon={customerIcon}>
            <Popup>Delivery address</Popup>
          </Marker>
        )}
        <FitToMarkers points={points} />
      </MapContainer>
    </div>
  );
};

export default DeliveryTrackingMap;
