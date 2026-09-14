import { useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import { CUISINES, SORT_OPTIONS } from "./restaurantFilterData";

export default function RestaurantFilters({
  sort,
  setSort,
  voucherOnly,
  setVoucherOnly,
  cuisineSearch,
  setCuisineSearch,
  selectedCuisines,
  toggleCuisine,
  clearFilters,
}) {
  const visibleCuisines = useMemo(
    () =>
      CUISINES.filter((cuisine) =>
        cuisine.toLowerCase().includes(cuisineSearch.toLowerCase()),
      ),
    [cuisineSearch],
  );

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1F3A]">
          Sort by
        </h2>
        <div className="mt-3 space-y-2">
          {SORT_OPTIONS.map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 text-sm text-slate-700"
            >
              <input
                type="radio"
                name="restaurant-sort"
                checked={sort === value}
                onChange={() => setSort(value)}
                className="h-4 w-4 accent-[#163A63]"
              />
              {label}
            </label>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1F3A]">
          Quick filters
        </h2>
        <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={voucherOnly}
            onChange={(event) => setVoucherOnly(event.target.checked)}
            className="h-4 w-4 accent-[#163A63]"
          />
          Accepts vouchers
        </label>
      </section>
      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1F3A]">
            Cuisines
          </h2>
          {selectedCuisines.length > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-[#2563EB]"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="relative mt-3">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={cuisineSearch}
            onChange={(event) => setCuisineSearch(event.target.value)}
            placeholder="Search cuisines"
            className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#2563EB]"
          />
        </div>
        <div className="mt-3 max-h-200 space-y-1 overflow-y-auto pr-1">
          {visibleCuisines.map((cuisine) => (
            <label
              key={cuisine}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selectedCuisines.includes(cuisine)}
                onChange={() => toggleCuisine(cuisine)}
                className="h-4 w-4 accent-[#163A63]"
              />
              <span
                className={
                  selectedCuisines.includes(cuisine)
                    ? "font-semibold text-[#0B1F3A]"
                    : ""
                }
              >
                {cuisine}
              </span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
