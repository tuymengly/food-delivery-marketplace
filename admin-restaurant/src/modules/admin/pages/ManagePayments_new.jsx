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
    total_volume: 0, restaurant_payouts: 0, rider_payouts: 0,
    platform_revenue: 0, admin_wallet_balance: 0, pending_payouts: 0,
    successful_payouts: 0, completed_orders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '$0.00';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 10000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const applyPaymentData = (payload = {}) => {
    setTransactions(payload.transactions || []);
    if (payload.stats) setStats(payload.stats);
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
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { fetchPaymentData(); }, 300);
    return () => clearTimeout(timer);
  }, [dateFilter, customStartDate, customEndDate]);

  const handleFilterChange = (filter) => {
    setDateFilter(filter);
    if (filter !== 'custom') { setCustomStartDate(''); setCustomEndDate(''); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
            {['all', 'today', 'week', 'month'].map((filter) => (
              <button key={filter} onClick={() => handleFilterChange(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${dateFilter === filter ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-[#6B7280] border-[#D1D5DB] hover:bg-[#F5F7FA]'}`}>
                {filter === 'all' ? 'All Time' : filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
            <button onClick={() => handleFilterChange('custom')}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${dateFilter === 'custom' ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-[#6B7280] border-[#D1D5DB] hover:bg-[#F5F7FA]'}`}>Custom Range</button>
          </div>
        </div>
      </div>
    </div>
  );
}

      applyPaymentData(apiData);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      setError(error.response?.data?.message || error.message || 'Unable to load payment data.');
    } finally {
      setLoading(false);
    }
  };
