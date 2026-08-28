import React from 'react';
import { DollarSign, ShoppingBag, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Dashboard() {
  // Chart Data
  const revenueData = [
    { day: 'Mon', revenue: 1200 },
    { day: 'Tue', revenue: 1800 },
    { day: 'Wed', revenue: 1500 },
    { day: 'Thu', revenue: 2200 },
    { day: 'Fri', revenue: 2600 },
    { day: 'Sat', revenue: 3200 },
    { day: 'Sun', revenue: 2800 },
  ];

  // Recent Orders Data
  const recentOrders = [
    { id: '#BR-8490', customer: 'Maria Chen', items: 'Double Smash Burger × 2, Truffle Fries × 1', total: '$37.97', time: '2 min ago', status: 'New', statusBg: 'bg-blue-100 text-blue-600' },
    { id: '#BR-8487', customer: 'James Okafor', items: 'Crispy Chicken Burger × 1, Milkshake × 2', total: '$27.97', time: '8 min ago', status: 'Preparing', statusBg: 'bg-amber-100 text-amber-700' },
    { id: '#BR-8484', customer: 'Sophie Laurent', items: 'Classic Smash Burger × 3', total: '$44.97', time: '15 min ago', status: 'Ready', statusBg: 'bg-emerald-100 text-emerald-700' },
    { id: '#BR-8480', customer: 'David Nguyen', items: 'Spicy Jalapeño × 1, Fries × 2', total: '$31.97', time: '22 min ago', status: 'Accepted', statusBg: 'bg-indigo-100 text-indigo-700' },
    { id: '#BR-8476', customer: 'Aisha Patel', items: 'Classic Smash × 2, Truffle Fries × 1', total: '$37.97', time: '35 min ago', status: 'Completed', statusBg: 'bg-green-100 text-green-700' },
  ];

  return (
    <div className="p-4 sm:p-6 bg-[#fcfbfa] min-h-screen space-y-4 sm:space-y-6 text-gray-800">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs text-gray-500 font-medium mt-1">Sunday, Aug 24, 2026</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">Today's Revenue</span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">$842</h2>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1.5 sm:mt-2">
              <TrendingUp size={13} />
              <span>12% from yesterday</span>
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">28</h2>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1.5 sm:mt-2">
              <TrendingUp size={13} />
              <span>4 new this hour</span>
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">6</h2>
          </div>
          <div className="w-10 h-10 rounded-xl sm:rounded-full bg-orange-50 text-orange-400 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
        </div>

        {/* Completed Today */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">Completed Today</span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">22</h2>
          </div>
          <div className="w-10 h-10 rounded-xl sm:rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Revenue Chart Section */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4">Revenue This Week</h3>
        <div className="h-48 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-gray-100">
          <h3 className="text-sm sm:text-base font-bold text-gray-900">Recent Orders</h3>
          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[11px] font-extrabold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Live
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="block sm:hidden divide-y divide-gray-100">
          {recentOrders.map((order, idx) => (
            <div key={idx} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-xs">{order.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${order.statusBg}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800">{order.customer}</span>
                <span className="text-gray-400 text-[11px]">{order.time}</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-1">{order.items}</p>
              <div className="pt-1 flex justify-between items-center text-xs">
                <span className="text-gray-400">Total</span>
                <span className="font-bold text-gray-900">{order.total}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tablet & Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf8f5] text-gray-500 text-xs font-semibold">
                <th className="py-3 px-5">Order</th>
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5">Items</th>
                <th className="py-3 px-5">Total</th>
                <th className="py-3 px-5">Time</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium">
              {recentOrders.map((order, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-5 font-bold text-gray-900">{order.id}</td>
                  <td className="py-3.5 px-5 font-bold text-gray-800">{order.customer}</td>
                  <td className="py-3.5 px-5 text-gray-500">{order.items}</td>
                  <td className="py-3.5 px-5 font-bold text-gray-900">{order.total}</td>
                  <td className="py-3.5 px-5 text-gray-500">{order.time}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${order.statusBg}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}