import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import {
  getDriverOrders,
  updateDriverOrderStatus,
  getRiderProfile,
  updateRiderLocation,
  updateRiderOnlineStatus,
} from '../../../services/driverService';
import Sidebar from '../components/DriverSidebar';
import Header from '../components/Header';

const emptySummary = {
  today_deliveries: 0,
  today_earnings: '$0.00',
  week_earnings: '$0.00',
  month_earnings: '$0.00',
};

const readCurrentUser = () => {
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) return JSON.parse(rawUser);
  } catch {
    // Keep dashboard usable even if localStorage contains invalid JSON.
  }

  return {
    name: localStorage.getItem('name') || 'Driver',
    role: 'Driver',
  };
};

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [activeTab, setActiveTab] = useState('requests');
  const [activeOrder, setActiveOrder] = useState(null);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [user] = useState(readCurrentUser);

  const navItems = [
    { id: 'requests', label: 'Delivery Requests', icon: Package },
    { id: 'history', label: 'Delivery History', icon: History },
    { id: 'earnings', label: 'View Earnings', icon: Wallet },
    { id: 'profile', label: 'Driver Profile', icon: User },
  ];

  const applyDashboardData = (payload = {}) => {
    setAvailableRequests(Array.isArray(payload.available_requests) ? payload.available_requests : []);
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
      setError(err.response?.data?.message || err.message || 'Unable to load driver data.');
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
        setError(err.response?.data?.message || err.message || 'Unable to load driver data.');
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
    if (!isOnline || !navigator.geolocation) return undefined;

    const pushLocation = () => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          updateRiderLocation(coords.latitude, coords.longitude).catch(() => {
            // A single failed ping isn't worth interrupting the driver - the
            // next interval tick will retry.
          });
        },
        (err) => {
          setLocationError(
            err.code === err.PERMISSION_DENIED
              ? 'Location access is disabled. Enable it to receive nearby delivery requests.'
              : 'Unable to detect your location.'
          );
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    };

    pushLocation();
    const intervalId = setInterval(pushLocation, 20000);

    return () => clearInterval(intervalId);
  }, [isOnline]);

  const toggleOnline = async () => {
    const nextValue = !isOnline;

    if (nextValue && !navigator.geolocation) {
      setLocationError('Location is not available in this browser.');
    }

    try {
      await updateRiderOnlineStatus(nextValue);
      setIsOnline(nextValue);
      if (!nextValue) setLocationError(null);
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message || 'Unable to update online status.'}`);
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

      if (status === 'completed') {
        alert('ការដឹកជញ្ជូនត្រូវបានបញ្ចប់ដោយជោគជ័យ!');
      }
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message || 'Unable to update delivery status.'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const activeStatus = String(activeOrder?.status || '').toLowerCase();

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-hidden relative">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={navItems}
      />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full bg-[#f8fafc]">
        <Header
          setIsSidebarOpen={setIsSidebarOpen}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          user={{ name: user?.name || 'Driver', role: 'Driver' }}
        />

        <main className="p-4 sm:p-8 space-y-6 w-full max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Driver workspace</p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{activeTab === 'requests' ? 'Ready for your next delivery?' : `${activeTab} overview`}</h2>
              <p className="mt-2 text-sm text-slate-500">Stay on top of deliveries and keep customers moving.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadDriverDashboard}
                disabled={loading}
                className="h-10 px-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-sm hover:border-orange-200 hover:text-orange-600 disabled:opacity-60"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>

              <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2">
                <span className={`text-[11px] font-bold tracking-wider ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {isOnline ? 'AVAILABLE' : 'OFFLINE'}
                </span>
                <button
                  onClick={toggleOnline}
                  className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors ${
                    isOnline ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                  aria-label="Toggle driver availability"
                >
                  <span className="w-5 h-5 bg-white rounded-full shadow-md" />
                </button>
              </div>
            </div>
          </div>

          {locationError && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
              <span className="flex items-center gap-2"><AlertCircle size={15} /> {locationError}</span>
              <button onClick={() => setLocationError(null)} className="text-amber-500 hover:text-amber-700">Dismiss</button>
            </div>
          )}

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Today deliveries', value: summary.today_deliveries, icon: Package, tone: 'orange' },
              { label: "Today's earnings", value: summary.today_earnings, icon: Wallet, tone: 'emerald' },
              { label: 'This week', value: summary.week_earnings, icon: Navigation, tone: 'blue' },
              { label: 'This month', value: summary.month_earnings, icon: CheckCircle, tone: 'rose' },
            ].map((stat) => {
              const StatIcon = stat.icon;
              const tone = {
                orange: 'bg-orange-50 text-orange-600',
                emerald: 'bg-emerald-50 text-emerald-600',
                blue: 'bg-blue-50 text-blue-600',
                rose: 'bg-rose-50 text-rose-600',
              }[stat.tone];
              return (
                <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}><StatIcon size={17} /></span>
                  </div>
                  <p className="mt-4 text-xl sm:text-2xl font-black text-slate-900">{stat.value}</p>
                </div>
              );
            })}
          </div>

          {loading ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center text-slate-500 font-medium shadow-sm flex items-center justify-center gap-2">
              <Loader2 size={20} className="animate-spin text-orange-600" />
              Loading driver data...
            </div>
          ) : error ? (
            <div className="bg-rose-50 p-8 rounded-2xl border border-rose-100 text-center text-rose-700 font-medium shadow-sm">
              <AlertCircle size={28} className="mx-auto mb-2" />
              {error}
            </div>
          ) : (
            <>
              {activeOrder && (
                <div className="bg-white rounded-3xl border border-orange-200 shadow-[0_12px_35px_rgba(234,88,12,0.10)] p-5 sm:p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <Package size={14} /> Active Delivery - {activeOrder.id}
                    </span>
                    <span className="text-xl font-bold text-slate-900">{activeOrder.price}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-slate-50 to-orange-50/40 p-4 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pickup Location</p>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">{activeOrder.restaurant}</h4>
                      <p className="text-xs text-slate-500">{activeOrder.pickup}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drop-off Customer</p>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                        {activeOrder.customer} ({activeOrder.phone})
                      </h4>
                      <p className="text-xs text-slate-500">{activeOrder.dropoff}</p>
                    </div>
                  </div>

                  <div>
                    {activeStatus === 'accepted' && (
                      <button
                        onClick={() => updateOrderStatus(activeOrder, 'picked_up')}
                        disabled={updatingId === activeOrder.real_id}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                      >
                        <Utensils size={16} /> Step 1: Pickup Food
                      </button>
                    )}
                    {activeStatus === 'picked_up' && (
                      <button
                        onClick={() => updateOrderStatus(activeOrder, 'delivering')}
                        disabled={updatingId === activeOrder.real_id}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                      >
                        <Navigation size={16} /> Step 2: Start Delivery
                      </button>
                    )}
                    {(activeStatus === 'delivering' || activeStatus === 'out_for_delivery') && (
                      <button
                        onClick={() => updateOrderStatus(activeOrder, 'completed')}
                        disabled={updatingId === activeOrder.real_id}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                      >
                        <CheckCircle size={16} /> Step 3: Complete Delivery
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'requests' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Available Delivery Requests</h3>

                    {!isOnline ? (
                      <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 font-medium shadow-sm">
                        សូមប្តូរ Driver Status ទៅជា <span className="text-emerald-600 font-bold">AVAILABLE</span> ដើម្បីទទួលអូឌើ។
                      </div>
                    ) : filteredRequests.length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 font-medium shadow-sm">
                        No delivery requests from API right now.
                      </div>
                    ) : (
                      filteredRequests.map((request) => (
                        <div key={request.real_id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 hover:shadow-md transition">
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-[11px] font-bold">
                              {request.status}
                            </span>
                            <span className="text-xl font-bold text-slate-900">{request.price}</span>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-3 relative pl-6 border-l-2 border-dashed border-slate-200 ml-2">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PICKUP</p>
                                <h4 className="text-xs font-bold text-slate-800">{request.restaurant}</h4>
                                <p className="text-xs text-slate-500">{request.pickup}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DROP-OFF</p>
                                <h4 className="text-xs font-bold text-slate-800">{request.dropoff}</h4>
                                <p className="text-xs text-slate-500">{request.customer} ({request.phone})</p>
                              </div>
                            </div>

                            <button
                              onClick={() => updateOrderStatus(request, 'accepted')}
                              disabled={activeOrder !== null || updatingId === request.real_id}
                              className={`w-full sm:w-auto px-6 py-2.5 text-white font-bold rounded-xl text-xs transition shadow-sm ${
                                activeOrder !== null || updatingId === request.real_id
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                  : 'bg-orange-600 hover:bg-[#c2410c]'
                              }`}
                            >
                              {updatingId === request.real_id ? 'Updating...' : 'Accept'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                        <Wallet size={16} className="text-orange-600" />
                        <span>Today's Earnings</span>
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">{summary.today_earnings}</h2>
                      <p className="text-xs text-slate-400">{summary.today_deliveries} deliveries completed today</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Delivery History</h3>
                  {recentHistory.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-400">No completed deliveries yet.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {recentHistory.map((item) => (
                        <div key={item.real_id} className="py-3.5 flex items-center justify-between gap-4">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{item.id}</h4>
                            <p className="text-[10px] text-slate-400">{item.restaurant} - {item.time}</p>
                          </div>
                          <span className="text-xs font-bold text-emerald-600">{item.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'earnings' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Earnings Summary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-orange-50/50 border border-orange-100 rounded-xl">
                      <p className="text-xs text-slate-500 font-bold">This Week</p>
                      <h4 className="text-2xl font-black text-orange-600">{summary.week_earnings}</h4>
                    </div>
                    <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                      <p className="text-xs text-slate-500 font-bold">This Month</p>
                      <h4 className="text-2xl font-black text-emerald-600">{summary.month_earnings}</h4>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Driver Profile Details</h3>
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xl border-2 border-orange-500">
                      {(user?.name || 'Driver').charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{user?.name || 'Driver'}</h4>
                      <p className="text-xs text-slate-500">Role: Driver</p>
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2.5 py-0.5 rounded-md mt-1 inline-block border border-emerald-100">
                        Connected to live orders API
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
