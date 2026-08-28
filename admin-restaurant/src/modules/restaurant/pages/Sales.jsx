import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download,
  Calendar
} from 'lucide-react';

export default function Sales() {
  const [timeRange, setTimeRange] = useState('This Month');

  const stats = [
    { title: 'Total Revenue', amount: '$4,250.80', change: '+14.5%', isPositive: true, icon: DollarSign },
    { title: 'Net Earnings', amount: '$3,612.00', change: '+12.2%', isPositive: true, icon: TrendingUp },
    { title: 'Total Orders', amount: '342', change: '+8.1%', isPositive: true, icon: ShoppingBag },
    { title: 'Avg. Order Value', amount: '$12.42', change: '-2.4%', isPositive: false, icon: CreditCard },
  ];

  const transactions = [
    { id: '#ORD-9823', date: '2026-08-26', customer: 'Sophea Kim', amount: '$24.50', payment: 'ABA PAY', status: 'Completed' },
    { id: '#ORD-9822', date: '2026-08-26', customer: 'John Doe', amount: '$18.00', payment: 'Cash', status: 'Completed' },
    { id: '#ORD-9821', date: '2026-08-25', customer: 'Dara Chan', amount: '$42.10', payment: 'ABA PAY', status: 'Completed' },
    { id: '#ORD-9820', date: '2026-08-25', customer: 'Bona Meng', amount: '$12.00', payment: 'Credit Card', status: 'Completed' },
    { id: '#ORD-9819', date: '2026-08-24', customer: 'Lida Suon', amount: '$35.00', payment: 'ABA PAY', status: 'Refunded' },
  ];

  return (
    <div className="p-6 bg-[#fcfbfa] min-h-screen space-y-6 text-gray-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales & Earnings</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Track your financial performance, payouts, and transaction history
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Filter */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm">
            <Calendar size={14} className="text-gray-400" />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          {/* Export Button */}
          <button className="flex items-center gap-1.5 px-4 py-2 bg-[#ea580c] hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-sm">
            <Download size={15} /> Export Report
          </button>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#fdf2ee] text-[#ea580c] flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <div className={`flex items-center text-xs font-bold ${stat.isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {stat.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400">{stat.title}</span>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stat.amount}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Breakdown Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Summary Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Payout Overview</h2>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Next Payout: Aug 31
            </span>
          </div>
          
          <div className="p-4 bg-[#fdf2ee] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 font-semibold">Available for Payout</p>
              <h4 className="text-3xl font-extrabold text-gray-900 mt-1">$1,280.50</h4>
            </div>
            <button className="w-full sm:w-auto px-5 py-2.5 bg-[#ea580c] hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition">
              Withdraw Funds
            </button>
          </div>

          {/* Simple Progress Bars */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-gray-700">Revenue Channels</p>
            
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-gray-600">Dine-in / Direct Orders</span>
                <span className="text-gray-900">$2,850.00 (67%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-[#ea580c] h-2 rounded-full" style={{ width: '67%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-gray-600">Online Delivery</span>
                <span className="text-gray-900">$1,400.80 (33%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-amber-400 h-2 rounded-full" style={{ width: '33%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900">Payment Methods</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-gray-100">
              <span className="text-gray-600">ABA PAY (QR)</span>
              <span className="font-bold text-gray-900">$2,940.00</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-gray-100">
              <span className="text-gray-600">Cash on Delivery</span>
              <span className="font-bold text-gray-900">$910.80</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-gray-100">
              <span className="text-gray-600">Credit / Debit Card</span>
              <span className="font-bold text-gray-900">$400.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-3">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf8f5] text-gray-400 text-xs font-semibold">
                <th className="py-3 px-5">Order ID</th>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5">Payment Method</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-5 font-bold text-gray-900">{tx.id}</td>
                  <td className="py-3.5 px-5 text-gray-500">{tx.date}</td>
                  <td className="py-3.5 px-5 font-semibold text-gray-800">{tx.customer}</td>
                  <td className="py-3.5 px-5 text-gray-600">{tx.payment}</td>
                  <td className="py-3.5 px-5 font-bold text-gray-900">{tx.amount}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      tx.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {tx.status}
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