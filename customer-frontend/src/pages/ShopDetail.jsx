import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaMapMarkerAlt, FaShoppingCart } from "react-icons/fa";
import Toast from "../components/Toast";
import { fetchRestaurant } from "../api/restaurantApi";
import { addCartItem, fetchFoods } from "../api/foodApi";

const isFoodAvailable = (food) =>
  String(food?.status || "available").toLowerCase() === "available";

const getCartItemType = (category = "") => {
  const value = String(category).toLowerCase();
  if (value.includes("dessert")) return "dessert";
  if (value.includes("snack")) return "snack";
  if (value.includes("soup")) return "soup";
  return "food";
};

const ShopDetail = () => {
  const { t } = useTranslation();
  const { id: shopId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [restaurant, setRestaurant] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingFoodId, setAddingFoodId] = useState(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Arriving from the Pick-up tab means the customer wants to collect this
    // order in person, so remember that so Cart can default its "Order type"
    // toggle to Pick-up instead of always starting on Delivery.
    if (searchParams.get("type") === "pickup") {
      localStorage.setItem("preferredOrderType", "pickup");
    }
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadStorefront = async () => {
      setLoading(true);
      setError("");
      setRestaurant(null);
      setFoods([]);
      try {
        // Both calls are real Laravel API reads: the shop itself, and only
        // the foods that belong to this shop id.
        const [restaurantData, menuData] = await Promise.all([
          fetchRestaurant(shopId),
          fetchFoods({ restaurant_id: shopId }, { signal: controller.signal }),
        ]);

        if (!isMounted) return;

        setRestaurant(restaurantData);
        // Defensive filter: never show another shop's products even if the
        // API ignored restaurant_id, so the menu always matches this shop.
        setFoods(
          (menuData || []).filter(
            (food) => String(food.restaurantId) === String(shopId),
          ),
        );
      } catch (requestError) {
        if (!isMounted || requestError.code === "ERR_CANCELED") return;
        setError(
          requestError.response?.data?.message || t("shopDetail.loadError"),
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadStorefront();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [shopId, reloadKey, t]);

  const sortedFoods = useMemo(
    () =>
      [...foods].sort((a, b) => {
        if (isFoodAvailable(a) !== isFoodAvailable(b)) {
          return isFoodAvailable(a) ? -1 : 1;
        }
        return String(a.name || "").localeCompare(String(b.name || ""));
      }),
    [foods],
  );

  const addToCart = useCallback(
    async (food) => {
      const currentUser =
        localStorage.getItem("currentUser") || localStorage.getItem("user");
      if (!currentUser || !localStorage.getItem("token")) {
        setToast({ message: t("shopDetail.loginRequired"), type: "error" });
        setTimeout(() => navigate("/login"), 1500);
        return;
      }

      if (!isFoodAvailable(food)) {
        setToast({ message: t("shopDetail.itemUnavailable"), type: "error" });
        return;
      }

      setAddingFoodId(food.id);
      try {
        // Same cart logic the rest of the customer app uses.
        await addCartItem(food.id, 1);

        const type = getCartItemType(food.category);
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const index = cart.findIndex(
          (item) => item.id === food.id && item.type === type,
        );

        if (index >= 0) {
          cart[index].quantity += 1;
        } else {
          cart.push({
            id: food.id,
            name: food.name,
            price: food.price,
            image: food.image,
            category: food.category,
            restaurant_id: food.restaurantId || restaurant?.id,
            restaurantName: restaurant?.name || food.restaurantName,
            food_id: food.id,
            qty: food.qty || 10,
            type,
            quantity: 1,
            detailLink: `/food/${food.id}`,
          });
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("cartUpdated"));
        setToast({
          message: t("shopDetail.added", { name: food.name }),
          type: "success",
        });
      } catch (requestError) {
        setToast({
          message:
            requestError.response?.data?.message || t("shopDetail.addFailed"),
          type: "error",
        });
      } finally {
        setAddingFoodId(null);
      }
    },
    [navigate, restaurant, t],
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] px-4 py-10 text-slate-800 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="h-48 animate-pulse rounded-xl border border-slate-200 bg-white sm:h-64" />
          <div className="mt-8 h-6 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            {t("shopDetail.loading")}
          </p>
        </div>
      </main>
    );
  }

  if (error || !restaurant) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F5F7FA] px-4 text-center">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">
          {error || t("shopDetail.notFound")}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="rounded-md bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white"
          >
            {t("shopDetail.retry")}
          </button>
          <Link to="/shops" className="font-semibold text-[#2563EB]">
            {t("shopDetail.backToShops")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-10 text-slate-800 sm:px-6 lg:px-10">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mx-auto max-w-7xl">
        <Link
          to="/shops"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB]"
        >
          <FaArrowLeft /> {t("shopDetail.backToShops")}
        </Link>

        {/* Storefront header - every field comes from GET /restaurants/{id} */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="h-48 bg-slate-100 sm:h-64">
            {restaurant.image ? (
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-5xl font-bold text-[#163A63]">
                {restaurant.name?.charAt(0) || "S"}
              </div>
            )}
          </div>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-[#0B1F3A] sm:text-3xl">
              {restaurant.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {restaurant.cuisine || t("shopDetail.variousCuisines")}
            </p>
            {restaurant.description && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {restaurant.description}
              </p>
            )}
            {restaurant.address && (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                <FaMapMarkerAlt className="text-[#2563EB]" />{" "}
                {restaurant.address}
              </p>
            )}
          </div>
        </div>

        <div className="mb-4 mt-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0B1F3A]">
              {t("shopDetail.menu")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("shopDetail.itemCount", { count: sortedFoods.length })}
            </p>
          </div>
          <Link to="/cart" className="text-sm font-semibold text-[#2563EB]">
            {t("shopDetail.viewCart")}
          </Link>
        </div>

        {sortedFoods.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-500">{t("shopDetail.emptyMenu")}</p>
            <p className="mt-2 text-sm text-slate-400">
              {t("shopDetail.emptyMenuHint")}
            </p>
            <Link
              to="/shops"
              className="mt-5 inline-block rounded-md bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white"
            >
              {t("shopDetail.backToShops")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedFoods.map((food) => {
              const available = isFoodAvailable(food);
              return (
                <article
                  key={food.id}
                  className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Link to={`/food/${food.id}`} className="block">
                    <div className="h-40 bg-slate-100">
                      <img
                        src={food.image}
                        alt={food.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/food/${food.id}`}
                        className="min-w-0 flex-1 text-base font-bold text-[#0B1F3A] hover:text-[#2563EB]"
                      >
                        {food.name}
                      </Link>
                      <span className="shrink-0 text-sm font-bold text-[#2563EB]">
                        ${food.price.toFixed(2)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {food.category}
                    </p>
                    {food.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">
                        {food.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          available
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {available
                          ? t("shopDetail.available")
                          : t("shopDetail.unavailable")}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCart(food)}
                      disabled={!available || addingFoodId === food.id}
                      className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#0B1F3A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#132C52] disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <FaShoppingCart />
                      {addingFoodId === food.id
                        ? t("shopDetail.adding")
                        : t("shopDetail.addToCart")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default ShopDetail;
