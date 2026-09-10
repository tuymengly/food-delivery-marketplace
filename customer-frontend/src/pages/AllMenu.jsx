import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { addCartItem, fetchCategories, fetchFoods } from '../api/foodApi';
import { fetchRestaurants } from '../api/restaurantApi';
import { FaFilter, FaHeart, FaMapMarkerAlt, FaMotorcycle, FaRegHeart, FaSearch, FaStar, FaTag } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import Toast from '../components/Toast';

const SORT_OPTIONS = [['relevance', 'Relevance'], ['fastest', 'Fastest delivery'], ['distance', 'Distance'], ['rating', 'Top rated']];

const getFoodType = (category = '') => {
  const value = category.toLowerCase();
  if (value.includes('dessert')) return 'Dessert';
  if (value.includes('snack')) return 'Snack';
  if (value.includes('soup')) return 'Soup';
  return 'Food';
};

const LoadingCard = ({ compact = false }) => (
  <div className="animate-pulse overflow-hidden rounded-lg border border-slate-200 bg-white">
    <div className={`${compact ? 'h-36' : 'h-44'} bg-slate-200`} />
    {compact && <div className="space-y-3 p-4"><div className="h-4 w-3/4 rounded bg-slate-200" /><div className="h-3 w-1/2 rounded bg-slate-200" /><div className="h-9 rounded bg-slate-200" /></div>}
  </div>
);

const RestaurantCard = ({ restaurant, onOpen }) => {
  const rating = Number(restaurant.rating || 0);
  const cuisines = String(restaurant.cuisine || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3);
  const distance = Number.isFinite(Number(restaurant.distance_km)) ? `${Number(restaurant.distance_km).toFixed(1)} km` : null;
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <button type="button" onClick={() => onOpen(restaurant.id)} className="block w-full text-left">
        <div className="h-44 bg-slate-100">{restaurant.image ? <img src={restaurant.image} alt={restaurant.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl font-bold text-[#163A63]">{restaurant.name?.charAt(0) || 'R'}</div>}</div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3"><h3 className="text-lg font-bold text-[#0B1F3A]">{restaurant.name}</h3>{restaurant.accepts_vouchers && <span title="Accepts vouchers" className="shrink-0 rounded-full bg-emerald-50 p-2 text-emerald-700"><FaTag size={13} /></span>}</div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500"><span className="inline-flex items-center gap-1 text-amber-600"><FaStar /> {rating ? rating.toFixed(1) : 'New'}</span>{cuisines.length > 0 && <span>{cuisines.join(' · ')}</span>}</div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">{restaurant.avg_delivery_time && <span className="inline-flex items-center gap-1"><FaMotorcycle className="text-[#2563EB]" />{restaurant.avg_delivery_time}</span>}{restaurant.delivery_fee !== null && restaurant.delivery_fee !== undefined && <span>${Number(restaurant.delivery_fee).toFixed(2)} delivery</span>}{distance && <span className="inline-flex items-center gap-1"><FaMapMarkerAlt className="text-[#2563EB]" />{distance}</span>}</div>
          {restaurant.status && <p className="mt-3 text-xs font-semibold text-emerald-700">{restaurant.status === 'active' ? 'Open now' : 'Closed'}</p>}
        </div>
      </button>
    </article>
  );
};

const AllMenu = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [voucherOnly, setVoucherOnly] = useState(searchParams.get('offers') === 'voucher');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; }
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const [restaurantData, foodData, categoryData] = await Promise.all([fetchRestaurants({ sort: sortBy }), fetchFoods(), fetchCategories()]);
      setRestaurants(restaurantData); setFoods(foodData);
      setCategories(Array.isArray(categoryData) ? categoryData.filter((category) => Number(category.foods_count ?? category.foods?.length ?? 0) > 0) : []);
    } catch { setError('Unable to load restaurants and menu items.'); } finally { setLoading(false); }
  };

  // The effect synchronizes the page with the API whenever sorting changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [sortBy]);
  useEffect(() => {
    const updateFavorites = () => setFavorites(JSON.parse(localStorage.getItem('favorites') || '[]'));
    window.addEventListener('favoritesUpdated', updateFavorites);
    return () => window.removeEventListener('favoritesUpdated', updateFavorites);
  }, []);

  const updateUrl = (next) => {
    const params = Object.fromEntries(searchParams);
    Object.entries(next).forEach(([key, value]) => value === undefined ? delete params[key] : params[key] = value);
    setSearchParams(params, { replace: true });
  };
  const term = searchTerm.trim().toLowerCase();
  const categoryName = categories.find((category) => String(category.id) === String(selectedCategory))?.name;
  const visibleRestaurants = useMemo(() => restaurants.filter((restaurant) => {
    const searchable = [restaurant.name, restaurant.cuisine, restaurant.address].filter(Boolean).join(' ').toLowerCase();
    return (!term || searchable.includes(term)) && (selectedCategory === 'all' || searchable.includes(String(categoryName || '').toLowerCase())) && (!voucherOnly || restaurant.accepts_vouchers);
  }), [restaurants, term, selectedCategory, categoryName, voucherOnly]);
  const visibleFoods = useMemo(() => foods.filter((food) => {
    const searchable = [food.name, food.category, food.description, food.restaurantName].filter(Boolean).join(' ').toLowerCase();
    return (!term || searchable.includes(term)) && (selectedCategory === 'all' || String(food.categoryId) === String(selectedCategory) || String(food.category).toLowerCase() === String(categoryName || '').toLowerCase());
  }), [foods, term, selectedCategory, categoryName]);

  const toggleFavorite = (food) => {
    if (!localStorage.getItem('currentUser') && !localStorage.getItem('user')) { navigate('/login'); return; }
    const type = getFoodType(food.category).toLowerCase();
    const isFavorite = favorites.some((item) => item.id === food.id && item.type === type);
    const next = isFavorite ? favorites.filter((item) => !(item.id === food.id && item.type === type)) : [...favorites, { ...food, type }];
    setFavorites(next); localStorage.setItem('favorites', JSON.stringify(next)); window.dispatchEvent(new Event('favoritesUpdated'));
  };

  const addToCart = async (food) => {
    if ((!localStorage.getItem('currentUser') && !localStorage.getItem('user')) || !localStorage.getItem('token')) {
      setToastMessage(t('favorites.loginRequired')); setShowToast(true); setTimeout(() => navigate('/login'), 1500); return;
    }
    try { await addCartItem(food.id, 1); setToastMessage(`${food.name} ${t('favorites.addedToCart')}`); window.dispatchEvent(new Event('cartUpdated')); } catch { setToastMessage('Could not add item to cart. Please try again.'); }
    setShowToast(true);
  };

  const resetFilters = () => { setSearchTerm(''); setSelectedCategory('all'); setSortBy('relevance'); setVoucherOnly(false); setSearchParams({}, { replace: true }); };
  const updateCategory = (value) => { setSelectedCategory(value); updateUrl({ category: value === 'all' ? undefined : value }); };

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 pb-16 pt-8 text-[#1F2937] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-slate-200 pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2563EB]">Delivery</p><h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-[#0B1F3A] sm:text-4xl">Order food from your favorite restaurants</h1><p className="mt-3 text-base text-slate-500">Discover restaurants and delicious meals near you.</p>
          <div className="relative mt-6 max-w-3xl"><FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); updateUrl({ q: event.target.value || undefined }); }} placeholder="Search for restaurants, dishes, or cuisines" className="h-12 w-full rounded-md border border-slate-300 bg-white pl-11 pr-10 text-sm shadow-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100" />{searchTerm && <button type="button" aria-label="Clear search" onClick={() => { setSearchTerm(''); updateUrl({ q: undefined }); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><IoClose /></button>}</div>
        </header>
        <section className="border-b border-slate-200 py-5"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1F3A]">Browse categories</h2><button type="button" onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#0B1F3A] lg:hidden"><FaFilter /> Filters</button></div><div className="flex gap-2 overflow-x-auto pb-1">{loading ? [1, 2, 3, 4, 5].map((item) => <div key={item} className="h-9 w-24 shrink-0 animate-pulse rounded-md bg-slate-200" />) : [{ id: 'all', name: 'All' }, ...categories].map((category) => <button type="button" key={category.id} onClick={() => updateCategory(String(category.id))} className={`shrink-0 rounded-md border px-4 py-2 text-sm font-semibold transition ${String(selectedCategory) === String(category.id) ? 'border-[#0B1F3A] bg-[#0B1F3A] text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-[#2563EB] hover:text-[#2563EB]'}`}>{category.name}</button>)}</div></section>
        <section className={`${showFilters ? 'block' : 'hidden'} border-b border-slate-200 py-5 lg:block`}><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><label className="flex items-center gap-3 text-sm font-semibold text-slate-700">Sort by<select value={sortBy} onChange={(event) => { setSortBy(event.target.value); updateUrl({ sort: event.target.value }); }} className="rounded-md border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-[#2563EB]">{SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={voucherOnly} onChange={(event) => { setVoucherOnly(event.target.checked); updateUrl({ offers: event.target.checked ? 'voucher' : undefined }); }} className="h-4 w-4 accent-[#163A63]" /> Accepts vouchers</label><button type="button" onClick={resetFilters} className="text-left text-sm font-semibold text-[#2563EB]">Clear filters</button></div></section>
        {error ? <div className="mt-8 rounded-lg border border-rose-200 bg-rose-50 p-8 text-center"><h2 className="font-bold text-rose-900">Unable to load restaurants.</h2><p className="mt-2 text-sm text-rose-700">Please try again.</p><button type="button" onClick={loadData} className="mt-5 rounded-md bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white">Try again</button></div> : <><section className="pt-8"><div className="mb-5"><h2 className="text-2xl font-bold text-[#0B1F3A]">All restaurants</h2><p className="mt-1 text-sm text-slate-500">{loading ? 'Finding places near you...' : `${visibleRestaurants.length} restaurant${visibleRestaurants.length === 1 ? '' : 's'} found`}</p></div>{loading ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <LoadingCard key={item} />)}</div> : visibleRestaurants.length === 0 ? <div className="rounded-lg border border-slate-200 bg-white p-10 text-center"><h3 className="font-bold text-[#0B1F3A]">No restaurants found</h3><p className="mt-2 text-sm text-slate-500">Try changing your filters or search for another restaurant.</p></div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visibleRestaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} onOpen={() => navigate('/restaurants')} />)}</div>}</section>
          <section className="pt-12"><div className="mb-5"><h2 className="text-2xl font-bold text-[#0B1F3A]">Explore dishes</h2><p className="mt-1 text-sm text-slate-500">Popular meals from restaurants on the marketplace.</p></div>{loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <LoadingCard key={item} compact />)}</div> : visibleFoods.length === 0 ? <div className="rounded-lg border border-slate-200 bg-white p-10 text-center"><h3 className="font-bold text-[#0B1F3A]">No foods found</h3><p className="mt-2 text-sm text-slate-500">Try another search or category.</p></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{visibleFoods.slice(0, 8).map((food) => { const type = getFoodType(food.category); const favorite = favorites.some((item) => item.id === food.id && item.type === type.toLowerCase()); return <article key={`${food.id}-${type}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="relative h-36 bg-slate-100"><img src={food.image} alt={food.name} className="h-full w-full object-cover" /><button type="button" aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'} onClick={() => toggleFavorite(food)} className="absolute right-3 top-3 rounded-full bg-white p-2 text-slate-600 shadow-sm hover:text-red-500">{favorite ? <FaHeart className="text-red-500" /> : <FaRegHeart />}</button></div><div className="p-4"><a href={`/food/${food.id}`} className="block"><h3 className="truncate font-bold text-[#0B1F3A] hover:text-[#2563EB]">{food.name}</h3><p className="mt-1 truncate text-sm text-slate-500">{food.restaurantName}</p><p className="mt-3 text-lg font-bold text-[#163A63]">${Number(food.price).toFixed(2)}</p></a><button type="button" onClick={() => addToCart(food)} className="mt-3 w-full rounded-md bg-[#0B1F3A] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#163A63]">+ Add</button></div></article>; })}</div>}</section></>}
      </div>
      {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}
    </main>
  );
};

export default AllMenu;
