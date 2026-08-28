import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Check, X, Users, Store, ShoppingBag, DollarSign, AlertCircle, Star } from 'lucide-react';

const chartData = [
  { month: 'Mar', revenue: 42000 },
  { month: 'Apr', revenue: 58000 },
  { month: 'May', revenue: 72000 },
  { month: 'Jun', revenue: 68000 },
  { month: 'Jul', revenue: 85000 },
  { month: 'Aug', revenue: 91000 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-xs sm:text-sm text-gray-500">Platform overview • August 2026</p>
      </div>

      {/* Metrics Cards: Responsive Grid System */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Total Users</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 my-1">2,840</p>
            <p className="text-xs text-green-600 font-medium">↑ 8% this month</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl shrink-0">
            <Users size={20} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Restaurants</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 my-1">124</p>
            <p className="text-xs text-green-600 font-medium">↑ 3 pending</p>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-500 rounded-xl shrink-0">
            <Store size={20} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Total Orders</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 my-1">18,420</p>
            <p className="text-xs text-green-600 font-medium">↑ 820 today</p>
          </div>
          <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shrink-0">
            <ShoppingBag size={20} />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Revenue</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 my-1">$91K</p>
            <p className="text-xs text-green-600 font-medium">↑ 8% vs last month</p>
          </div>
          <div className="p-2.5 bg-red-50 text-red-500 rounded-xl shrink-0">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Pending Reviews</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">3</p>
          </div>
          <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shrink-0">
            <AlertCircle size={20} />
          </div>
        </div>

        {/* Card 6 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Avg. Rating</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">4.6 ★</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl shrink-0">
            <Star size={20} />
          </div>
        </div>
      </div>

      {/* Chart and Approvals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-4 sm:mb-6">Revenue & Orders (6 months)</h3>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#f3f4f6' }}
                />
                <Bar dataKey="revenue" fill="#e03a11" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-4">Pending Approvals</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-orange-100 text-[#e03a11] rounded-xl flex items-center justify-center font-bold shrink-0">
                  N
                </div>
                <div className="truncate">
                  <p className="font-bold text-gray-800 text-sm truncate">Noodle House</p>
                  <p className="text-xs text-gray-500 truncate">Lin Wei</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition" aria-label="Approve">
                  <Check size={16} />
                </button>
                <button className="p-2 bg-red-100 text-red-500 rounded-full hover:bg-red-200 transition" aria-label="Reject">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-orange-100 text-[#e03a11] rounded-xl flex items-center justify-center font-bold shrink-0">
                  T
                </div>
                <div className="truncate">
                  <p className="font-bold text-gray-800 text-sm truncate">Taco Fiesta</p>
                  <p className="text-xs text-gray-500 truncate">Carlos Reyes</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition" aria-label="Approve">
                  <Check size={16} />
                </button>
                <button className="p-2 bg-red-100 text-red-500 rounded-full hover:bg-red-200 transition" aria-label="Reject">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}