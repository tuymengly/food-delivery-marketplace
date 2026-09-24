import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchRestaurants } from "../api/restaurantApi";
import RestaurantFilters from "../components/RestaurantFilters";
import { parseCuisines } from "../components/restaurantFilterData";

const Pickup = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cuisineSearch, setCuisineSearch] = useState("");
  const sort = searchParams.get("sort") || "relevance";
  const voucherOnly = searchParams.get("offers") === "voucher";
  const selectedCuisines = parseCuisines(searchParams.get("cuisines"));
  const cuisineQuery = selectedCuisines.join(",");

  useEffect(() => {
    const controller = new AbortController();
    const loadRestaurants = async () => {
      setLoading(true);
      setError("");
      try {
        const params = { sort };
        if (voucherOnly) params.accepts_vouchers = true;
        if (cuisineQuery) params.cuisines = cuisineQuery;
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
  }, [sort, voucherOnly, cuisineQuery, searchParams]);

  const updateFilters = (next) => {
    const params = Object.fromEntries(searchParams);
    Object.entries(next).forEach(([key, value]) =>
      value === undefined ? delete params[key] : (params[key] = value),
    );
    setSearchParams(params, { replace: true });
  };
  const toggleCuisine = (cuisine) => {
    const next = selectedCuisines.includes(cuisine)
      ? selectedCuisines.filter((item) => item !== cuisine)
      : [...selectedCuisines, cuisine];
    updateFilters({ cuisines: next.length ? next.join(",") : undefined });
  };
  const clearFilters = () =>
    setSearchParams({ sort: "relevance" }, { replace: true });

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-10 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#2563EB]">
            Pick-up
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#0B1F3A] sm:text-4xl">
            Choose a restaurant for pick-up
          </h1>
          <p className="mt-2 text-slate-500">
            Find restaurants by speed, rating, offers, and cuisine.
          </p>
        </header>
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-xl border border-slate-200 bg-white p-5">
            <RestaurantFilters
              sort={sort}
              setSort={(value) => updateFilters({ sort: value })}
              voucherOnly={voucherOnly}
              setVoucherOnly={(value) =>
                updateFilters({ offers: value ? "voucher" : undefined })
              }
              cuisineSearch={cuisineSearch}
              setCuisineSearch={setCuisineSearch}
              selectedCuisines={selectedCuisines}
              toggleCuisine={toggleCuisine}
              clearFilters={clearFilters}
            />
          </aside>
          <section>
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              Choose a restaurant, add items to your cart, then select
              "Pick-up" as the order type at checkout to skip the delivery
              fee and collect your order in person.
            </div>
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-8 text-center text-rose-700">
                {error}
              </div>
            ) : restaurants.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                <h2 className="text-xl font-bold text-[#0B1F3A]">
                  No restaurants found
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Try removing some filters.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants.map((restaurant) => (
                  <Link
                    key={restaurant.id}
                    to={`/shops/${restaurant.id}?type=pickup`}
                    className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="h-40 bg-slate-100">
                      {restaurant.image ? (
                        <img
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl font-bold text-[#163A63]">
                          {restaurant.name?.charAt(0) || "R"}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="text-lg font-bold text-[#0B1F3A]">
                        {restaurant.name}
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        {restaurant.cuisine || "Various cuisines"}
                      </p>
                      <p className="mt-3 text-xs text-slate-400">
                        {restaurant.address}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default Pickup;