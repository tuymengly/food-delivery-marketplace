import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaFilter, FaTimes } from "react-icons/fa";
import { fetchRestaurants } from "../api/restaurantApi";
import { fetchFoods } from "../api/foodApi";
import { getStoredLocation } from "../utils/location";
import RestaurantFilters from "../components/RestaurantFilters";
import { parseCuisines } from "../components/restaurantFilterData";

const AllMenu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [cuisineSearch, setCuisineSearch] = useState("");
  const [location, setLocation] = useState(getStoredLocation);
  const sort = searchParams.get("sort") || "relevance";
  const voucherOnly = searchParams.get("offers") === "voucher";
  const selectedCuisines = parseCuisines(searchParams.get("cuisines"));
  const cuisineQuery = selectedCuisines.join(",");

  useEffect(() => {
    const syncLocation = () => setLocation(getStoredLocation());
    window.addEventListener("locationChanged", syncLocation);
    return () => window.removeEventListener("locationChanged", syncLocation);
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchFoods()
      .then((data) => {
        if (isMounted) setFoods(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = { sort };
    if (voucherOnly) params.accepts_vouchers = true;
    if (cuisineQuery) params.cuisines = cuisineQuery;
    if (sort === "distance" && location?.latitude && location?.longitude) {
      params.latitude = location.latitude;
      params.longitude = location.longitude;
    }

    const loadRestaurants = async () => {
      setLoading(true);
      setError("");
      try {
        setRestaurants(
          await fetchRestaurants(params, { signal: controller.signal }),
        );
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED")
          setError(
            requestError.response?.data?.message ||
              "Unable to load restaurants.",
          );
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
    return () => controller.abort();
  }, [
    sort,
    voucherOnly,
    cuisineQuery,
    location?.latitude,
    location?.longitude,
  ]);

  const updateFilters = (next) => setSearchParams(next, { replace: true });
  const setSort = (value) =>
    updateFilters({
      sort: value,
      ...(voucherOnly ? { offers: "voucher" } : {}),
      ...(selectedCuisines.length
        ? { cuisines: selectedCuisines.join(",") }
        : {}),
    });
  const setVoucherOnly = (value) =>
    updateFilters({
      sort,
      ...(value ? { offers: "voucher" } : {}),
      ...(selectedCuisines.length
        ? { cuisines: selectedCuisines.join(",") }
        : {}),
    });
  const toggleCuisine = (cuisine) => {
    const next = selectedCuisines.includes(cuisine)
      ? selectedCuisines.filter((item) => item !== cuisine)
      : [...selectedCuisines, cuisine];
    updateFilters({
      sort,
      ...(voucherOnly ? { offers: "voucher" } : {}),
      ...(next.length ? { cuisines: next.join(",") } : {}),
    });
  };
  const clearFilters = () => updateFilters({ sort: "relevance" });

  const filteredFoods = useMemo(() => {
    const order = new Map(
      restaurants.map((restaurant, index) => [restaurant.id, index]),
    );
    return foods
      .filter((food) => order.has(food.restaurantId))
      .sort((a, b) => order.get(a.restaurantId) - order.get(b.restaurantId));
  }, [foods, restaurants]);

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-10 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#2563EB]">
              Delivery
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#0B1F3A] sm:text-4xl">
              Restaurants near you
            </h1>
            <p className="mt-2 text-slate-500">
              Discover meals by cuisine, speed, rating, and offers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0B1F3A] px-4 py-2.5 text-sm font-semibold text-white lg:hidden"
          >
            <FaFilter /> Filters
          </button>
        </div>
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden rounded-xl border border-slate-200 bg-white p-5 lg:block">
            <RestaurantFilters
              sort={sort}
              setSort={setSort}
              voucherOnly={voucherOnly}
              setVoucherOnly={setVoucherOnly}
              cuisineSearch={cuisineSearch}
              setCuisineSearch={setCuisineSearch}
              selectedCuisines={selectedCuisines}
              toggleCuisine={toggleCuisine}
              clearFilters={clearFilters}
            />
          </aside>
          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {loading
                  ? "Loading dishes..."
                  : `${filteredFoods.length} dish${filteredFoods.length === 1 ? "" : "es"} found`}
              </p>
              {selectedCuisines.length > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-semibold text-[#2563EB]"
                >
                  Clear filters
                </button>
              )}
            </div>
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-8 text-center text-rose-700">
                {error}
              </div>
            ) : filteredFoods.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                <h2 className="text-xl font-bold text-[#0B1F3A]">
                  No dishes found
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Try removing some filters or selecting a different cuisine.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-md bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFoods.map((food) => (
<Link
  key={food.id}
  to={`/restaurants/${food.restaurantId}`}
  className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
>
                    <div className="h-40 bg-slate-100">
                      <img
                        src={food.image}
                        alt={food.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="min-w-0 flex-1 truncate text-lg font-bold text-[#0B1F3A]">
                          {food.name}
                        </h2>
                        <span className="shrink-0 text-sm font-bold text-[#2563EB]">
                          ${food.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-sm text-slate-500">
                        {food.category}
                      </p>
                      <p className="mt-3 truncate text-xs text-slate-400">
                        From: {food.restaurantName}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <button
            aria-label="Close filters"
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0B1F3A]">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="text-slate-500"
              >
                <FaTimes />
              </button>
            </div>
            <RestaurantFilters
              sort={sort}
              setSort={setSort}
              voucherOnly={voucherOnly}
              setVoucherOnly={setVoucherOnly}
              cuisineSearch={cuisineSearch}
              setCuisineSearch={setCuisineSearch}
              selectedCuisines={selectedCuisines}
              toggleCuisine={toggleCuisine}
              clearFilters={clearFilters}
            />
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 rounded-md border border-slate-300 py-3 text-sm font-semibold text-slate-700"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 rounded-md bg-[#0B1F3A] py-3 text-sm font-semibold text-white"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AllMenu;
