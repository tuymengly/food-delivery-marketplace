import { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Loader2, 
  RefreshCw,
  AlertCircle 
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
import { getRestaurantDashboardStats } from '../../../services/restaurantService';

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
      setError(data.message || 'មិនអាចទាញយកទិន្នន័យបានឡើយ!');
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
      setError(err.response?.data?.message || 'មិនអាចភ្ជាប់ទៅកាន់ Server បានឡើយ! សូមពិនិត្យមើល Backend');
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

  // Helper សម្រាប់ Style នៃ Status Badge
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'new':
      case 'pending':
        return 'bg-blue-100 text-blue-700 font-semibold border border-blue-200';
      case 'preparing':
      case 'processing':
        return 'bg-amber-100 text-amber-800 font-semibold border border-amber-200';
      case 'ready':
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200';
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800 font-semibold border border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 font-semibold border border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 font-semibold border border-gray-200';
    }
  };

  // Loading Screen (បង្ហាញពេលទាញយកទិន្នន័យលើកដំបូង)
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfbfa]">
        <Loader2 className="w-9 h-9 text-orange-600 animate-spin" />
        <span className="mt-3 text-sm text-gray-600 font-medium">កំពុងទាញយកទិន្នន័យ Dashboard...</span>
      </div>
    );
  }

  // Error Screen
  if (error && recentOrders.length === 0 && stats.todayOrders === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfbfa] p-4">
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl max-w-md w-full text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-red-900">មានបញ្ហាក្នុងការភ្ជាប់</h3>
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => fetchDashboardData(true)}
            className="mt-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-semibold hover:bg-orange-700 transition inline-flex items-center gap-2"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            ព្យាយាមម្តងទៀត
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#fcfbfa] min-h-screen space-y-5 text-gray-800">
      
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-medium shadow-sm transition disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-orange-600' : ''} />
          <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Today's Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">Today's Revenue</span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              ${(stats.todayRevenue || 0).toFixed(2)}
            </h2>
            <div className={`flex items-center gap-1 text-[11px] font-semibold mt-1.5 sm:mt-2 ${
              stats.revenueGrowthAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              <TrendingUp size={13} />
              <span>
                {stats.revenueGrowthAmount >= 0 ? '+' : '-'}${Math.abs(stats.revenueGrowthAmount || 0).toFixed(2)} vs yesterday
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl sm:rounded-full bg-red-50 text-red-500 flex items-center justify-center font-semibold text-lg shrink-0">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">Today's Orders</span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              {stats.todayOrders}
            </h2>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1.5 sm:mt-2">
              <TrendingUp size={13} />
              <span>{stats.newOrdersThisHour} new this hour</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl sm:rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <ShoppingBag size={20} />
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">Pending Orders</span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              {stats.pendingOrders}
            </h2>
            <p className="text-[11px] font-medium text-gray-400 mt-1.5 sm:mt-2">Requires attention</p>
          </div>
          <div className="w-10 h-10 rounded-xl sm:rounded-full bg-orange-50 text-orange-400 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
        </div>

        {/* Completed Today */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">Completed Today</span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              {stats.completedToday}
            </h2>
            <p className="text-[11px] font-medium text-gray-400 mt-1.5 sm:mt-2">Successfully delivered</p>
          </div>
          <div className="w-10 h-10 rounded-xl sm:rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>

      </div>

      {/* Weekly Revenue Chart */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4">Revenue This Week</h3>
        <div className="h-52 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Area type="linear" dataKey="revenue" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders Table / Card Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Table Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Recent Orders</h3>
            <span className="text-xs text-gray-400 font-normal">({recentOrders.length})</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[11px] font-extrabold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Live Update
          </span>
        </div>

        {/* Mobile View (Card List) */}
        <div className="block sm:hidden divide-y divide-gray-100">
          {recentOrders.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400 font-medium">
              មិនទាន់មានការកម្ម៉ង់នៅឡើយទេ
            </div>
          ) : (
            recentOrders.map((order, idx) => (
              <div key={idx} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-xs">{order.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800">{order.customer}</span>
                  <span className="text-gray-400 text-[11px]">{order.time}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{order.items}</p>
                <div className="pt-1 flex justify-between items-center text-xs border-t border-gray-50">
                  <span className="text-gray-400">Total Price</span>
                  <span className="font-bold text-gray-900">{order.total}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View (Table List) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf8f5] text-gray-500 text-xs font-semibold border-b border-gray-100">
                <th className="py-3.5 px-5">Order ID</th>
                <th className="py-3.5 px-5">Customer</th>
                <th className="py-3.5 px-5">Items</th>
                <th className="py-3.5 px-5">Total</th>
                <th className="py-3.5 px-5">Time</th>
                <th className="py-3.5 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    មិនទាន់មានការកម្ម៉ង់នៅឡើយទេ
                  </td>
                </tr>
              ) : (
                recentOrders.map((order, idx) => (
                  <tr key={idx} className="hover:bg-orange-50/30 transition">
                    <td className="py-3.5 px-5 font-bold text-gray-900">{order.id}</td>
                    <td className="py-3.5 px-5 font-bold text-gray-800">{order.customer}</td>
                    <td className="py-3.5 px-5 text-gray-600 max-w-xs truncate" title={order.items}>
                      {order.items}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-gray-900">{order.total}</td>
                    <td className="py-3.5 px-5 text-gray-500">{order.time}</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] inline-block ${getStatusBadgeClass(order.status)}`}>
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
