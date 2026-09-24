import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaFilter,
  FaMapMarkerAlt,
  FaStar,
  FaTag,
  FaTimes,
  FaMotorcycle,
} from "react-icons/fa";
import { fetchRestaurants } from "../api/restaurantApi";
import { getStoredLocation } from "../utils/location";
import RestaurantFilters from "../components/RestaurantFilters";
import { parseCuisines } from "../components/restaurantFilterData";

const formatDistance = (value) => {
  if (!Number.isFinite(Number(value))) return null;
  return `${Number(value).toFixed(1)} km`;
};

// Every card is a real shop (restaurant) from GET /restaurants. The card links
// to /shops/:id so the storefront can load that exact shop's own menu.
const ShopCard = ({ shop }) => {
  const { t } = useTranslation();
  const rating = Number(shop.rating || 0);
  const cuisineLabels = String(shop.cuisine || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
  const distance = formatDistance(Number(shop.distance_km));

  const cardContent = (
    <>
      <div className="h-40 bg-slate-100">
        {shop.image ? (
          <img
            src={shop.image}
            alt={shop.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-bold text-[#163A63]">
            {shop.name?.charAt(0) || "S"}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-[#0B1F3A]">{shop.name}</h2>
          {shop.accepts_vouchers && (
            <span
              title={t("shopsPage.acceptsVouchers")}
              className="shrink-0 rounded-full bg-emerald-50 p-2 text-emerald-700"
            >
              <FaTag size={13} />
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1 text-amber-600">
            <FaStar />{" "}
            {rating ? rating.toFixed(1) : t("shopsPage.newRating")}
          </span>
          {cuisineLabels.length > 0 && <span>{cuisineLabels.join(" · ")}</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
          {shop.avg_delivery_time && (
            <span className="inline-flex items-center gap-1">
              <FaMotorcycle className="text-[#2563EB]" />{" "}
              {shop.avg_delivery_time}
            </span>
          )}
          {distance && (
            <span className="inline-flex items-center gap-1">
              <FaMapMarkerAlt className="text-[#2563EB]" /> {distance}
            </span>
          )}
        </div>
        <p className="mt-3 truncate text-xs text-slate-400">{shop.address}</p>
      </div>
    </>
  );

  // Defensive: a shop without an id can't be opened, so render it unlinked
  // rather than sending the customer to a broken /shops/undefined storefront.
  if (!shop.id) {
    return (
      <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {cardContent}
      </article>
    );
  }

  return (
    <Link
      to={`/shops/${shop.id}`}
      className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {cardContent}
    </Link>
  );
};

const Shops = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shops, setShops] = useState([]);
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
    const controller = new AbortController();
    const params = { sort };
    if (voucherOnly) params.accepts_vouchers = true;
    if (cuisineQuery) params.cuisines = cuisineQuery;
    if (sort === "distance" && location?.latitude && location?.longitude) {
      params.latitude = location.latitude;
      params.longitude = location.longitude;
    }

    const loadShops = async () => {
      setLoading(true);
      setError("");
      try {
        // Real marketplace data only - GET /restaurants powers this list.
        setShops(await fetchRestaurants(params, { signal: controller.signal }));
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED")
          setError(
            requestError.response?.data?.message || t("shopsPage.loadError"),
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadShops();
    return () => controller.abort();
  }, [
    sort,
    voucherOnly,
    cuisineQuery,
    location?.latitude,
    location?.longitude,
    t,
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

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-10 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#2563EB]">
              {t("shopsPage.eyebrow")}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#0B1F3A] sm:text-4xl">
              {t("shopsPage.title")}
            </h1>
            <p className="mt-2 text-slate-500">{t("shopsPage.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0B1F3A] px-4 py-2.5 text-sm font-semibold text-white lg:hidden"
          >
            <FaFilter /> {t("shopsPage.filters")}
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
                  ? t("shopsPage.loadingShops")
                  : t("shopsPage.shopFound", { count: shops.length })}
              </p>
              {selectedCuisines.length > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-semibold text-[#2563EB]"
                >
                  {t("shopsPage.clearFilters")}
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
            ) : shops.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                <h2 className="text-xl font-bold text-[#0B1F3A]">
                  {t("shopsPage.noShops")}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {t("shopsPage.tryFilters")}
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-md bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white"
                >
                  {t("shopsPage.clearFilters")}
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {shops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <button
            aria-label={t("shopsPage.closeFilters")}
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0B1F3A]">
                {t("shopsPage.filters")}
              </h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label={t("shopsPage.closeFilters")}
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
                {t("shopsPage.clearAll")}
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 rounded-md bg-[#0B1F3A] py-3 text-sm font-semibold text-white"
              >
                {t("shopsPage.applyFilters")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Shops;
