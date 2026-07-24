import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { LayoutDashboard, TrendingUp, IndianRupee, Users, Package, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentTransactions(res.data.recentTransactions);
        setChartData(res.data.chartData);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
          <div className="h-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
        </div>
      </div>
    );
  }

  // Draw premium SVG chart points
  const maxSales = chartData.length > 0 ? Math.max(...chartData.map(d => d.sales), 1000) : 1000;
  const svgWidth = 500;
  const svgHeight = 150;
  const padding = 20;

  const points = chartData.map((d, index) => {
    const x = padding + (index * (svgWidth - padding * 2)) / (chartData.length - 1 || 1);
    const y = svgHeight - padding - (d.sales * (svgHeight - padding * 2)) / maxSales;
    return { x, y, label: d._id, sales: d.sales };
  });

  const polylinePath = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div 
        className="relative p-8 rounded-2xl shadow-md text-white overflow-hidden transition-all bg-cover bg-center min-h-[180px] flex flex-col md:flex-row md:items-center justify-between border border-slate-200 dark:border-slate-800"
        style={
          settings?.dashboardBanner 
            ? { backgroundImage: `url(${settings.dashboardBanner})` } 
            : { backgroundImage: 'linear-gradient(to right, #0ea5e9, #4f46e5, #7c3aed)' }
        }
      >
        {/* Dark semi-transparent overlay to ensure text contrast */}
        <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/50 backdrop-blur-[1px] z-0" />

        {/* Left Side: Greetings */}
        <div className="relative z-10 space-y-2 max-w-xl">
          <span className="text-[10px] font-bold tracking-widest uppercase text-sky-200/80">
            {settings?.storeName || 'AccuCount ERP'}
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Welcome, {settings?.storeName || 'AccuCount'}
          </h2>
          <p className="text-sm text-slate-100/90 font-medium">
            Here's a quick view of your store performance.
          </p>
        </div>

        {/* Right Side: Stats & Action */}
        <div className="relative z-10 mt-4 md:mt-0 flex flex-col items-start md:items-end gap-3">
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-xs font-bold text-white">
            <span className="text-emerald-400 font-extrabold">+5.4%</span> growth vs yesterday
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              to="/billing"
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-white/30 shadow transition-all"
            >
              Create Invoice
            </Link>
            <button
              onClick={fetchDashboardData}
              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 transition-all"
              title="Refresh stats"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>


      {/* Grid metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Turnover</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₹{stats?.totalSales.toFixed(2)}
          </p>
          <span className="text-xs text-slate-400 block mt-2">Accumulated invoices</span>
        </div>

        {/* Today's Sales */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Sales</span>
            <div className="h-8 w-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
              <IndianRupee className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₹{stats?.todaySales.toFixed(2)}
          </p>
          <span className="text-xs text-emerald-500 block mt-2 font-semibold">Active cash registry</span>
        </div>

        {/* Pending customer payments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Dues</span>
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-500 mt-2">
            ₹{stats?.pendingPayments.toFixed(2)}
          </p>
          <span className="text-xs text-slate-400 block mt-2">Total credit invoices balance</span>
        </div>

        {/* Inventory low stock alerts count */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Alerts</span>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              stats?.lowStockCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 dark:bg-slate-850 text-slate-400'
            }`}>
              <AlertCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 ${
            stats?.lowStockCount > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'
          }`}>
            {stats?.lowStockCount} Products
          </p>
          <span className="text-xs text-slate-400 block mt-2">Below critical limits</span>
        </div>
      </div>

      {/* Analytics Graph & Activity tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales charts (Line Graph) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm transition-colors flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Sales Analytics Chart (7-Days trend)</h3>
          
          {chartData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              No recent sale transaction records to compile charts
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              {/* SVG Vector Render */}
              <div className="w-full">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
                  {/* Grid Lines */}
                  <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} className="stroke-slate-200 dark:stroke-slate-850" strokeWidth="1" />

                  {/* Gradient Area under line */}
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {polylinePath && (
                    <polygon
                      points={`${padding},${svgHeight - padding} ${polylinePath} ${svgWidth - padding},${svgHeight - padding}`}
                      fill="url(#chartGrad)"
                    />
                  )}

                  {/* Plot Polyline */}
                  <polyline
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    points={polylinePath}
                  />

                  {/* Plot Circles */}
                  {points.map((p, i) => (
                    <g key={i} className="group cursor-pointer">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill="#0ea5e9"
                        className="stroke-white dark:stroke-slate-900"
                        strokeWidth="1.5"
                      />
                      {/* Tooltip */}
                      <text
                        x={p.x}
                        y={p.y - 8}
                        textAnchor="middle"
                        className="fill-slate-800 dark:fill-slate-200 font-sans font-bold text-[8px] opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950"
                      >
                        ₹{p.sales.toFixed(0)}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between px-4 text-[10px] text-slate-500 font-mono mt-2">
                {points.map((p, i) => (
                  <span key={i}>{p.label.split('-')[2]}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Checkout Activities Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm transition-colors flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Recent POS Orders</h3>
          
          {recentTransactions.length === 0 ? (
            <p className="text-center text-sm py-12 text-slate-500">No sale transactions registered yet</p>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px]">
              {recentTransactions.map((tx) => (
                <div key={tx._id} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/50 pb-3 last:border-b-0">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 block">{tx.invoiceNumber}</span>
                    <span className="text-[10px] text-slate-400">{tx.customer ? tx.customer.name : 'Walk-in'} | {new Date(tx.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 dark:text-white">₹{tx.grandTotal.toFixed(2)}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      tx.status === 'PAID'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : tx.status === 'PARTIAL'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
