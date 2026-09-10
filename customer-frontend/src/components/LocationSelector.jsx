import { useEffect, useRef, useState } from 'react';
import { FaChevronDown, FaLocationArrow, FaMapMarkerAlt } from 'react-icons/fa';
import { createAddress, fetchAddresses } from '../api/addressApi';
import { detectCurrentLocation, getStoredLocation, saveStoredLocation, searchLocation } from '../utils/location';

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const LocationSelector = () => {
  const [selectedLocation, setSelectedLocation] = useState(getStoredLocation);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const syncLocation = () => setSelectedLocation(getStoredLocation());
    window.addEventListener('locationChanged', syncLocation);
    window.addEventListener('storage', syncLocation);
    return () => {
      window.removeEventListener('locationChanged', syncLocation);
      window.removeEventListener('storage', syncLocation);
    };
  }, []);

  useEffect(() => {
    if (!open || !localStorage.getItem('token')) return;
    fetchAddresses().then(setSavedAddresses).catch(() => setSavedAddresses([]));
  }, [open]);

  useEffect(() => {
    const close = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const persistLocation = async (location, addressId = null) => {
    const normalized = { ...location, addressId };
    saveStoredLocation(normalized);
    setSelectedLocation(normalized);
    setQuery('');
    const user = getUser();
    if (user && localStorage.getItem('token') && !addressId) {
      try {
        const saved = await createAddress({
          label: 'Delivery location', recipient_name: user.name || 'Customer', phone: user.phone || 'N/A',
          address: location.address || 'Selected location', latitude: location.latitude, longitude: location.longitude, is_default: true,
        });
        saveStoredLocation({ ...normalized, addressId: saved?.id || null });
      } catch {
        setStatus('Location saved on this device. Sign in to save it to your account.');
      }
    }
    setOpen(false);
  };

  const handleCurrentLocation = async () => {
    if (localStorage.getItem('locationPermissionDenied') === 'true') {
      setStatus('Location access is disabled. Please select your delivery location manually.');
      return;
    }
    setIsLoading(true);
    setStatus('Detecting your location...');
    try {
      await persistLocation(await detectCurrentLocation());
      setStatus('');
    } catch (error) {
      if (error.name === 'LocationPermissionDenied') {
        localStorage.setItem('locationPermissionDenied', 'true');
      }
      setStatus(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setStatus('Searching for that location...');
    try {
      await persistLocation(await searchLocation(query));
      setStatus('');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const chooseSavedAddress = (address) => persistLocation({
    latitude: address.latitude ? Number(address.latitude) : null,
    longitude: address.longitude ? Number(address.longitude) : null,
    address: address.address, city: '', country: '',
  }, address.id);

  return (
    <div className="relative min-w-0" ref={containerRef}>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 min-w-0 group">
        <FaMapMarkerAlt className="text-[#2563EB] text-lg flex-none" />
        <div className="text-left leading-tight min-w-0">
          <p className="hidden lg:block text-[11px] text-gray-500 font-medium">Deliver to</p>
          <div className="flex items-center gap-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate max-w-[110px] sm:max-w-[160px] lg:max-w-[200px]">{selectedLocation?.address || 'Use my current location'}</p><FaChevronDown className={`text-[10px] text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} /></div>
        </div>
      </button>
      {open && <div className="absolute top-full left-0 mt-3 w-[320px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50">
        <button type="button" onClick={handleCurrentLocation} disabled={isLoading} className="w-full flex items-center gap-2 text-sm font-medium text-[#2563EB] hover:text-[#163A63] disabled:opacity-50 text-left"><FaLocationArrow className="text-xs" />{isLoading ? 'Detecting your location...' : 'Use my current location'}</button>
        <form onSubmit={handleSearch} className="mt-3 space-y-2"><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search location or address" className="w-full h-11 px-4 text-sm border border-slate-200 rounded-md outline-none focus:border-[#2563EB]" /><button type="submit" disabled={isLoading || !query.trim()} className="w-full py-2.5 bg-[#0B1F3A] text-white rounded-md font-semibold text-sm disabled:opacity-50">Search location</button></form>
        {savedAddresses.length > 0 && <div className="mt-3 border-t pt-3"><p className="text-xs font-semibold text-slate-500 mb-2">Saved addresses</p>{savedAddresses.map((address) => <button key={address.id} type="button" onClick={() => chooseSavedAddress(address)} className="block w-full text-left text-sm text-slate-700 hover:text-[#2563EB] py-1 truncate">{address.label}: {address.address}</button>)}</div>}
        {status && <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-md p-2">{status}</p>}
      </div>}
    </div>
  );
};

export default LocationSelector;