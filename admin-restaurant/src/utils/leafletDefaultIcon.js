import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Leaflet's default marker icon paths are relative and break once bundled by
// Vite - this is the standard fix, pointing it at the bundler-resolved URLs
// instead. Importing this module once (from LocationMapPicker) is enough;
// it patches the shared Leaflet prototype every Marker on the page uses.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
