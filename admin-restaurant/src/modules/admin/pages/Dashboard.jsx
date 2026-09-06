import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Check, X, Users, Store, ShoppingBag, DollarSign, AlertCircle, Star } from 'lucide-react';
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
      setErrorMessage('មិនអាចទាញយកទិន្នន័យ dashboard បានទេ');
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
        setErrorMessage('មិនអាចទាញយកទិន្នន័យ dashboard បានទេ');
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
      alert('មានបញ្ហាក្នុងការទទួលស្គាល់ហាងនេះ');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectRestaurant(id);
      loadDashboardData();
    } catch (error) {
      console.error('Error rejecting restaurant:', error);
      alert('មានបញ្ហាក្នុងការបដិសេធហាងនេះ');
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">កំពុងទាញយកទិន្នន័យ...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-xs sm:text-sm text-gray-500">Platform overview</p>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Users */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Total Users</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 my-1">{stats?.total_users || 0}</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl shrink-0"><Users size={20} /></div>
        </div>

        {/* Total Restaurants */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Restaurants</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 my-1">{stats?.total_restaurants || 0}</p>
            <p className="text-xs text-green-600 font-medium">↑ {stats?.pending_restaurants?.length || 0} pending</p>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-500 rounded-xl shrink-0"><Store size={20} /></div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Total Orders</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 my-1">{stats?.total_orders || 0}</p>
          </div>
          <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shrink-0"><ShoppingBag size={20} /></div>
        </div>

        {/* Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Revenue</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 my-1">${stats?.total_revenue || 0}</p>
          </div>
          <div className="p-2.5 bg-red-50 text-red-500 rounded-xl shrink-0"><DollarSign size={20} /></div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Pending Reviews</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">{stats?.pending_reviews || 0}</p>
          </div>
          <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shrink-0"><AlertCircle size={20} /></div>
        </div>

        {/* Avg Rating */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Avg. Rating</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">{stats?.avg_rating || 0} ★</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl shrink-0"><Star size={20} /></div>
        </div>
      </div>

      {/* Chart & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-4 sm:mb-6">Revenue & Orders</h3>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.chart_data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#e03a11" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-4">Pending Approvals</h3>
          <div className="space-y-3">
            {stats?.pending_restaurants?.length > 0 ? (
              stats.pending_restaurants.map((item) => {
                const ownerName = item.user?.name || item.owner_name || 'Owner';

                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-orange-100 text-[#e03a11] rounded-xl flex items-center justify-center font-bold shrink-0">
                        {item.name?.charAt(0) || 'R'}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-gray-800 text-sm truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 truncate">{ownerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button onClick={() => handleApprove(item.id)} className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200">
                        <Check size={16} />
                      </button>
                      <button onClick={() => handleReject(item.id)} className="p-2 bg-red-100 text-red-500 rounded-full hover:bg-red-200">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">គ្មានហាងរង់ចាំការអនុម័តទេ</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
