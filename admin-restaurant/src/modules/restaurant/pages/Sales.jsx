import { useCallback, useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { getRestaurantSalesStats } from '../../../services/restaurantService';

const initialSalesData = {
  stats: {
    totalRevenue: 0,
    totalRevenueChange: 0,
    netEarnings: 0,
    netEarningsChange: 0,
    totalOrders: 0,
    totalOrdersChange: 0,
    avgOrderValue: 0,
    avgOrderValueChange: 0,
    availableForPayout: 0,
    nextPayoutDate: '',
  },
  paymentMethods: [],
  transactions: [],
};

const formatCurrency = (amount) => {
  const value = Number(amount) || 0;
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatChange = (value) => {
  const numericValue = Number(value) || 0;
  return `${numericValue >= 0 ? '+' : ''}${numericValue.toFixed(1)}%`;
};

const htmlEscape = (value) => {
  const text = String(value ?? '');
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

const buildPdfTable = (headers, rows, emptyMessage) => {
  const bodyRows = rows.length > 0
    ? rows.map((row) => `
        <tr>
          ${row.map((cell) => `<td>${htmlEscape(cell)}</td>`).join('')}
        </tr>
      `).join('')
    : `
      <tr>
        <td colspan="${headers.length}" class="empty">${htmlEscape(emptyMessage)}</td>
      </tr>
    `;

  return `
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${htmlEscape(header)}</th>`).join('')}</tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;
};

export default function Sales() {
  const [timeRange, setTimeRange] = useState('This Month');
  const [salesData, setSalesData] = useState(initialSalesData);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchSalesData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      setError(null);

      const restaurantId = localStorage.getItem('restaurant_id');
      const response = await getRestaurantSalesStats({ restaurantId, range: timeRange });

      if (response.data.success) {
        setSalesData({
          stats: { ...initialSalesData.stats, ...(response.data.stats || {}) },
          paymentMethods: response.data.paymentMethods || [],
          transactions: response.data.transactions || [],
        });
      } else {
        setError(response.data.message || 'Failed to fetch sales data.');
      }
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError(err.response?.data?.message || 'Unable to load sales data.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchSalesData();
    });
  }, [fetchSalesData]);

  const stats = [
    {
      title: 'Total Revenue',
      amount: formatCurrency(salesData.stats.totalRevenue),
      change: salesData.stats.totalRevenueChange,
      icon: DollarSign,
    },
    {
      title: 'Net Earnings',
      amount: formatCurrency(salesData.stats.netEarnings),
      change: salesData.stats.netEarningsChange,
      icon: TrendingUp,
    },
    {
      title: 'Total Orders',
      amount: String(salesData.stats.totalOrders || 0),
      change: salesData.stats.totalOrdersChange,
      icon: ShoppingBag,
    },
    {
      title: 'Avg. Order Value',
      amount: formatCurrency(salesData.stats.avgOrderValue),
      change: salesData.stats.avgOrderValueChange,
      icon: CreditCard,
    },
  ];

  const paymentTotal = salesData.paymentMethods.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleExportPdf = () => {
    const generatedAt = new Date().toLocaleString('en-US');
    const reportWindow = window.open('', '_blank', 'width=960,height=720');

    if (!reportWindow) {
      alert('Please allow popups to export the sales report as PDF.');
      return;
    }

    const summaryRows = [
      ['Total Revenue', formatCurrency(salesData.stats.totalRevenue), formatChange(salesData.stats.totalRevenueChange)],
      ['Net Earnings', formatCurrency(salesData.stats.netEarnings), formatChange(salesData.stats.netEarningsChange)],
      ['Total Orders', salesData.stats.totalOrders || 0, formatChange(salesData.stats.totalOrdersChange)],
      ['Avg. Order Value', formatCurrency(salesData.stats.avgOrderValue), formatChange(salesData.stats.avgOrderValueChange)],
      ['Available for Payout', formatCurrency(salesData.stats.availableForPayout), ''],
      ['Next Payout Date', salesData.stats.nextPayoutDate || 'N/A', ''],
    ];

    const paymentRows = salesData.paymentMethods.map((method) => {
        const amount = Number(method.amount) || 0;
        const percent = paymentTotal > 0 ? Math.round((amount / paymentTotal) * 100) : 0;
        return [method.name || 'Unknown', formatCurrency(amount), `${percent}%`];
      });

    const transactionRows = salesData.transactions.map((tx) => [
        tx.id,
        tx.date || 'N/A',
        tx.customer || 'Guest Customer',
        tx.payment || 'Online Order',
        formatCurrency(tx.amount),
        tx.status || 'Pending',
      ]);

    reportWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Restaurant Sales Report</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 32px;
              color: #1e293b;
              font-family: Arial, Helvetica, sans-serif;
              background: #ffffff;
            }
            .header {
              display: flex;
              justify-content: space-between;
              gap: 24px;
              padding-bottom: 18px;
              border-bottom: 2px solid #1e3a8a; /* Dark Blue */
              margin-bottom: 24px;
            }
            h1 {
              margin: 0 0 6px;
              color: #0f172a;
              font-size: 26px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            h2 {
              margin: 28px 0 12px;
              color: #0f172a;
              font-size: 16px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .meta {
              text-align: right;
              color: #64748b;
              font-size: 12px;
              line-height: 1.6;
              text-transform: uppercase;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              page-break-inside: avoid;
            }
            th {
              text-align: left;
              color: #ffffff;
              background: #0f172a; /* Slate 900 */
              border: 1px solid #0f172a;
              padding: 12px 10px;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            td {
              border: 1px solid #cbd5e1;
              padding: 10px;
              font-size: 12px;
              vertical-align: top;
            }
            .empty {
              color: #94a3b8;
              text-align: center;
              padding: 18px;
              text-transform: uppercase;
            }
            .footer {
              margin-top: 32px;
              color: #94a3b8;
              font-size: 11px;
              text-align: center;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            @media print {
              body { padding: 22px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <section class="header">
            <div>
              <h1>Restaurant Sales Report</h1>
              <div style="text-transform: uppercase; font-size: 12px; font-weight: bold; color: #1e3a8a;">Range: ${htmlEscape(timeRange)}</div>
            </div>
            <div class="meta">
              Generated At<br />
              <strong>${htmlEscape(generatedAt)}</strong>
            </div>
          </section>

          <h2>Summary</h2>
          ${buildPdfTable(['Metric', 'Value', 'Change'], summaryRows, 'No summary data available.')}

          <h2>Payment Methods</h2>
          ${buildPdfTable(['Payment Method', 'Amount', 'Percent'], paymentRows, 'No payment data for this range.')}

          <h2>Recent Transactions</h2>
          ${buildPdfTable(['Order ID', 'Date', 'Customer', 'Payment Method', 'Amount', 'Status'], transactionRows, 'No transactions found for this range.')}

          <div class="footer">Generated from Restaurant Sales & Earnings Portal</div>
          <script>
            window.addEventListener('load', () => {
              window.focus();
              setTimeout(() => window.print(), 250);
            });
          </script>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 rounded-none">
        <Loader2 className="w-10 h-10 text-blue-900 animate-spin" />
        <span className="mt-4 text-xs text-slate-600 font-bold uppercase tracking-widest">Loading sales data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4 rounded-none">
        <div className="bg-white border border-slate-300 p-8 rounded-none max-w-md w-full text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-700 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Connection Problem</h3>
          <p className="text-xs text-slate-600 font-medium">{error}</p>
          <button
            onClick={() => fetchSalesData(true)}
            className="mt-4 px-6 py-2.5 bg-blue-900 text-white rounded-none text-xs font-bold uppercase tracking-wider hover:bg-blue-950 transition inline-flex items-center gap-2 border border-blue-950"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-slate-100 min-h-screen space-y-6 text-slate-800 font-sans rounded-none">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Sales & Earnings</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track your financial performance, payouts, and transaction history
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-none px-3 py-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
            <Calendar size={14} className="text-slate-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer text-slate-900"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          <button
            onClick={() => fetchSalesData(true)}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 border border-slate-300 text-slate-800 hover:bg-slate-300 rounded-none text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-900' : ''} />
            Refresh
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white border border-blue-950 rounded-none text-xs font-bold uppercase tracking-wider transition"
          >
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = Number(stat.change) >= 0;

          return (
            <div key={stat.title} className="bg-white p-5 rounded-none border border-slate-300 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-slate-50 border border-slate-200 text-blue-900 flex items-center justify-center rounded-none">
                  <Icon size={20} />
                </div>
                <div className={`flex items-center text-xs font-bold px-2 py-1 border rounded-none uppercase tracking-wide ${isPositive ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                  {isPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                  <span>{formatChange(stat.change)}</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{stat.title}</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{stat.amount}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts / Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payout Overview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-none border border-slate-300 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Payout Overview</h2>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-none uppercase tracking-widest">
              Next Payout: {salesData.stats.nextPayoutDate || 'N/A'}
            </span>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-300 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Available for Payout</p>
              <h4 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                {formatCurrency(salesData.stats.availableForPayout)}
              </h4>
            </div>
            <button className="w-full sm:w-auto px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs uppercase tracking-wider border border-blue-950 rounded-none transition">
              Withdraw Funds
            </button>
          </div>

          <div className="space-y-4 pt-2">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">Revenue Breakdown</p>
            
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-500 uppercase tracking-wider">Gross Revenue</span>
                <span className="text-slate-900">{formatCurrency(salesData.stats.totalRevenue)}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-none h-2">
                <div className="bg-blue-900 h-2 rounded-none" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-500 uppercase tracking-wider">Net Earnings</span>
                <span className="text-slate-900">{formatCurrency(salesData.stats.netEarnings)}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-none h-2">
                <div
                  className="bg-slate-600 h-2 rounded-none"
                  style={{
                    width: `${salesData.stats.totalRevenue > 0 ? Math.round((salesData.stats.netEarnings / salesData.stats.totalRevenue) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-none border border-slate-300 space-y-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-3">
            Payment Methods
          </h2>
          <div className="space-y-5">
            {salesData.paymentMethods.length === 0 ? (
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider text-center py-4">No payment data found.</p>
            ) : (
              salesData.paymentMethods.map((method) => {
                const percent = paymentTotal > 0 ? Math.round(((Number(method.amount) || 0) / paymentTotal) * 100) : 0;

                return (
                  <div key={method.name} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 uppercase tracking-wider">{method.name}</span>
                      <span className="text-slate-900">{formatCurrency(method.amount)}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-none h-2">
                      <div className="bg-blue-900 h-2 rounded-none transition-all duration-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-none border border-slate-300 overflow-hidden">
        <div className="p-5 border-b border-slate-300 flex items-center justify-between bg-white">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Recent Transactions</h2>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1 border border-slate-200 bg-slate-50">
            {salesData.transactions.length} Orders
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-semibold uppercase tracking-widest">
                <th className="py-3.5 px-5 border-b border-slate-800 whitespace-nowrap">Order ID</th>
                <th className="py-3.5 px-5 border-b border-slate-800 whitespace-nowrap">Date</th>
                <th className="py-3.5 px-5 border-b border-slate-800 whitespace-nowrap">Customer</th>
                <th className="py-3.5 px-5 border-b border-slate-800 whitespace-nowrap">Payment</th>
                <th className="py-3.5 px-5 border-b border-slate-800 whitespace-nowrap">Amount</th>
                <th className="py-3.5 px-5 border-b border-slate-800 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-medium">
              {salesData.transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    No transactions found for this range.
                  </td>
                </tr>
              ) : (
                salesData.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-5 font-bold text-blue-900 whitespace-nowrap">{tx.id}</td>
                    <td className="py-4 px-5 text-slate-600 whitespace-nowrap">{tx.date || 'N/A'}</td>
                    <td className="py-4 px-5 font-bold text-slate-900 whitespace-nowrap">{tx.customer}</td>
                    <td className="py-4 px-5 text-slate-600 uppercase tracking-wide whitespace-nowrap">{tx.payment}</td>
                    <td className="py-4 px-5 font-bold text-slate-900 whitespace-nowrap">{formatCurrency(tx.amount)}</td>
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-none border text-[10px] font-bold uppercase tracking-wider ${
                        tx.status === 'Completed' || tx.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : tx.status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}