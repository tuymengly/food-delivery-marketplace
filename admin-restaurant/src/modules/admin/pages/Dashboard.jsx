import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Check, X, Users, Store, ShoppingBag, DollarSign, AlertCircle, Star, Landmark } from 'lucide-react';
import { getDashboardStats, approveRestaurant, rejectRestaurant } from "../../../services/adminService";
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const parseStats = (response) => response.data?.data || response.data || {};

  const loadDashboardData = async () => {
    try {
      const response = await getDashboardStats();
      setStats(parseStats(response));
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setErrorMessage('Unable to retrieve dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getDashboardStats()
      .then((response) => {
        if (!isMounted) return;
        setStats(parseStats(response));
        setErrorMessage('');
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('Error fetching dashboard stats:', error);
        setErrorMessage('Unable to retrieve dashboard data.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleApprove = async (id) => {
    try {
      await approveRestaurant(id);
      loadDashboardData(); 
    } catch (error) {
      console.error('Error approving restaurant:', error);
      alert('There was an error approving the restaurant.');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectRestaurant(id);
      loadDashboardData();
    } catch (error) {
      console.error('Error rejecting restaurant:', error);
      alert('There was an error rejecting the restaurant.');
    }
  };

  if (loading) return <div className="dashboard-surface p-10 text-center text-slate-500">Loading platform data...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Admin Dashboard</h2>
        <p className="text-xs sm:text-sm text-slate-500">Platform overview</p>
      </div>

      {errorMessage && (
        <div className="flex items-center justify-between gap-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => { setLoading(true); loadDashboardData(); }} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px border border-slate-300 bg-slate-300">
        {/* Total Users */}
        <div className="bg-white p-4 sm:p-5 flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Total Users</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 my-1">{stats?.total_users || 0}</p>
          </div>
          <Users size={18} className="text-[#2563EB]" />
        </div>

        {/* Total Restaurants */}
        <div className="bg-white p-4 sm:p-5 flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Total Restaurants</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 my-1">{stats?.total_restaurants || 0}</p>
            <p className="text-xs text-green-600 font-medium">↑ {stats?.pending_restaurants?.length || 0} pending</p>
          </div>
          <Store size={18} className="text-[#2563EB]" />
        </div>

        {/* Total Orders */}
        <div className="bg-white p-4 sm:p-5 flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Completed Orders</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 my-1">{stats?.total_orders || 0}</p>
          </div>
          <ShoppingBag size={18} className="text-[#2563EB]" />
        </div>

        {/* Revenue */}
        <div className="bg-white p-4 sm:p-5 flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Gross Customer Payments</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 my-1">${stats?.total_revenue || 0}</p>
          </div>
          <DollarSign size={18} className="text-[#2563EB]" />
        </div>

        <div className="bg-white p-4 sm:p-5 flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Platform Profit</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 my-1">${Number(stats?.platform_profit || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-500">Admin wallet basis</p>
          </div>
          <Landmark size={18} className="text-[#2563EB]" />
        </div>

        {/* Pending Reviews */}
        <div className="bg-white p-4 sm:p-5 flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Pending Reviews</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 sm:mt-2">{stats?.pending_reviews || 0}</p>
          </div>
          <AlertCircle size={18} className="text-[#2563EB]" />
        </div>

        {/* Avg Rating */}
        <div className="bg-white p-4 sm:p-5 flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Avg. Rating</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 sm:mt-2">{stats?.avg_rating || 0} ★</p>
          </div>
          <Star size={18} className="text-[#2563EB]" />
        </div>
      </div>

      {/* Chart & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-4 sm:mb-6">Revenue & Orders</h3>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.chart_data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#ea580c" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-4 sm:p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-4">Pending Approvals</h3>
          <div className="space-y-3">
            {stats?.pending_restaurants?.length > 0 ? (
              stats.pending_restaurants.map((item) => {
                const ownerName = item.user?.name || item.owner_name || 'Owner';

                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-100 rounded-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 text-blue-900 flex items-center justify-center font-bold shrink-0">
                        {item.name?.charAt(0) || 'R'}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                        <p className="text-xs text-slate-500 truncate">{ownerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center cursor-pointer gap-1.5 shrink-0 ml-2">
                      <button onClick={() => handleApprove(item.id)} className="p-2 bg-green-700 text-black-900 rounded-full hover:bg-emerald-200">
                        <Check size={16} />
                      </button>
                      <button onClick={() => handleReject(item.id)} className="p-2 bg-rose-500 text-black-900 rounded-full hover:bg-rose-200">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No restaurants pending approval.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
