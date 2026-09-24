import L from 'leaflet';

// Simple colored pins (no extra image assets to bundle) so the rider,
// restaurant and customer markers are visually distinct at a glance.
const pin = (color) => L.divIcon({
  className: '',
  html: `<span style="display:block;width:16px;height:16px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 16],
  popupAnchor: [0, -16],
});

export const riderIcon = pin('#0B1F3B');
export const restaurantIcon = pin('#D97706');
export const customerIcon = pin('#059669');
