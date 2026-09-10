import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Landmark,
  Clock,
  CheckCircle2,
  AlertCircle,
  Store,
  Bike,
  Wallet
} from 'lucide-react';
import { getPaymentStats } from "../../../services/adminService";
import { calculatePayout } from "../../../services/adminService";

export default function ManagePayments() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    total_volume: 0,
    restaurant_payouts: 0,
    rider_payouts: 0,
    platform_revenue: 0,
    admin_wallet_balance: 0,
    pending_payouts: 0,
    successful_payouts: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL TRANSACTIONS');
  const [calculatorType, setCalculatorType] = useState('rider');
  const [calculatorInput, setCalculatorInput] = useState(JSON.stringify({
    entity_type: 'rider', entity_name: 'Rider name', period: 'YYYY-MM-DD to YYYY-MM-DD', currency: 'USD',
    base_rate: 2.5, distance_rate: 0.75, peak_surge_bonus: 0, quest_completed: false, quest_bonus: 0,
    orders: [{ reference: 'ORD-001', distance_km: 4, peak_surge_bonus: 0, customer_tip: 0, status: 'delivered', picked_up: true }],
  }, null, 2));
  const [calculation, setCalculation] = useState(null);
  const [calculationError, setCalculationError] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async (event) => {
    event.preventDefault();
    setCalculationError('');
    setCalculation(null);
    try {
      const payload = JSON.parse(calculatorInput);
      payload.entity_type = calculatorType;
      setIsCalculating(true);
      const response = await calculatePayout(payload);
      setCalculation(response.data?.data || response.data);
    } catch (error) {
      setCalculationError(error instanceof SyntaxError
        ? 'Enter valid JSON transaction data.'
        : error.response?.data?.message || error.message || 'Unable to calculate payout.');
    } finally {
      setIsCalculating(false);
    }
  };

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
      setError(error.response?.data?.message || error.message || 'Unable to load payment data.');
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
        setError(error.response?.data?.message || error.message || 'Unable to load payment data.');
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

  const statementLines = calculation ? [
    ...(calculation.items || []).flatMap((order) => [
      { label: `${order.reference}: Gross delivery pay`, amount: order.gross, sign: '+' },
      { label: `${order.reference}: Customer tip`, amount: order.tip, sign: '+' },
    ]),
    ...(calculation.additions || []).map((item) => ({ ...item, sign: '+' })),
    ...(calculation.deductions || []).map((item) => ({ ...item, sign: '-' })),
  ] : [];

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading live payment data...</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#fffaf8] min-h-screen text-slate-800 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Payment Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Monitor platform revenue, payouts, and transaction history.</p>
        </div>
        <button
          onClick={fetchPaymentData}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-sm rounded-xl shadow-sm transition w-full sm:w-auto"
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

      <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Payout Calculator</h2>
            <p className="text-sm text-slate-500 mt-1">Calculate an auditable statement. This does not initiate a bank transfer.</p>
          </div>
          <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            {['rider', 'merchant'].map((type) => (
              <button key={type} type="button" onClick={() => setCalculatorType(type)} className={`px-3 py-1.5 text-xs font-bold capitalize rounded-md ${calculatorType === type ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>
                {type}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={handleCalculate} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-500">Transaction log JSON</label>
          <textarea value={calculatorInput} onChange={(event) => setCalculatorInput(event.target.value)} rows={8} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700 outline-none focus:border-orange-400" />
          <div className="flex items-center justify-between gap-3">
            {calculationError && <p className="text-sm text-rose-600">{calculationError}</p>}
            <button type="submit" disabled={isCalculating} className="ml-auto rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {isCalculating ? 'Calculating...' : 'Calculate statement'}
            </button>
          </div>
        </form>
        {calculation && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="font-bold text-slate-900">Statement Summary</h3>
            <p className="text-sm text-slate-600 mt-1">{calculation.statement.entity_name || 'Unnamed entity'} / {calculation.statement.entity_id || 'No ID'} · {calculation.statement.period || 'No period'}</p>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-5 mb-2">Itemized Deductions & Additions</h4>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-slate-400"><th className="py-2">Line item</th><th className="py-2 text-right">Amount</th></tr></thead><tbody>
              {statementLines.map((item, index) => <tr key={`${item.label}-${index}`} className="border-b border-slate-50"><td className="py-2 text-slate-700">{item.label}{item.informational ? ' (informational)' : ''}</td><td className={`py-2 text-right font-semibold ${item.sign === '+' ? 'text-emerald-600' : 'text-rose-600'}`}>{item.sign}${Number(item.amount).toFixed(2)}</td></tr>)}
            </tbody></table></div>
            <p className="mt-5 text-right text-lg font-bold text-slate-900">Final Pay Total: {calculation.currency || 'USD'} {Number(calculation.final_pay_total).toFixed(2)}</p>
          </div>
        )}
      </section>

      {/* Gross sales vs. what the platform actually keeps - kept visually distinct
          so "Admin Wallet" is never mistaken for total customer payments. */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Gross Customer Sales</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(stats.total_volume)}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-2">Total paid by customers on completed orders - not platform profit</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-400 flex items-center justify-center shrink-0">
          <TrendingUp size={24} />
        </div>
      </div>

      {/* Dynamic Stat Cards: where that gross amount actually goes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Restaurant Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">RESTAURANT PAYMENTS</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {formatCurrency(stats.restaurant_payouts)}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-2">Owed to restaurants</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center shrink-0">
            <Store size={24} />
          </div>
        </div>

        {/* Rider Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">RIDER PAYMENTS</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {formatCurrency(stats.rider_payouts)}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-2">Owed to delivery riders</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-400 flex items-center justify-center shrink-0">
            <Bike size={24} />
          </div>
        </div>

        {/* Platform Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">PLATFORM PROFIT</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {formatCurrency(stats.platform_revenue)}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-2">After restaurant + rider shares</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-400 flex items-center justify-center shrink-0">
            <Landmark size={24} />
          </div>
        </div>

        {/* Admin Wallet Balance */}
        <div className="bg-[#0B1F3A] p-5 rounded-2xl border border-[#0B1F3A] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-300 tracking-wider uppercase">ADMIN WALLET</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {formatCurrency(stats.admin_wallet_balance)}
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-2">Platform profit only, not gross sales</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0">
            <Wallet size={24} />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pending Payouts */}
        <div className="bg-[#fff1eb] p-5 rounded-2xl border border-orange-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">PENDING PAYOUTS</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {formatCurrency(stats.pending_payouts)}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2">Restaurant + rider payments awaiting transfer</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/80 text-orange-400 flex items-center justify-center shadow-xs shrink-0">
            <Clock size={24} />
          </div>
        </div>

        {/* Successful Payouts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">SUCCESSFUL PAYOUTS</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {stats.successful_payouts}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-2">Processed today</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Transactions Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/40 px-6 pt-3 gap-8">
          {['ALL TRANSACTIONS', 'RESTAURANT PAYOUTS', 'DRIVER PAYOUTS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-bold tracking-wider transition ${
                activeTab === tab 
                  ? 'text-orange-600 border-b-2 border-orange-600' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase bg-slate-50/30">
                <th className="py-3.5 px-6">TRANSACTION ID</th>
                <th className="py-3.5 px-6">DATE/TIME</th>
                <th className="py-3.5 px-6">ENTITY</th>
                <th className="py-3.5 px-6">TYPE</th>
                <th className="py-3.5 px-6">AMOUNT</th>
                <th className="py-3.5 px-6 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-orange-50/10 transition">
                    <td className="py-4 px-6 font-semibold text-slate-800">{txn.id}</td>
                    <td className="py-4 px-6 text-slate-400 text-xs font-medium">{txn.dateTime}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {txn.avatar ? (
                          <img src={txn.avatar} alt={txn.entity} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                            👤
                          </div>
                        )}
                        <span className="font-semibold text-slate-800 text-sm">{txn.entity}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-medium text-slate-600">{txn.type}</span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
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
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
                    No transaction data available yet.
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
