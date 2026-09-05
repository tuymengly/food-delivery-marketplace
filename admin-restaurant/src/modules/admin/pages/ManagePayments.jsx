import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Landmark, 
  Clock, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { getPaymentStats } from "../../../services/adminService";

export default function ManagePayments() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    total_volume: 0,
    platform_revenue: 0,
    pending_payouts: 0,
    successful_payouts: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL TRANSACTIONS');

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
      const res = await getPaymentStats();
      const apiData = res.data?.data || res.data || {};
      applyPaymentData(apiData);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      setError(error.response?.data?.message || error.message || 'ពុំអាចទាញយកទិន្នន័យ payment បានទេ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getPaymentStats()
      .then((res) => {
        if (!isMounted) return;
        const apiData = res.data?.data || res.data || {};
        applyPaymentData(apiData);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('Error fetching payment data:', error);
        setError(error.response?.data?.message || error.message || 'ពុំអាចទាញយកទិន្នន័យ payment បានទេ');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTransactions = transactions.filter((txn) => {
    const cat = (txn.category || '').toLowerCase();
    if (activeTab === 'RESTAURANT PAYOUTS') return cat === 'restaurant';
    if (activeTab === 'DRIVER PAYOUTS') return cat === 'driver';
    return true;
  });

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">កំពុងទាញយកទិន្នន័យពិតពី Server...</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#fffaf8] min-h-screen text-gray-800 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Payment Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Monitor platform revenue, payouts, and transaction history.</p>
        </div>
        <button
          onClick={fetchPaymentData}
          className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-medium text-sm rounded-xl shadow-sm transition w-full sm:w-auto"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl p-4 flex items-center gap-2 text-sm font-medium">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Dynamic Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Volume */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">TOTAL VOLUME</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              {formatCurrency(stats.total_volume)}
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-2">All completed orders</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-400 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Platform Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">PLATFORM REVENUE</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              {formatCurrency(stats.platform_revenue)}
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-2">Platform Earnings</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-400 flex items-center justify-center shrink-0">
            <Landmark size={24} />
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="bg-[#fff1eb] p-5 rounded-2xl border border-orange-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase">PENDING PAYOUTS</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              {formatCurrency(stats.pending_payouts)}
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-2">Requires manual review</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/80 text-orange-400 flex items-center justify-center shadow-xs shrink-0">
            <Clock size={24} />
          </div>
        </div>

        {/* Successful Payouts */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">SUCCESSFUL PAYOUTS</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              {stats.successful_payouts}
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-2">Processed today</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
        </div>

      </div>

      {/* Transactions Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/40 px-6 pt-3 gap-8">
          {['ALL TRANSACTIONS', 'RESTAURANT PAYOUTS', 'DRIVER PAYOUTS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-bold tracking-wider transition ${
                activeTab === tab 
                  ? 'text-[#f96b44] border-b-2 border-[#f96b44]' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 tracking-wider uppercase bg-gray-50/30">
                <th className="py-3.5 px-6">TRANSACTION ID</th>
                <th className="py-3.5 px-6">DATE/TIME</th>
                <th className="py-3.5 px-6">ENTITY</th>
                <th className="py-3.5 px-6">TYPE</th>
                <th className="py-3.5 px-6">AMOUNT</th>
                <th className="py-3.5 px-6 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-orange-50/10 transition">
                    <td className="py-4 px-6 font-semibold text-gray-800">{txn.id}</td>
                    <td className="py-4 px-6 text-gray-400 text-xs font-medium">{txn.dateTime}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {txn.avatar ? (
                          <img src={txn.avatar} alt={txn.entity} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs shrink-0">
                            👤
                          </div>
                        )}
                        <span className="font-semibold text-gray-800 text-sm">{txn.entity}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-medium text-gray-600">{txn.type}</span>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">
                      ${Number(txn.amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        txn.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' :
                        txn.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400 text-sm">
                    មិនទាន់មានទិន្នន័យប្រតិបត្តិការនៅឡើយទេ (No Transactions Available)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
