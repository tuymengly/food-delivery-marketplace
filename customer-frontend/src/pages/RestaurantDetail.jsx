import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { FaArrowLeft, FaMapMarkerAlt } from "react-icons/fa";
import { fetchRestaurant } from "../api/restaurantApi";
import { normalizeFood } from "../api/foodApi";

const RestaurantDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Arriving from the Pick-up tab means the customer wants to collect
    // this order in person, so remember that so Cart can default its
    // "Order type" toggle to Pick-up instead of always starting on Delivery.
    if (searchParams.get("type") === "pickup") {
      localStorage.setItem("preferredOrderType", "pickup");
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    const loadRestaurant = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchRestaurant(id);
        if (isMounted) setRestaurant(data);
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load this restaurant.",
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadRestaurant();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
        <p className="text-slate-500">Loading restaurant...</p>
      </main>
    );
  }

  if (error || !restaurant) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F5F7FA] px-4 text-center">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">
          {error || "Restaurant not found"}
        </h1>
        <Link to="/menu" className="font-semibold text-[#2563EB]">
          ← Back to Delivery
        </Link>
      </main>
    );
  }

  const foods = (restaurant.foods || []).map(normalizeFood);

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-10 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/menu"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB]"
        >
          <FaArrowLeft /> Back to Delivery
        </Link>

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
                {restaurant.name?.charAt(0) || "R"}
              </div>
            )}
          </div>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-[#0B1F3A] sm:text-3xl">
              {restaurant.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {restaurant.cuisine || "Various cuisines"}
            </p>
            {restaurant.address && (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                <FaMapMarkerAlt className="text-[#2563EB]" /> {restaurant.address}
              </p>
            )}
          </div>
        </div>

        <h2 className="mb-4 mt-8 text-lg font-bold text-[#0B1F3A]">Menu</h2>
        {foods.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-500">This restaurant hasn't added any dishes yet.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {foods.map((food) => (
              <Link
                key={food.id}
                to={`/food/${food.id}`}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="h-40 bg-slate-100">
                  <img
                    src={food.image}
                    alt={food.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-[#0B1F3A]">
                      {food.name}
                    </h3>
                    <span className="shrink-0 text-sm font-bold text-[#2563EB]">
                      ${food.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{food.category}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default RestaurantDetail;
