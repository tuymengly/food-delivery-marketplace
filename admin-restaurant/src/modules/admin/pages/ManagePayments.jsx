import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Landmark,
  Clock,
  CheckCircle2,
  AlertCircle,
  Store,
  Bike,
  Wallet,
  Filter
} from 'lucide-react';
import { getPaymentStats } from "../../../services/adminService";

export default function ManagePayments() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    total_volume: 0,
    restaurant_payouts: 0,
    rider_payouts: 0,
    platform_revenue: 0,
    admin_wallet_balance: 0,
    pending_payouts: 0,
    successful_payouts: 0,
    completed_orders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '$0.00';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 10000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const applyPaymentData = (payload = {}) => {
    setTransactions(payload.transactions || []);
    if (payload.stats) {
      setStats(payload.stats);
    }
  };

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      
      if (dateFilter === 'today') {
        const today = new Date();
        params.start_date = today.toISOString().split('T')[0];
        params.end_date = today.toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        params.start_date = weekStart.toISOString().split('T')[0];
        params.end_date = today.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        params.start_date = monthStart.toISOString().split('T')[0];
        params.end_date = today.toISOString().split('T')[0];
      } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
        params.start_date = customStartDate;
        params.end_date = customEndDate;
      }
      
      const res = await getPaymentStats(params);
      const apiData = res.data?.data || res.data || {};
      applyPaymentData(apiData);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      setError(error.response?.data?.message || error.message || 'Unable to load payment data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const res = await getPaymentStats();
        if (!isMounted) return;
        const apiData = res.data?.data || res.data || {};
        applyPaymentData(apiData);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching payment data:', error);
        setError(error.response?.data?.message || error.message || 'Unable to load payment data.');
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPaymentData();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [dateFilter, customStartDate, customEndDate]);

  const handleFilterChange = (filter) => {
    setDateFilter(filter);
    if (filter !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const transactionTotals = transactions.reduce((acc, txn) => {
    acc.order_total += txn.order_total || 0;
    acc.restaurant_amount += txn.restaurant_amount || 0;
    acc.rider_amount += txn.rider_amount || 0;
    acc.platform_amount += txn.platform_amount || 0;
    return acc;
  }, { order_total: 0, restaurant_amount: 0, rider_amount: 0, platform_amount: 0 });

  if (loading && transactions.length === 0) {
    return <div className="p-8 text-center text-[#6B7280] font-medium">Loading finance data...</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#F5F7FA] min-h-screen text-[#1F2937] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B1F3A]">Finance Overview</h1>
          <p className="text-sm text-[#6B7280] mt-1">Automatic financial calculations from completed orders</p>
        </div>
        <button onClick={fetchPaymentData} className="px-4 py-2 bg-white hover:bg-[#F5F7FA] text-[#1F2937] border border-[#D1D5DB] font-medium text-sm rounded-lg transition flex items-center gap-2">
          <Clock size={16} /> Refresh
        </button>
      </div>

      {error && (<div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-4 flex items-center gap-2 text-sm font-medium"><AlertCircle size={18} /> {error}</div>)}

      <div className="bg-white rounded-xl border border-[#D1D5DB] p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2"><Filter size={18} className="text-[#6B7280]" /><span className="text-sm font-semibold text-[#6B7280]">Filter by Date:</span></div>
          <div className="flex flex-wrap gap-2">
            {[['all','All Time'],['today','Today'],['week','This Week'],['month','This Month']].map(([v,l]) => (
              <button key={v} onClick={()=>handleFilterChange(v)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${dateFilter===v?'bg-[#2563EB] text-white border-[#2563EB]':'bg-white text-[#6B7280] border-[#D1D5DB] hover:bg-[#F5F7FA]'}`}>{l}</button>
            ))}
            <button onClick={()=>handleFilterChange('custom')}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${dateFilter==='custom'?'bg-[#2563EB] text-white border-[#2563EB]':'bg-white text-[#6B7280] border-[#D1D5DB] hover:bg-[#F5F7FA]'}`}>Custom Range</button>
          </div>
        </div>
        {dateFilter==='custom' && (
          <div className="mt-4 pt-4 border-t border-[#D1D5DB] flex flex-col sm:flex-row gap-3 justify-end">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#6B7280]">Start:</label>
              <input type="date" value={customStartDate} onChange={e=>setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"/>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#6B7280]">End:</label>
              <input type="date" value={customEndDate} onChange={e=>setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"/>
            </div>
          </div>
        )}
      </div>

      {dateFilter!=='all' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 flex items-center gap-2 text-sm">
          <Clock size={16}/><span>Showing data for: </span>
          <strong className="ml-1">{dateFilter==='today'&&'Today'}{dateFilter==='week'&&'This Week'}{dateFilter==='month'&&'This Month'}{dateFilter==='custom'&&customStartDate&&customEndDate&&`${formatDate(customStartDate)} - ${formatDate(customEndDate)}`}</strong>
          <button onClick={()=>handleFilterChange('all')} className="ml-auto text-blue-600 hover:text-blue-800 text-xs font-medium">Clear filter</button>
        </div>
      )}



      {/* Gross sales vs. what the platform actually keeps - kept visually distinct
          so "Admin Wallet" is never mistaken for total customer payments. */}
      <div className="bg-white p-5 rounded-xl border border-[#D1D5DB] flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[#6B7280] tracking-wider uppercase">Gross Customer Sales</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#0B1F3A] mt-1">
            {formatCurrency(stats.total_volume)}
          </h3>
          <p className="text-xs text-[#6B7280] font-medium mt-2">Total paid by customers on completed orders — not platform profit</p>
        </div>
        <div className="w-11 h-11 rounded-lg bg-[#F5F7FA] text-[#2563EB] flex items-center justify-center shrink-0">
          <TrendingUp size={22} />
        </div>
      </div>

      {/* Dynamic Stat Cards: where that gross amount actually goes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Restaurant Payments */}
        <div className="bg-white p-5 rounded-xl border border-[#D1D5DB] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] tracking-wider uppercase">Restaurant Payments</p>
            <h3 className="text-2xl font-bold text-[#0B1F3A] mt-1">
              {formatCurrency(stats.restaurant_payouts)}
            </h3>
            <p className="text-xs text-[#6B7280] font-medium mt-2">Owed to restaurants</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#F5F7FA] text-[#163A63] flex items-center justify-center shrink-0">
            <Store size={20} />
          </div>
        </div>

        {/* Rider Payments */}
        <div className="bg-white p-5 rounded-xl border border-[#D1D5DB] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] tracking-wider uppercase">Rider Payments</p>
            <h3 className="text-2xl font-bold text-[#0B1F3A] mt-1">
              {formatCurrency(stats.rider_payouts)}
            </h3>
            <p className="text-xs text-[#6B7280] font-medium mt-2">Owed to delivery riders</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#F5F7FA] text-[#2563EB] flex items-center justify-center shrink-0">
            <Bike size={20} />
          </div>
        </div>

        {/* Platform Profit */}
        <div className="bg-white p-5 rounded-xl border border-[#D1D5DB] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] tracking-wider uppercase">Platform Profit</p>
            <h3 className="text-2xl font-bold text-[#0B1F3A] mt-1">
              {formatCurrency(stats.platform_revenue)}
            </h3>
            <p className="text-xs text-[#6B7280] font-medium mt-2">After restaurant + rider shares</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#F5F7FA] text-emerald-600 flex items-center justify-center shrink-0">
            <Landmark size={20} />
          </div>
        </div>

        {/* Admin Wallet Balance */}
        <div className="bg-[#0B1F3A] p-5 rounded-xl border border-[#0B1F3A] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-300 tracking-wider uppercase">Admin Wallet</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {formatCurrency(stats.admin_wallet_balance)}
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-2">Platform profit only, not gross sales</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0">
            <Wallet size={20} />
          </div>
        </div>

      </div>

      <div className="bg-white rounded-xl border border-[#D1D5DB] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#D1D5DB] bg-[#F5F7FA]">
          <h3 className="text-base font-bold text-[#0B1F3A]">Recent Transactions</h3>
          <p className="text-xs text-[#6B7280] mt-0.5">{transactions.length} transaction{transactions.length!==1?'s':''} - Auto-generated from completed orders</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D1D5DB] text-[11px] font-bold text-[#6B7280] tracking-wider uppercase bg-[#F5F7FA]">
                <th className="py-3 px-4">Order #</th><th className="py-3 px-4">Date</th><th className="py-3 px-4">Restaurant</th>
                <th className="py-3 px-4">Rider</th><th className="py-3 px-4 text-right">Order Total</th>
                <th className="py-3 px-4 text-right">Restaurant</th><th className="py-3 px-4 text-right">Rider</th>
                <th className="py-3 px-4 text-right">Platform</th><th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F7FA] text-sm">
              {transactions.length > 0 ? transactions.map(txn => (
                <tr key={txn.id} className="hover:bg-[#F5F7FA] transition">
                  <td className="py-3.5 px-4 font-semibold text-[#1F2937]">{txn.order_number}</td>
                  <td className="py-3.5 px-4 text-[#6B7280] text-xs font-medium whitespace-nowrap">{txn.dateTime}</td>
                  <td className="py-3.5 px-4 font-medium text-[#1F2937]">{txn.restaurant}</td>
                  <td className="py-3.5 px-4 text-[#6B7280]">{txn.rider}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#0B1F3A]">{formatCurrency(txn.order_total)}</td>
                  <td className="py-3.5 px-4 text-right text-emerald-600 font-medium">{txn.restaurant_amount>0?formatCurrency(txn.restaurant_amount):'-'}</td>
                  <td className="py-3.5 px-4 text-right text-blue-600 font-medium">{txn.rider_amount>0?formatCurrency(txn.rider_amount):'-'}</td>
                  <td className="py-3.5 px-4 text-right text-[#1F2937] font-medium">{formatCurrency(txn.platform_amount)}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${txn.status==='Completed'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>
                      <CheckCircle2 size={12}/>{txn.status}
                    </span>
                  </td>
                </tr>
              )) : <tr><td colSpan="9" className="py-12 text-center text-[#6B7280]"><div className="flex flex-col items-center gap-2"><CheckCircle2 size={32} className="text-[#D1D5DB]"/><p className="text-sm font-medium">No transactions found</p><p className="text-xs">Completed orders will appear here automatically</p></div></td></tr>}
            </tbody>
          </table>
        </div>
        {transactions.length > 0 && (
          <div className="px-6 py-4 bg-[#F5F7FA] border-t border-[#D1D5DB]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
              <p className="text-[#6B7280] font-medium">Transaction Totals</p>
              <div className="flex flex-wrap gap-6">
                <div className="text-right"><span className="text-[#6B7280]">Order Total: </span><span className="font-bold text-[#0B1F3A]">{formatCurrency(transactionTotals.order_total)}</span></div>
                <div className="text-right"><span className="text-[#6B7280]">Restaurant: </span><span className="font-bold text-emerald-600">{formatCurrency(transactionTotals.restaurant_amount)}</span></div>
                <div className="text-right"><span className="text-[#6B7280]">Rider: </span><span className="font-bold text-blue-600">{formatCurrency(transactionTotals.rider_amount)}</span></div>
                <div className="text-right"><span className="text-[#6B7280]">Platform: </span><span className="font-bold text-[#1F2937]">{formatCurrency(transactionTotals.platform_amount)}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#D1D5DB] p-5">
        <h4 className="text-sm font-bold text-[#0B1F3A] mb-3">About This Page</h4>
        <ul className="text-sm text-[#6B7280] space-y-2">
          <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/><span>Financial data is automatically calculated from <strong>completed orders</strong> - no manual entry needed.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/><span>Only orders with status <strong>"Delivered"</strong> or <strong>"Completed"</strong> are included in financial totals.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/><span>Platform Profit = Total Revenue - Restaurant Payouts - Rider Payouts (platform fee).</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/><span>Use the date filters above to view financial data for specific time periods.</span></li>
        </ul>
      </div>
    </div>
  );
}