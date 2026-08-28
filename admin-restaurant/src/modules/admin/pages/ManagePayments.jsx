import React, { useState } from 'react';
import { 
  TrendingUp, 
  Landmark, 
  Clock, 
  CheckCircle2, 
  Download, 
  Send, 
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';

const initialTransactions = [
  {
    id: 'TXN-88291A',
    dateTime: 'Oct 24, 14:30',
    entity: 'Burger Joint',
    type: 'Order Payment',
    amount: 42.50,
    status: 'Completed',
    category: 'restaurant',
    avatar: null
  },
  {
    id: 'TXN-88291B',
    dateTime: 'Oct 24, 14:15',
    entity: 'Alex Johnson',
    type: 'Payout',
    amount: 150.00,
    status: 'Pending',
    category: 'driver',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
  },
  {
    id: 'TXN-88291C',
    dateTime: 'Oct 24, 13:45',
    entity: 'Sakura Sushi',
    type: 'Refund',
    amount: -85.00,
    status: 'Failed',
    category: 'restaurant',
    avatar: null
  },
  {
    id: 'TXN-88291D',
    dateTime: 'Oct 24, 13:10',
    entity: 'Morning Brew',
    type: 'Order Payment',
    amount: 12.99,
    status: 'Completed',
    category: 'restaurant',
    avatar: null
  }
];

export default function ManagePayments() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [activeTab, setActiveTab] = useState('ALL TRANSACTIONS');
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  const [payoutForm, setPayoutForm] = useState({
    entity: '',
    amount: '',
    category: 'restaurant'
  });

  // Filter based on Tab
  const filteredTransactions = transactions.filter((txn) => {
    if (activeTab === 'RESTAURANT PAYOUTS') return txn.category === 'restaurant';
    if (activeTab === 'DRIVER PAYOUTS') return txn.category === 'driver';
    return true;
  });

  // Handle Payout Submit
  const handlePayoutSubmit = (e) => {
    e.preventDefault();
    const newTxn = {
      id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      dateTime: 'Just Now',
      entity: payoutForm.entity,
      type: 'Payout',
      amount: parseFloat(payoutForm.amount) || 0,
      status: 'Pending',
      category: payoutForm.category,
      avatar: null
    };

    setTransactions([newTxn, ...transactions]);
    setIsPayoutModalOpen(false);
    setPayoutForm({ entity: '', amount: '', category: 'restaurant' });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#fffaf8] min-h-screen text-gray-800 space-y-6">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Payment Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Monitor platform revenue, payouts, and transaction history.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-xs sm:text-sm rounded-xl shadow-xs transition">
            <Download size={16} /> Export Report
          </button>

          <button 
            onClick={() => setIsPayoutModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-[#f96b44] hover:bg-[#e05630] text-white font-medium text-xs sm:text-sm rounded-xl shadow-xs transition"
          >
            <Send size={16} /> Payout to Partners
          </button>
        </div>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">TOTAL VOLUME</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">$2.4M</h3>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-2">
              <TrendingUp size={12} /> +12.5% this month
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-50 text-sky-400 flex items-center justify-center shrink-0">
            <TrendingUp size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Platform Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">PLATFORM REVENUE</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">$360K</h3>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-2">
              <TrendingUp size={12} /> +8.2% this month
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-400 flex items-center justify-center shrink-0">
            <Landmark size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="bg-[#fff1eb] p-4 sm:p-5 rounded-2xl border border-orange-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase">PENDING PAYOUTS</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">$45,200</h3>
            <p className="text-xs text-gray-500 font-medium mt-2">Requires manual review</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/80 text-orange-400 flex items-center justify-center shadow-xs shrink-0">
            <Clock size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Successful Payouts */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">SUCCESSFUL PAYOUTS</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">890</h3>
            <p className="text-xs text-gray-400 font-medium mt-2">Processed today</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* 3. Transactions Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        
        {/* Navigation Tabs (Horizontal Scrollable for Mobile) */}
        <div className="flex border-b border-gray-100 bg-gray-50/40 px-4 sm:px-6 pt-3 gap-6 sm:gap-8 overflow-x-auto scrollbar-none">
          {['ALL TRANSACTIONS', 'RESTAURANT PAYOUTS', 'DRIVER PAYOUTS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-bold tracking-wider transition relative whitespace-nowrap shrink-0 ${
                activeTab === tab 
                  ? 'text-[#f96b44] border-b-2 border-[#f96b44]' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 tracking-wider uppercase bg-gray-50/30">
                <th className="py-3.5 px-4 sm:px-6">TRANSACTION ID</th>
                <th className="py-3.5 px-4 sm:px-6">DATE/TIME</th>
                <th className="py-3.5 px-4 sm:px-6">ENTITY</th>
                <th className="py-3.5 px-4 sm:px-6">TYPE</th>
                <th className="py-3.5 px-4 sm:px-6">AMOUNT</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-orange-50/10 transition">
                  <td className="py-4 px-4 sm:px-6 font-semibold text-gray-800 whitespace-nowrap">{txn.id}</td>
                  <td className="py-4 px-4 sm:px-6 text-gray-400 text-xs font-medium whitespace-nowrap">{txn.dateTime}</td>
                  
                  {/* Entity */}
                  <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {txn.avatar ? (
                        <img src={txn.avatar} alt={txn.entity} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs shrink-0">
                          🍔
                        </div>
                      )}
                      <span className="font-semibold text-gray-800 text-sm">{txn.entity}</span>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                    <span className={`text-xs font-medium ${txn.type === 'Refund' ? 'text-rose-600 font-semibold' : 'text-gray-600'}`}>
                      {txn.type}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className={`py-4 px-4 sm:px-6 font-bold whitespace-nowrap ${txn.amount < 0 ? 'text-gray-800' : 'text-gray-900'}`}>
                    {txn.amount < 0 ? `-$${Math.abs(txn.amount).toFixed(2)}` : `$${txn.amount.toFixed(2)}`}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                    {txn.status === 'Completed' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-600">
                        <CheckCircle2 size={13} /> Completed
                      </span>
                    )}
                    {txn.status === 'Pending' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100/80 text-orange-600">
                        <Clock size={13} /> Pending
                      </span>
                    )}
                    {txn.status === 'Failed' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100/80 text-rose-600">
                        ⚠️ Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 text-xs text-gray-500">
          <span>Showing 1 to {filteredTransactions.length} of 2,451 entries</span>
          <div className="flex items-center gap-1 font-medium">
            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 transition"><ChevronLeft size={16} /></button>
            <button className="w-7 h-7 bg-[#f96b44] text-white rounded-lg flex items-center justify-center font-bold shadow-xs">1</button>
            <button className="w-7 h-7 hover:bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center">2</button>
            <button className="w-7 h-7 hover:bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center">3</button>
            <span className="px-1 text-gray-400">...</span>
            <button className="w-7 h-7 hover:bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center">10</button>
            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 transition"><ChevronRight size={16} /></button>
          </div>
        </div>

      </div>

      {/* Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-gray-900 text-lg">Payout to Partner</h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Partner Category</label>
                <select
                  value={payoutForm.category}
                  onChange={(e) => setPayoutForm({ ...payoutForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 cursor-pointer bg-white"
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="driver">Driver</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Partner / Entity Name</label>
                <input
                  type="text"
                  required
                  value={payoutForm.entity}
                  onChange={(e) => setPayoutForm({ ...payoutForm, entity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  placeholder="e.g. Alex Johnson or Burger Lab"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#f96b44] hover:bg-[#e05630] rounded-xl shadow-xs transition"
                >
                  Process Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}