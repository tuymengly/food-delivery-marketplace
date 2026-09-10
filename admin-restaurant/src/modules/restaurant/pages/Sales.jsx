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
              color: #1f2937;
              font-family: Arial, Helvetica, sans-serif;
              background: #ffffff;
            }
            .header {
              display: flex;
              justify-content: space-between;
              gap: 24px;
              padding-bottom: 18px;
              border-bottom: 2px solid #ea580c;
              margin-bottom: 24px;
            }
            h1 {
              margin: 0 0 6px;
              color: #111827;
              font-size: 26px;
            }
            h2 {
              margin: 28px 0 12px;
              color: #111827;
              font-size: 16px;
            }
            .meta {
              text-align: right;
              color: #6b7280;
              font-size: 12px;
              line-height: 1.6;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              page-break-inside: avoid;
            }
            th {
              text-align: left;
              color: #6b7280;
              background: #fff7ed;
              border: 1px solid #fed7aa;
              padding: 10px;
              font-size: 11px;
              text-transform: uppercase;
            }
            td {
              border: 1px solid #e5e7eb;
              padding: 10px;
              font-size: 12px;
              vertical-align: top;
            }
            .empty {
              color: #9ca3af;
              text-align: center;
              padding: 18px;
            }
            .footer {
              margin-top: 28px;
              color: #9ca3af;
              font-size: 11px;
              text-align: center;
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
              <div>Range: ${htmlEscape(timeRange)}</div>
            </div>
            <div class="meta">
              Generated At<br />
              ${htmlEscape(generatedAt)}
            </div>
          </section>

          <h2>Summary</h2>
          ${buildPdfTable(['Metric', 'Value', 'Change'], summaryRows, 'No summary data available.')}

          <h2>Payment Methods</h2>
          ${buildPdfTable(['Payment Method', 'Amount', 'Percent'], paymentRows, 'No payment data for this range.')}

          <h2>Recent Transactions</h2>
          ${buildPdfTable(['Order ID', 'Date', 'Customer', 'Payment Method', 'Amount', 'Status'], transactionRows, 'No transactions found for this range.')}

          <div class="footer">Generated from Restaurant Sales & Earnings</div>
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfbfa]">
        <Loader2 className="w-9 h-9 text-orange-600 animate-spin" />
        <span className="mt-3 text-sm text-slate-600 font-medium">Loading sales data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfbfa] p-4">
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl max-w-md w-full text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-red-900">Connection problem</h3>
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <button
            onClick={() => fetchSalesData(true)}
            className="mt-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-semibold hover:bg-orange-700 transition inline-flex items-center gap-2"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            ព្យាយាមម្តងទៀត
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#fcfbfa] min-h-screen space-y-6 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Sales & Earnings</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track your financial performance, payouts, and transaction history
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
            <Calendar size={14} className="text-slate-400" />
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

          <button
            onClick={() => fetchSalesData(true)}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-orange-600' : ''} />
            Refresh
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Download size={15} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = Number(stat.change) >= 0;

          return (
            <div key={stat.title} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#fdf2ee] text-orange-600 flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <div className={`flex items-center text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  <span>{formatChange(stat.change)}</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400">{stat.title}</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stat.amount}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900">Payout Overview</h2>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
              Next Payout: {salesData.stats.nextPayoutDate || 'N/A'}
            </span>
          </div>

          <div className="p-4 bg-[#fdf2ee] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Available for Payout</p>
              <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {formatCurrency(salesData.stats.availableForPayout)}
              </h4>
            </div>
            <button className="w-full sm:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition">
              Withdraw Funds
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-slate-700">Revenue Channels</p>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Gross Revenue</span>
                <span className="text-slate-900">{formatCurrency(salesData.stats.totalRevenue)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Net Earnings</span>
                <span className="text-slate-900">{formatCurrency(salesData.stats.netEarnings)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-amber-400 h-2 rounded-full"
                  style={{
                    width: `${salesData.stats.totalRevenue > 0 ? Math.round((salesData.stats.netEarnings / salesData.stats.totalRevenue) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Payment Methods</h2>
          <div className="space-y-4">
            {salesData.paymentMethods.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No payment data for this range.</p>
            ) : (
              salesData.paymentMethods.map((method) => {
                const percent = paymentTotal > 0 ? Math.round(((Number(method.amount) || 0) / paymentTotal) * 100) : 0;

                return (
                  <div key={method.name} className="space-y-1.5 pb-2 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600">{method.name}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(method.amount)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-orange-600 h-1.5 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-3">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
          <span className="text-xs font-semibold text-slate-400">{salesData.transactions.length} orders</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf8f5] text-slate-400 text-xs font-semibold">
                <th className="py-3 px-5">Order ID</th>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5">Payment Method</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {salesData.transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No transactions found for this range.
                  </td>
                </tr>
              ) : (
                salesData.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-5 font-bold text-slate-900">{tx.id}</td>
                    <td className="py-3.5 px-5 text-slate-500">{tx.date || 'N/A'}</td>
                    <td className="py-3.5 px-5 font-semibold text-slate-800">{tx.customer}</td>
                    <td className="py-3.5 px-5 text-slate-600">{tx.payment}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">{formatCurrency(tx.amount)}</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        tx.status === 'Completed' || tx.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-700'
                          : tx.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
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
