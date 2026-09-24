import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  History,
  Loader2,
  Navigation,
  Package,
  RefreshCw,
  User,
  Utensils,
  Wallet,
} from "lucide-react";
import {
  getDriverOrders,
  updateDriverOrderStatus,
  getRiderProfile,
  updateRiderLocation,
  updateRiderOnlineStatus,
} from "../../../services/driverService";
import API from "../../../services/api";
import { uploadImageToCloudinary } from "../../../services/cloudinary";
import { getStoredUser, logout, persistUser } from "../../../services/session";
import Sidebar from "../components/DriverSidebar";
import Header from "../components/Header";
import DeliveryRouteMap from "../../../components/ui/DeliveryRouteMap";

const emptySummary = {
  today_deliveries: 0,
  today_earnings: "$0.00",
  week_earnings: "$0.00",
  month_earnings: "$0.00",
};

const readCurrentUser = () => {
  const sessionUser = getStoredUser();
  if (sessionUser) return sessionUser;

  return {
    name: localStorage.getItem("name") || "Rider",
    role: "rider",
  };
};

export default function DriverDashboard() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [activeTab, setActiveTab] = useState(() =>
    location.pathname.endsWith("/profile") ? "profile" : "requests",
  );
  const [activeOrder, setActiveOrder] = useState(null);
  const [riderPosition, setRiderPosition] = useState(null);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [user] = useState(readCurrentUser);
  const [profile, setProfile] = useState(() => ({
    name: user.name || "",
    phone: user.phone || "",
    profile_image: user.profile_image || "",
  }));
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFile, setProfileFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");

  const navItems = [
    { id: "requests", label: "Delivery Requests", icon: Package },
    { id: "history", label: "Delivery History", icon: History },
    { id: "earnings", label: "View Earnings", icon: Wallet },
    { id: "profile", label: "Driver Profile", icon: User },
  ];

  const applyDashboardData = (payload = {}) => {
    setAvailableRequests(
      Array.isArray(payload.available_requests)
        ? payload.available_requests
        : [],
    );
    setActiveOrder(payload.active_order || null);
    setRecentHistory(Array.isArray(payload.history) ? payload.history : []);
    setSummary(payload.summary || emptySummary);
  };

  const loadDriverDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDriverOrders();
      applyDashboardData(response.data?.data || {});
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load driver data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getDriverOrders()
      .then((response) => {
        if (!isMounted) return;
        applyDashboardData(response.data?.data || {});
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load driver data.",
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    getRiderProfile()
      .then((response) => {
        if (!isMounted) return;
        setIsOnline(Boolean(response.data?.data?.is_online));
      })
      .catch(() => {
        // Rider profile may not exist yet - leave the toggle at its default.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (location.pathname.endsWith("/profile")) setActiveTab("profile");
  }, [location.pathname]);

  // Revoke the object URL when it's replaced or the component unmounts,
  // so we don't leak memory across repeated photo picks.
  useEffect(() => {
    return () => {
      if (profileImagePreview) URL.revokeObjectURL(profileImagePreview);
    };
  }, [profileImagePreview]);

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files?.[0] || null;
    setProfileFile(file);
    setProfileImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const profileImage = profileFile
        ? await uploadImageToCloudinary(profileFile, "profiles")
        : profile.profile_image;
      const response = await API.put("/profile", {
        ...profile,
        profile_image: profileImage || null,
      });
      const saved = response.data?.data || response.data || profile;
      const updated = {
        ...profile,
        ...saved,
        profile_image: saved.profile_image || profileImage || "",
      };
      setProfile(updated);
      setProfileFile(null);
      setProfileImagePreview("");
      // Keep the cached session user in sync without ever touching the role
      // Laravel assigned to this account.
      persistUser({
        ...getStoredUser(),
        ...user,
        ...updated,
        role: user?.role,
        role_key: user?.role_key,
      });
      window.dispatchEvent(
        new CustomEvent("driver-profile-updated", { detail: updated }),
      );
    } catch (saveError) {
      setError(
        saveError.response?.data?.message || "Could not save your profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (!isOnline || !navigator.geolocation) return undefined;

    const pushLocation = () => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setRiderPosition([coords.latitude, coords.longitude]);
          updateRiderLocation(coords.latitude, coords.longitude).catch(() => {
            // A single failed ping isn't worth interrupting the driver - the
            // next interval tick will retry.
          });
        },
        (err) => {
          setLocationError(
            err.code === err.PERMISSION_DENIED
              ? "Location access is disabled. Enable it to receive nearby delivery requests."
              : "Unable to detect your location.",
          );
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
      );
    };

    pushLocation();
    const intervalId = setInterval(pushLocation, 20000);

    return () => clearInterval(intervalId);
  }, [isOnline]);

  const toggleOnline = async () => {
    const nextValue = !isOnline;

    if (nextValue && !navigator.geolocation) {
      setLocationError("Location is not available in this browser.");
    }

    try {
      await updateRiderOnlineStatus(nextValue);
      setIsOnline(nextValue);
      if (!nextValue) setLocationError(null);
    } catch (err) {
      alert(
        `Error: ${err.response?.data?.message || err.message || "Unable to update online status."}`,
      );
    }
  };

  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return availableRequests;

    return availableRequests.filter((request) => {
      return [
        request.id,
        request.restaurant,
        request.customer,
        request.phone,
        request.dropoff,
        request.items,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [availableRequests, searchTerm]);

  const updateOrderStatus = async (order, status) => {
    try {
      setUpdatingId(order.real_id);
      await updateDriverOrderStatus(order.real_id, status);
      await loadDriverDashboard();

      if (status === "completed") {
        alert("Delivery completed successfully.");
      }
    } catch (err) {
      alert(
        `Error: ${err.response?.data?.message || err.message || "Unable to update delivery status."}`,
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Revokes the token in Laravel and clears the cached user/role before
  // returning to the customer portal's login page.
  const handleLogout = () => {
    logout();
  };

  const activeStatus = String(activeOrder?.delivery_status || "").toLowerCase();

  // What the rider is expected to do next, derived from the delivery's own
  // status rather than the order's - the order stays READY_FOR_PICKUP until
  // the food is actually collected.
  const activeStageLabel = {
    assigned: "Assigned - Head to the Restaurant",
    picked_up: "Picked Up - Start Your Route",
    delivering: "Delivering - Complete on Arrival",
  }[activeStatus] || "Active";

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden relative">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={navItems}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full bg-slate-100">
        <Header
          setIsSidebarOpen={setIsSidebarOpen}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          user={user}
        />

        <main className="p-4 sm:p-8 space-y-6 w-full max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-b border-slate-300 pb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Driver Workspace
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 uppercase">
                {activeTab === "requests"
                  ? "Ready for Pickup"
                  : `${activeTab} Overview`}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadDriverDashboard}
                disabled={loading}
                className="h-10 px-5 flex items-center gap-2 rounded-none border border-slate-300 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 hover:text-blue-900 transition-colors disabled:opacity-60"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <div className="flex items-center gap-3 rounded-none border border-slate-300 bg-white px-4 py-2 shadow-sm">
                <span
                  className={`text-[11px] font-bold tracking-widest uppercase ${isOnline ? "text-emerald-700" : "text-slate-500"}`}
                >
                  {isOnline ? "Available" : "Offline"}
                </span>
                <button
                  onClick={toggleOnline}
                  className={`w-12 h-6 flex items-center rounded-none p-0.5 border border-slate-300 transition-colors ${
                    isOnline
                      ? "bg-emerald-500 justify-end border-emerald-600"
                      : "bg-slate-200 justify-start"
                  }`}
                  aria-label="Toggle driver availability"
                >
                  <span className="w-5 h-5 bg-white rounded-none shadow-sm border border-slate-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Location Error */}
          {locationError && (
            <div className="flex items-center justify-between gap-3 rounded-none border border-rose-300 bg-rose-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-rose-800 shadow-sm">
              <span className="flex items-center gap-2">
                <AlertCircle size={16} /> {locationError}
              </span>
              <button
                onClick={() => setLocationError(null)}
                className="text-rose-600 hover:text-rose-900 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                label: "Today Deliveries",
                value: summary.today_deliveries,
                icon: Package,
                tone: "bg-slate-50 text-slate-700 border-slate-200",
              },
              {
                label: "Today's Earnings",
                value: summary.today_earnings,
                icon: Wallet,
                tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
              },
              {
                label: "This Week",
                value: summary.week_earnings,
                icon: Navigation,
                tone: "bg-blue-50 text-blue-700 border-blue-200",
              },
              {
                label: "This Month",
                value: summary.month_earnings,
                icon: CheckCircle,
                tone: "bg-slate-800 text-white border-slate-900",
              },
            ].map((stat) => {
              const StatIcon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-none border border-slate-300 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {stat.label}
                    </p>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-none border ${stat.tone}`}
                    >
                      <StatIcon size={14} />
                    </span>
                  </div>
                  <p className="mt-3 text-xl sm:text-2xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Main Content Area */}
          {loading ? (
            <div className="bg-white p-12 rounded-none border border-slate-300 text-center text-xs font-bold uppercase tracking-widest text-slate-500 shadow-sm flex items-center justify-center gap-3">
              <Loader2 size={18} className="animate-spin text-blue-900" />
              Loading Driver Data...
            </div>
          ) : error ? (
            <div className="bg-white p-10 rounded-none border border-rose-300 text-center text-xs font-bold uppercase tracking-widest text-rose-800 shadow-sm">
              <AlertCircle size={24} className="mx-auto mb-3 text-rose-700" />
              {error}
            </div>
          ) : (
            <>
              {/* Active Order Banner */}
              {activeOrder && (
                <div className="bg-white rounded-none border-2 border-blue-900 shadow-sm p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1.5 bg-blue-900 text-white rounded-none text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <Package size={12} /> Active Dispatch
                      </span>
                      <span className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-none text-[10px] font-bold uppercase tracking-widest">
                        {activeStageLabel}
                      </span>
                      <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        ID: {activeOrder.id}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-slate-900">
                      {activeOrder.price}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-5 rounded-none">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Pickup Location
                      </p>
                      <h4 className="text-sm font-bold text-slate-900 uppercase">
                        {activeOrder.restaurant}
                      </h4>
                      <p className="text-xs font-medium text-slate-600 mt-1">
                        {activeOrder.pickup}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Drop-off Customer
                      </p>
                      <h4 className="text-sm font-bold text-slate-900 uppercase">
                        {activeOrder.customer} <span className="text-xs text-slate-500">({activeOrder.phone})</span>
                      </h4>
                      <p className="text-xs font-medium text-slate-600 mt-1">
                        {activeOrder.dropoff}
                      </p>
                    </div>
                  </div>

                  <DeliveryRouteMap
                    riderPosition={riderPosition}
                    destination={
                      activeStatus === "assigned"
                        ? (Number.isFinite(activeOrder.restaurant_lat) && Number.isFinite(activeOrder.restaurant_lng)
                            ? [activeOrder.restaurant_lat, activeOrder.restaurant_lng]
                            : null)
                        : (Number.isFinite(activeOrder.dropoff_lat) && Number.isFinite(activeOrder.dropoff_lng)
                            ? [activeOrder.dropoff_lat, activeOrder.dropoff_lng]
                            : null)
                    }
                    destinationLabel={activeStatus === "assigned" ? activeOrder.restaurant : activeOrder.customer}
                    isPickupPhase={activeStatus === "assigned"}
                  />

                  <div>
                    {activeStatus === "assigned" && (
                      <button
                        onClick={() =>
                          updateOrderStatus(activeOrder, "picked_up")
                        }
                        disabled={updatingId === activeOrder.real_id}
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 border border-amber-600 text-white font-bold rounded-none text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        <Utensils size={14} /> Step 1: Confirm Pickup
                      </button>
                    )}
                    {activeStatus === "picked_up" && (
                      <button
                        onClick={() =>
                          updateOrderStatus(activeOrder, "delivering")
                        }
                        disabled={updatingId === activeOrder.real_id}
                        className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 border border-blue-900 text-white font-bold rounded-none text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        <Navigation size={14} /> Step 2: Start Delivery Route
                      </button>
                    )}
                    {activeStatus === "delivering" && (
                      <button
                        onClick={() =>
                          updateOrderStatus(activeOrder, "completed")
                        }
                        disabled={updatingId === activeOrder.real_id}
                        className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 border border-emerald-900 text-white font-bold rounded-none text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle size={14} /> Step 3: Complete Delivery
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Requests Tab */}
              {activeTab === "requests" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-3">
                      Ready for Pickup Orders
                    </h3>

                    {!isOnline ? (
                      <div className="bg-white p-12 rounded-none border border-slate-300 text-center text-xs font-bold uppercase tracking-widest text-slate-500 shadow-sm">
                        Set status to <span className="text-emerald-700">AVAILABLE</span> to receive orders.
                      </div>
                    ) : filteredRequests.length === 0 ? (
                      <div className="bg-white p-12 rounded-none border border-slate-300 text-center text-xs font-bold uppercase tracking-widest text-slate-500 shadow-sm">
                        No orders are ready for pickup right now.
                      </div>
                    ) : (
                      filteredRequests.map((request) => (
                        <div
                          key={request.real_id}
                          className="bg-white rounded-none border border-slate-300 shadow-sm p-6 space-y-5 hover:border-blue-900 transition-colors"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-none text-[10px] font-bold uppercase tracking-widest">
                              {request.status === "Ready" ? "Ready for Pickup" : request.status}
                            </span>
                            <span className="text-lg font-bold text-slate-900">
                              {request.price}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="space-y-4 relative pl-5 border-l-2 border-slate-300 ml-1">
                              <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                  Pickup
                                </p>
                                <h4 className="text-sm font-bold text-slate-900 uppercase">
                                  {request.restaurant}
                                </h4>
                                <p className="text-xs font-medium text-slate-600 mt-0.5">
                                  {request.pickup}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                  Drop-off
                                </p>
                                <h4 className="text-sm font-bold text-slate-900 uppercase">
                                  {request.dropoff}
                                </h4>
                                <p className="text-xs font-medium text-slate-600 mt-0.5">
                                  {request.customer} ({request.phone})
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                updateOrderStatus(request, "accepted")
                              }
                              disabled={
                                activeOrder !== null ||
                                updatingId === request.real_id
                              }
                              className={`w-full sm:w-auto px-8 py-3 font-bold rounded-none text-[11px] uppercase tracking-wider transition-colors shadow-sm border ${
                                activeOrder !== null ||
                                updatingId === request.real_id
                                  ? "bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed"
                                  : "bg-blue-900 hover:bg-blue-950 text-white border-blue-950"
                              }`}
                            >
                              {updatingId === request.real_id
                                ? "Updating..."
                                : "Accept Request"}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Sidebar stats for requests tab */}
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-none border border-slate-300 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100 pb-3">
                        <Wallet size={14} className="text-slate-400" />
                        <span>Today's Performance</span>
                      </div>
                      <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
                        {summary.today_earnings}
                      </h2>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {summary.today_deliveries} Deliveries Completed
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === "history" && (
                <div className="bg-white p-8 rounded-none border border-slate-300 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-3">
                    Delivery Log
                  </h3>
                  {recentHistory.length === 0 ? (
                    <div className="py-12 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                      No completed deliveries found.
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {recentHistory.map((item) => (
                        <div
                          key={item.real_id}
                          className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 last:border-0"
                        >
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 uppercase">
                              ID: {item.id}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                              {item.restaurant} • {item.time}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-emerald-700">
                            {item.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Earnings Tab */}
              {activeTab === "earnings" && (
                <div className="bg-white p-8 rounded-none border border-slate-300 shadow-sm space-y-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-3">
                    Earnings Statement
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-none">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
                        Week to Date
                      </p>
                      <h4 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {summary.week_earnings}
                      </h4>
                    </div>
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-none">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
                        Month to Date
                      </p>
                      <h4 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {summary.month_earnings}
                      </h4>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <form
                  onSubmit={saveProfile}
                  className="bg-white p-8 rounded-none border border-slate-300 shadow-sm space-y-6 max-w-2xl"
                >
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-3">
                    Driver Identity
                  </h3>

                  <div className="flex items-center gap-5 border-b border-slate-100 pb-6">
                    <div className="relative w-20 h-20 shrink-0 group">
                      {profileImagePreview || profile.profile_image ? (
                        <img
                          src={profileImagePreview || profile.profile_image}
                          alt="Driver profile"
                          className="w-full h-full object-cover border border-slate-300 shadow-sm"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-900 text-white flex items-center justify-center font-bold text-2xl border border-blue-950 shadow-sm uppercase">
                          {(profile.name || "D").charAt(0)}
                        </div>
                      )}
                      <label
                        htmlFor="driver-profile-photo"
                        className="absolute inset-0 flex items-center justify-center bg-black/55 text-white text-[9px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        Change
                      </label>
                    </div>
                    <div>
                      <input
                        id="driver-profile-photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleProfilePhotoChange}
                        className="sr-only"
                      />
                      <label
                        htmlFor="driver-profile-photo"
                        className="inline-block cursor-pointer border border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 transition-colors"
                      >
                        Change Photo
                      </label>
                      {profileFile && (
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mt-1.5">
                          {profileFile.name} — pending save
                        </p>
                      )}
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Role: Delivery Driver</p>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-1 uppercase tracking-widest mt-1.5 inline-block border border-emerald-200">
                        System Connected
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Legal Name
                      </label>
                      <input
                        required
                        value={profile.name}
                        onChange={(event) =>
                          setProfile({ ...profile, name: event.target.value })
                        }
                        className="w-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium focus:border-blue-900 focus:outline-none transition-colors rounded-none shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Contact Number
                      </label>
                      <input
                        value={profile.phone}
                        onChange={(event) =>
                          setProfile({ ...profile, phone: event.target.value })
                        }
                        className="w-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium focus:border-blue-900 focus:outline-none transition-colors rounded-none shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      disabled={savingProfile}
                      className="bg-blue-900 hover:bg-blue-950 px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-white disabled:opacity-50 border border-blue-950 rounded-none shadow-sm transition-colors"
                    >
                      {savingProfile ? "Processing..." : "Update Identity"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}