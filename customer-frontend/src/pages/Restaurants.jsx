import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaFilter, FaMapMarkerAlt, FaSearch, FaStar, FaTag, FaTimes, FaMotorcycle } from 'react-icons/fa';
import { fetchRestaurants } from '../api/restaurantApi';
import { getStoredLocation } from '../utils/location';

const CUISINES = [
  'African', 'American', 'Asian', 'Bangladeshi', 'BBQ / Skewers', 'Beverages', 'Bread', 'Burgers',
  'Burmese', 'Cakes & Bakery', 'Cambodian', 'Chicken', 'Chinese', 'Chinese BBQ', 'Congee', 'Curry',
  'Desserts', 'Dim Sum', 'Dumpling', 'Fast Food', 'Frappe & Smoothies', 'French', 'Fried Chicken',
  'Fruit Juice', 'German', 'Greek', 'Grilled Meat', 'Halal', 'Healthy Food', 'Hot Pot', 'Ice Cream',
  'Indian', 'Indonesian', 'International', 'Italian', 'Japanese', 'Kebab', 'Korean', 'Lot Chha',
  'Malaysian', 'Meat', 'Meatball', 'Mexican', 'Middle Eastern', 'Milk Tea', 'Noodles',
  'Num Banh Chok - Khmer Noodle', 'Pakistani', 'Pasta', 'Pho', 'Pizza', 'Ramen', 'Rice Dishes',
  'Rice Noodles', 'Roasted Meat', 'Salads', 'Sandwiches', 'Seafood', 'Singaporean', 'Snacks', 'Soups',
  'Sour Fruit', 'Spicy Salad', 'Steak', 'Sushi', 'Tea & Coffee', 'Thai', 'Turkish', 'Udon', 'Vegan',
  'Vegetarian', 'Vietnamese', 'Western',
];

const SORT_OPTIONS = [
  ['relevance', 'Relevance'],
  ['fastest', 'Fastest delivery'],
  ['distance', 'Distance'],
  ['rating', 'Top rated'],
];

const parseCuisines = (value) => (value || '').split(',').map((item) => item.trim()).filter(Boolean);

const formatDistance = (value) => {
  if (!Number.isFinite(Number(value))) return null;
  return `${Number(value).toFixed(1)} km`;
};

const RestaurantCard = ({ restaurant }) => {
  const rating = Number(restaurant.rating || 0);
  const cuisineLabels = String(restaurant.cuisine || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3);
  const distance = formatDistance(Number(restaurant.distance_km));

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="h-40 bg-slate-100">
        {restaurant.image ? <img src={restaurant.image} alt={restaurant.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl font-bold text-[#163A63]">{restaurant.name?.charAt(0) || 'R'}</div>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-[#0B1F3A]">{restaurant.name}</h2>
          {restaurant.accepts_vouchers && <span title="Accepts vouchers" className="shrink-0 rounded-full bg-emerald-50 p-2 text-emerald-700"><FaTag size={13} /></span>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1 text-amber-600"><FaStar /> {rating ? rating.toFixed(1) : 'New'}</span>
          {cuisineLabels.length > 0 && <span>{cuisineLabels.join(' · ')}</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
          {restaurant.avg_delivery_time && <span className="inline-flex items-center gap-1"><FaMotorcycle className="text-[#2563EB]" /> {restaurant.avg_delivery_time}</span>}
          {distance && <span className="inline-flex items-center gap-1"><FaMapMarkerAlt className="text-[#2563EB]" /> {distance}</span>}
        </div>
        <p className="mt-3 truncate text-xs text-slate-400">{restaurant.address}</p>
      </div>
    </article>
  );
};

const FilterContent = ({ sort, setSort, voucherOnly, setVoucherOnly, cuisineSearch, setCuisineSearch, selectedCuisines, toggleCuisine, clearFilters }) => {
  const visibleCuisines = useMemo(() => CUISINES.filter((cuisine) => cuisine.toLowerCase().includes(cuisineSearch.toLowerCase())), [cuisineSearch]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1F3A]">Sort by</h2>
        <div className="mt-3 space-y-2">
          {SORT_OPTIONS.map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-3 text-sm text-slate-700"><input type="radio" name="restaurant-sort" checked={sort === value} onChange={() => setSort(value)} className="h-4 w-4 accent-[#163A63]" />{label}</label>)}
        </div>
      </section>
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1F3A]">Quick filters</h2>
        <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm text-slate-700"><input type="checkbox" checked={voucherOnly} onChange={(event) => setVoucherOnly(event.target.checked)} className="h-4 w-4 accent-[#163A63]" />Accepts vouchers</label>
      </section>
      <section>
        <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1F3A]">Cuisines</h2>{selectedCuisines.length > 0 && <button type="button" onClick={clearFilters} className="text-xs font-semibold text-[#2563EB]">Clear all</button>}</div>
        <div className="relative mt-3"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={cuisineSearch} onChange={(event) => setCuisineSearch(event.target.value)} placeholder="Search cuisines" className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#2563EB]" /></div>
        <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">{visibleCuisines.map((cuisine) => <label key={cuisine} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"><input type="checkbox" checked={selectedCuisines.includes(cuisine)} onChange={() => toggleCuisine(cuisine)} className="h-4 w-4 accent-[#163A63]" /><span className={selectedCuisines.includes(cuisine) ? 'font-semibold text-[#0B1F3A]' : ''}>{cuisine}</span></label>)}</div>
      </section>
    </div>
  );
};

const Restaurants = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [cuisineSearch, setCuisineSearch] = useState('');
  const [location, setLocation] = useState(getStoredLocation);
  const sort = searchParams.get('sort') || 'relevance';
  const voucherOnly = searchParams.get('offers') === 'voucher';
  const selectedCuisines = parseCuisines(searchParams.get('cuisines'));
  const cuisineQuery = selectedCuisines.join(',');

  useEffect(() => {
    const syncLocation = () => setLocation(getStoredLocation());
    window.addEventListener('locationChanged', syncLocation);
    return () => window.removeEventListener('locationChanged', syncLocation);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = { sort };
    if (voucherOnly) params.accepts_vouchers = true;
    if (cuisineQuery) params.cuisines = cuisineQuery;
    if (sort === 'distance' && location?.latitude && location?.longitude) {
      params.latitude = location.latitude;
      params.longitude = location.longitude;
    }

    const loadRestaurants = async () => {
      setLoading(true);
      setError('');
      try {
        setRestaurants(await fetchRestaurants(params, { signal: controller.signal }));
      } catch (requestError) {
        if (requestError.code !== 'ERR_CANCELED') setError(requestError.response?.data?.message || 'Unable to load restaurants.');
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
    return () => controller.abort();
  }, [sort, voucherOnly, cuisineQuery, location?.latitude, location?.longitude]);

  const updateFilters = (next) => setSearchParams(next, { replace: true });
  const setSort = (value) => updateFilters({ sort: value, ...(voucherOnly ? { offers: 'voucher' } : {}), ...(selectedCuisines.length ? { cuisines: selectedCuisines.join(',') } : {}) });
  const setVoucherOnly = (value) => updateFilters({ sort, ...(value ? { offers: 'voucher' } : {}), ...(selectedCuisines.length ? { cuisines: selectedCuisines.join(',') } : {}) });
  const toggleCuisine = (cuisine) => {
    const next = selectedCuisines.includes(cuisine) ? selectedCuisines.filter((item) => item !== cuisine) : [...selectedCuisines, cuisine];
    updateFilters({ sort, ...(voucherOnly ? { offers: 'voucher' } : {}), ...(next.length ? { cuisines: next.join(',') } : {}) });
  };
  const clearFilters = () => updateFilters({ sort: 'relevance' });

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-10 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wider text-[#2563EB]">Delivery</p><h1 className="mt-2 text-3xl font-bold text-[#0B1F3A] sm:text-4xl">Restaurants near you</h1><p className="mt-2 text-slate-500">Discover meals by cuisine, speed, rating, and offers.</p></div><button type="button" onClick={() => setMobileFiltersOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0B1F3A] px-4 py-2.5 text-sm font-semibold text-white lg:hidden"><FaFilter /> Filters</button></div>
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden rounded-xl border border-slate-200 bg-white p-5 lg:block"><FilterContent sort={sort} setSort={setSort} voucherOnly={voucherOnly} setVoucherOnly={setVoucherOnly} cuisineSearch={cuisineSearch} setCuisineSearch={setCuisineSearch} selectedCuisines={selectedCuisines} toggleCuisine={toggleCuisine} clearFilters={clearFilters} /></aside>
          <section><div className="mb-4 flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{loading ? 'Loading restaurants...' : `${restaurants.length} restaurant${restaurants.length === 1 ? '' : 's'} found`}</p>{selectedCuisines.length > 0 && <button type="button" onClick={clearFilters} className="text-sm font-semibold text-[#2563EB]">Clear filters</button>}</div>{loading ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />)}</div> : error ? <div className="rounded-xl border border-rose-100 bg-rose-50 p-8 text-center text-rose-700">{error}</div> : restaurants.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-12 text-center"><h2 className="text-xl font-bold text-[#0B1F3A]">No restaurants found</h2><p className="mt-2 text-sm text-slate-500">Try removing some filters or selecting a different cuisine.</p><button type="button" onClick={clearFilters} className="mt-5 rounded-md bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white">Clear filters</button></div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}</div>}</section>
        </div>
      </div>
      {mobileFiltersOpen && <div className="fixed inset-0 z-60 lg:hidden"><button aria-label="Close filters" type="button" onClick={() => setMobileFiltersOpen(false)} className="absolute inset-0 bg-slate-900/40" /><div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold text-[#0B1F3A]">Filters</h2><button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="text-slate-500"><FaTimes /></button></div><FilterContent sort={sort} setSort={setSort} voucherOnly={voucherOnly} setVoucherOnly={setVoucherOnly} cuisineSearch={cuisineSearch} setCuisineSearch={setCuisineSearch} selectedCuisines={selectedCuisines} toggleCuisine={toggleCuisine} clearFilters={clearFilters} /><div className="mt-6 flex gap-3"><button type="button" onClick={clearFilters} className="flex-1 rounded-md border border-slate-300 py-3 text-sm font-semibold text-slate-700">Clear all</button><button type="button" onClick={() => setMobileFiltersOpen(false)} className="flex-1 rounded-md bg-[#0B1F3A] py-3 text-sm font-semibold text-white">Apply filters</button></div></div></div>}
    </main>
  );
};

export default Restaurants;
