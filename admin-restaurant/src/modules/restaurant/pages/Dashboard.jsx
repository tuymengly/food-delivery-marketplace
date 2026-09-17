import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  Loader2,
  RefreshCw,
  AlertCircle,
  Bike,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { getRestaurantDashboardStats, getNearbyRiders } from '../../../services/restaurantService';
import API from '../../../services/api';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    todayRevenue: 0,
    revenueGrowth: 0,
    revenueGrowthAmount: 0,
    todayOrders: 0,
    newOrdersThisHour: 0,
    pendingOrders: 0,
    completedToday: 0,
  });
  const [revenueData, setRevenueData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [nearbyRiders, setNearbyRiders] = useState([]);
  const [nearbyRidersMessage, setNearbyRidersMessage] = useState(null);

  const applyDashboardData = (data) => {
    if (data.success) {
      setStats(data.stats || {
        todayRevenue: 0,
        revenueGrowth: 0,
        revenueGrowthAmount: 0,
        todayOrders: 0,
        newOrdersThisHour: 0,
        pendingOrders: 0,
        completedToday: 0,
      });
      setRevenueData(data.revenueData || []);
      setRecentOrders(data.recentOrders || []);
    } else {
      setError(data.message || 'Unable to load dashboard data.');
    }
  };

  // Fetch Dashboard Data Function
  const fetchDashboardData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      setError(null);

      // Let the API resolve the restaurant from the authenticated owner.
      // This avoids using a stale restaurant_id left in localStorage.
      const response = await getRestaurantDashboardStats();
      applyDashboardData(response.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Unable to connect to the server. Please check the backend.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Auto Refresh ជារៀងរាល់ 5 វិនាទី ដើម្បីទទួលបាន Live Order
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  // Riders currently online and near this restaurant. Refreshed on a
  // slower interval than order polling since rider positions move less
  // frequently than order status.
  useEffect(() => {
    let isMounted = true;

    const fetchNearbyRiders = async () => {
      try {
        const profileResponse = await API.get('/restaurant/profile');
        const restaurantId = profileResponse.data?.data?.id;
        if (!restaurantId) return;

        const response = await getNearbyRiders(restaurantId);
        if (!isMounted) return;
        setNearbyRiders(response.data?.data || []);
        setNearbyRidersMessage(response.data?.success ? null : response.data?.message);
      } catch {
        if (!isMounted) return;
        setNearbyRiders([]);
      }
    };

    fetchNearbyRiders();
    const interval = setInterval(fetchNearbyRiders, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Helper for Status Badge style — now returns a square, left-accented
  // tag class set instead of a rounded-full pill.
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'new':
      case 'pending':
        return 'bg-[#EEF2F8] text-[#0B1F3B] font-semibold border-l-2 border-[#0B1F3B]';
      case 'preparing':
      case 'processing':
        return 'bg-amber-50 text-amber-800 font-semibold border-l-2 border-amber-500';
      case 'ready':
      case 'accepted':
        return 'bg-emerald-50 text-emerald-800 font-semibold border-l-2 border-emerald-600';
      case 'completed':
      case 'delivered':
        return 'bg-emerald-50 text-emerald-800 font-semibold border-l-2 border-emerald-700';
      case 'cancelled':
        return 'bg-[#FBEEEC] text-[#A6321E] font-semibold border-l-2 border-[#A6321E]';
      default:
        return 'bg-slate-100 text-slate-700 font-semibold border-l-2 border-slate-400';
    }
  };

  // Loading Screen (បង្ហាញពេលទាញយកទិន្នន័យលើកដំបូង)
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F5F7]">
        <Loader2 className="w-9 h-9 text-[#0B1F3B] animate-spin" />
        <span className="mt-3 text-sm text-slate-600 font-medium">Loading dashboard data...</span>
      </div>
    );
  }

  // Error Screen
  if (error && recentOrders.length === 0 && stats.todayOrders === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F5F7] p-4">
        <div className="bg-[#FBEEEC] border border-[#F0D5CF] p-6 max-w-md w-full text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-[#A6321E] mx-auto" />
          <h3 className="text-base font-bold text-[#A6321E]">Connection problem</h3>
          <p className="text-xs text-[#A6321E] font-medium">{error}</p>
          <button 
            onClick={() => fetchDashboardData(true)}
            className="mt-2 px-5 py-2.5 bg-[#0B1F3B] hover:bg-[#132C52] text-white text-xs font-semibold transition inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            Try again!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#F4F5F7] min-h-screen space-y-5 text-[#1A2233]">
      
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B1F3B]">Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D6DBE3] text-[#1A2233] hover:bg-[#EEF2F8] text-xs font-medium transition disabled:opacity-50 cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#0B1F3B]' : ''} />
          <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Today's Revenue */}
        <div className="bg-white p-4 sm:p-5 border border-[#D6DBE3] flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Today's Revenue</span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A2233] mt-1">
              ${(stats.todayRevenue || 0).toFixed(2)}
            </h2>
            <div className={`flex items-center gap-1 text-[11px] font-semibold mt-1.5 sm:mt-2 ${
              stats.revenueGrowthAmount >= 0 ? 'text-emerald-600' : 'text-[#A6321E]'
            }`}>
              <TrendingUp size={13} />
              <span>
                {stats.revenueGrowthAmount >= 0 ? '+' : '-'}${Math.abs(stats.revenueGrowthAmount || 0).toFixed(2)} vs yesterday
              </span>
            </div>
          </div>
          <div className="w-10 h-10 bg-[#EEF2F8] text-[#0B1F3B] flex items-center justify-center shrink-0">
            <DollarSign size={19} />
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white p-4 sm:p-5 border border-[#D6DBE3] flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Today's Orders</span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A2233] mt-1">
              {stats.todayOrders}
            </h2>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1.5 sm:mt-2">
              <TrendingUp size={13} />
              <span>{stats.newOrdersThisHour} new this hour</span>
            </div>
          </div>
          <div className="w-10 h-10 bg-[#EEF2F8] text-[#0B1F3B] flex items-center justify-center shrink-0">
            <ShoppingBag size={19} />
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-4 sm:p-5 border border-[#D6DBE3] flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Pending Orders</span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A2233] mt-1">
              {stats.pendingOrders}
            </h2>
            <p className="text-[11px] font-medium text-slate-400 mt-1.5 sm:mt-2">Requires attention</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={19} />
          </div>
        </div>

        {/* Completed Today */}
        <div className="bg-white p-4 sm:p-5 border border-[#D6DBE3] flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Completed Today</span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A2233] mt-1">
              {stats.completedToday}
            </h2>
            <p className="text-[11px] font-medium text-slate-400 mt-1.5 sm:mt-2">Successfully delivered</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={19} />
          </div>
        </div>

      </div>

      {/* Nearby Riders */}
      <div className="bg-white p-4 sm:p-6 border border-[#D6DBE3]">
        <h3 className="text-sm sm:text-base font-bold text-[#0B1F3B] mb-4">Riders Near This Restaurant</h3>
        {nearbyRidersMessage ? (
          <p className="text-xs text-slate-400 font-medium">{nearbyRidersMessage}</p>
        ) : nearbyRiders.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium">No riders online nearby right now.</p>
        ) : (
          <div className="divide-y divide-[#EBEDF1]">
            {nearbyRiders.map((rider) => (
              <div key={rider.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#EEF2F8] text-[#0B1F3B] flex items-center justify-center shrink-0">
                    <Bike size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1A2233]">{rider.name || 'Rider'}</p>
                    <p className="text-[11px] text-slate-400">{rider.vehicle_type} · {rider.vehicle_number}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#1A2233]">{rider.distance_km} km</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Revenue Chart */}
      <div className="bg-white p-4 sm:p-6 border border-[#D6DBE3]">
        <h3 className="text-sm sm:text-base font-bold text-[#0B1F3B] mb-4">Revenue This Week</h3>
        <div className="h-52 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B1F3B" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#0B1F3B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEDF1" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Area type="linear" dataKey="revenue" stroke="#0B1F3B" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders Table / Card Section */}
      <div className="bg-white border border-[#D6DBE3] overflow-hidden">
        
        {/* Table Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#D6DBE3]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[#0B1F3B]">Recent Orders</h3>
            <span className="text-xs text-slate-400 font-normal">({recentOrders.length})</span>
          </div>
          <span className="px-2.5 py-1 bg-[#FBEEEC] text-[#A6321E] text-[11px] font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#A6321E] animate-pulse"></span> Live Update
          </span>
        </div>

        {/* Mobile View (Card List) */}
        <div className="block sm:hidden divide-y divide-[#EBEDF1]">
          {recentOrders.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-medium">
              No orders yet
            </div>
          ) : (
            recentOrders.map((order, idx) => (
              <div key={idx} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1A2233] text-xs">{order.id}</span>
                  <span className={`px-2 py-0.5 text-[10px] ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1A2233]">{order.customer}</span>
                  <span className="text-slate-400 text-[11px]">{order.time}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{order.items}</p>
                <div className="pt-1 flex justify-between items-center text-xs border-t border-[#EBEDF1]">
                  <span className="text-slate-400">Total Price</span>
                  <span className="font-bold text-[#1A2233]">{order.total}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View (Table List) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1F3B] text-[11px] font-semibold text-white/90">
                <th className="py-3 px-5">Order ID</th>
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5">Items</th>
                <th className="py-3 px-5">Total</th>
                <th className="py-3 px-5">Time</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEDF1] text-xs font-medium">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F9FC] transition">
                    <td className="py-3.5 px-5 font-bold text-[#1A2233]">{order.id}</td>
                    <td className="py-3.5 px-5 font-bold text-[#1A2233]">{order.customer}</td>
                    <td className="py-3.5 px-5 text-slate-600 max-w-xs truncate" title={order.items}>
                      {order.items}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-[#1A2233]">{order.total}</td>
                    <td className="py-3.5 px-5 text-slate-500">{order.time}</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-1 text-[11px] inline-block ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}