import { useEffect, useState } from 'react';
import { FaLocationArrow, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import { createAddress, fetchAddresses } from '../api/addressApi';
import { detectCurrentLocation, saveStoredLocation, searchLocation } from '../utils/location';

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

// Only rendered by the parent while open, so a fresh mount already gives a
// clean slate — no separate "reset on open" effect needed.
const AddressPickerModal = ({ onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    fetchAddresses().then(setSavedAddresses).catch(() => setSavedAddresses([]));
  }, []);

  const persistAndSelect = async (location, addressId = null) => {
    const normalized = { ...location, addressId };
    const user = getUser();

    if (user && localStorage.getItem('token') && !addressId) {
      try {
        const saved = await createAddress({
          label: 'Delivery location',
          recipient_name: user.name || 'Customer',
          phone: user.phone || 'N/A',
          address: location.address || 'Selected location',
          latitude: location.latitude,
          longitude: location.longitude,
          is_default: true,
        });
        normalized.addressId = saved?.id || null;
      } catch {
        setStatus('Could not save this address to your account. Please try again.');
        return;
      }
    }

    saveStoredLocation(normalized);
    onSelect(normalized);
    onClose();
  };

  const handleCurrentLocation = async () => {
    setIsLoading(true);
    setStatus('Detecting your location...');
    try {
      await persistAndSelect(await detectCurrentLocation());
      setStatus('');
    } catch (error) {
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
      await persistAndSelect(await searchLocation(query));
      setStatus('');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const chooseSavedAddress = (address) => persistAndSelect({
    latitude: address.latitude ? Number(address.latitude) : null,
    longitude: address.longitude ? Number(address.longitude) : null,
    address: address.address,
    city: '',
    country: '',
  }, address.id);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--brand-navy)' }}>Choose delivery address</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
            <FaTimes />
          </button>
        </div>

        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={isLoading}
          className="w-full flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-lg border border-slate-200 hover:border-[var(--brand-accent)] transition disabled:opacity-50"
          style={{ color: 'var(--brand-accent)' }}
        >
          <FaLocationArrow className="text-xs" />
          {isLoading ? 'Detecting your location...' : 'Use my current location'}
        </button>

        <form onSubmit={handleSearch} className="mt-3 flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search location or address"
            className="app-input flex-1 h-11 px-4 text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="app-button-primary px-4 text-sm font-semibold disabled:opacity-50"
          >
            Search
          </button>
        </form>

        {savedAddresses.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500 mb-2">Saved addresses</p>
            <div className="space-y-1">
              {savedAddresses.map((address) => (
                <button
                  key={address.id}
                  type="button"
                  onClick={() => chooseSavedAddress(address)}
                  className="w-full flex items-start gap-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2 transition"
                >
                  <FaMapMarkerAlt className="mt-0.5 shrink-0" style={{ color: 'var(--brand-accent)' }} />
                  <span>
                    <span className="font-semibold">{address.label}</span>: {address.address}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {status && (
          <p className="mt-4 text-xs rounded-lg p-3 bg-amber-50 text-amber-700">{status}</p>
        )}
      </div>
    </div>
  );
};

export default AddressPickerModal;
