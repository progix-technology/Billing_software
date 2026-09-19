import React, { useEffect, useState } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { LayoutDashboard, TrendingUp, IndianRupee, Users, Package, AlertTriangle, AlertCircle, RefreshCw, FileText, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton, Stack } from '../components/UI/Skeleton';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('7d');
  const { settings } = useSettings();
  const { user } = useAuth();

  const fetchDashboardData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setChartLoading(true);

    try {
      const res = await api.get(`/api/dashboard/stats?timeframe=${timeframe}`);
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentTransactions(res.data.recentTransactions);
        setChartData(res.data.chartData);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics', err);
    } finally {
      if (!isBackground) setLoading(false);
      else setChartLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When timeframe changes, only refresh the chart (background load)
  useEffect(() => {
    if (!loading) {
      fetchDashboardData(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Stack spacing={2} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <Skeleton variant="text" style={{ fontSize: '2rem' }} width="40%" />
          <Skeleton variant="text" style={{ fontSize: '1rem' }} width="20%" />
        </Stack>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={130} className="rounded-xl border border-slate-200 shadow-sm bg-white" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton variant="rectangular" height={320} className="lg:col-span-2 rounded-2xl border border-slate-200 shadow-sm bg-white" />
          <Skeleton variant="rectangular" height={320} className="rounded-2xl border border-slate-200 shadow-sm bg-white" />
        </div>
      </div>
    );
  }

  // Draw mountain chart with smooth bezier curves and multi-layered ridges
  const maxSales = chartData.length > 0 ? Math.max(...chartData.map(d => d.sales), 1000) : 1000;
  const svgWidth = 500;
  const svgHeight = 150;
  const padding = 20;

  const points = chartData.map((d, index) => {
    const x = padding + (index * (svgWidth - padding * 2)) / (chartData.length - 1 || 1);
    const y = svgHeight - padding - (d.sales * (svgHeight - padding * 2.2)) / maxSales;
    return { x, y, label: d._id, sales: d.sales };
  });

  // Background mountain layer (secondary elevation)
  const bgPoints = chartData.map((d, index) => {
    const x = padding + (index * (svgWidth - padding * 2)) / (chartData.length - 1 || 1);
    const y = svgHeight - padding - (d.sales * 0.6 * (svgHeight - padding * 2.2)) / maxSales - 6;
    return { x, y };
  });

  // Smooth Bezier Curve generator for natural mountain contour
  const getSmoothPath = (pts) => {
    if (!pts || pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
    if (pts.length === 2) return `M ${pts[0].x},${pts[0].y} L ${pts[1].x},${pts[1].y}`;

    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 5;
      const cp1y = p1.y + (p2.y - p0.y) / 5;
      const cp2x = p2.x - (p3.x - p1.x) / 5;
      const cp2y = p2.y - (p3.y - p1.y) / 5;

      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const mainRidgePath = getSmoothPath(points);
  const mainMountainArea = points.length > 0
    ? `${mainRidgePath} L ${points[points.length - 1].x},${svgHeight - padding} L ${points[0].x},${svgHeight - padding} Z`
    : '';

  const bgRidgePath = getSmoothPath(bgPoints);
  const bgMountainArea = bgPoints.length > 0
    ? `${bgRidgePath} L ${bgPoints[bgPoints.length - 1].x},${svgHeight - padding} L ${bgPoints[0].x},${svgHeight - padding} Z`
    : '';

  return (
    <div className="space-y-6">

      {/* Top Section: Banner + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
        {/* Left: Welcome Banner */}
        <div
          className="lg:col-span-3 rounded-xl px-5 py-4 text-white shadow-sm flex flex-col justify-center relative overflow-hidden"
          style={
            settings?.dashboardBanner
              ? { backgroundImage: `url(${settings.dashboardBanner})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }
          }
        >
          {/* Dark overlay when image is set */}
          {settings?.dashboardBanner && (
            <div className="absolute inset-0 bg-black/40 rounded-xl" />
          )}
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-1">Welcome back, {user?.username || 'Administrator'}!</h2>
            <p className="text-blue-100 text-xs mb-4 max-w-md">
              Here's what's happening with your store today.
            </p>
            <Link to="/billing" className="inline-flex items-center bg-white text-blue-600 font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors text-xs w-max">
              Start New Billing <span className="ml-2">→</span>
            </Link>
          </div>
          {/* Decorative elements (only when no image) */}
          {!settings?.dashboardBanner && (
            <>
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -top-8 right-8 w-24 h-24 bg-blue-400/20 rounded-full blur-xl"></div>
            </>
          )}
        </div>

        {/* Right: Grid metrics cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-2">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm flex flex-col relative">
          <div className="flex justify-between items-start mb-1">
            <div className="h-6 w-6 rounded-md bg-blue-50 flex items-center justify-center">
              <BarChart3 className="h-3 w-3 text-blue-600" />
            </div>
          </div>
          <span className="text-[9px] font-semibold text-slate-500 mb-0.5">Gross Turnover</span>
          <p className="text-base font-bold text-slate-900 mb-0.5 leading-tight">
            ₹{stats?.totalSales.toFixed(2)}
          </p>
          <Link to="/reports" className="mt-auto text-[9px] font-medium text-blue-600 flex items-center">
            View details <span className="ml-1">→</span>
          </Link>
        </div>

        {/* Today's Sales */}
        <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm flex flex-col relative">
          <div className="flex justify-between items-start mb-1">
            <div className="h-6 w-6 rounded-md bg-emerald-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <span className="text-[9px] font-semibold text-slate-500 mb-0.5">Today's Sales</span>
          <p className="text-base font-bold text-slate-900 mb-0.5 leading-tight">
            ₹{stats?.todaySales.toFixed(2)}
          </p>
          <Link to="/billing" className="mt-auto text-[9px] font-medium text-blue-600 flex items-center">
            View details <span className="ml-1">→</span>
          </Link>
        </div>

        {/* Pending customer payments */}
        <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm flex flex-col relative">
          <div className="flex justify-between items-start mb-1">
            <div className="h-6 w-6 rounded-md bg-rose-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <span className="text-[9px] font-semibold text-slate-500 mb-0.5">Outstanding Dues</span>
          <p className="text-base font-bold text-slate-900 mb-0.5 leading-tight">
            ₹{stats?.pendingPayments.toFixed(2)}
          </p>
          <Link to="/customers" className="mt-auto text-[9px] font-medium text-blue-600 flex items-center">
            View details <span className="ml-1">→</span>
          </Link>
        </div>

        {/* Inventory low stock alerts count */}
        <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm flex flex-col relative">
          <div className="flex justify-between items-start mb-1">
            <div className="h-6 w-6 rounded-md bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
            </div>
          </div>
          <span className="text-[9px] font-semibold text-slate-500 mb-0.5">Stock Alerts</span>
          <p className="text-base font-bold text-slate-900 mb-0.5 leading-tight">
            {stats?.lowStockCount} Products
          </p>
          <Link to="/products" className="mt-auto text-[9px] font-medium text-blue-600 flex items-center">
            View products <span className="ml-1">→</span>
          </Link>
        </div>
        </div>
      </div>

      {/* Analytics Graph & Activity tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales charts (Line Graph) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600 p-0.5 bg-blue-50 rounded" />
                Sales Overview
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Total sales and invoice count for the selected period</p>
            </div>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="text-sm text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 outline-none cursor-pointer hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-blue-100"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="12m">Yearly</option>
            </select>
          </div>
          
          {chartData.length === 0 ? (
            <div className={`flex-1 flex flex-col items-center justify-center py-12 transition-opacity duration-300 ${chartLoading ? 'opacity-50' : 'opacity-100'}`}>
              <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                <BarChart3 className="h-6 w-6 text-slate-400" />
              </div>
              <h4 className="text-slate-800 font-bold mb-1">No sales data yet</h4>
              <p className="text-slate-500 text-[13px] mb-6">Create your first invoice to start tracking sales.</p>
              <Link
                to="/billing"
                className="px-5 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <span className="text-lg leading-none">+</span> Create Invoice
              </Link>
            </div>
          ) : (
            <div className={`flex-1 flex flex-col justify-between transition-opacity duration-300 ${chartLoading ? 'opacity-50' : 'opacity-100'}`}>
              {/* SVG Vector Render - Mountain Chart */}
              <div className="w-full">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48 overflow-visible">
                  {/* Defs for Mountain Gradients & Filters */}
                  <defs>
                    {/* Foreground Mountain Gradient */}
                    <linearGradient id="mountainFrontGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.45" />
                      <stop offset="50%" stopColor="#6366F1" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Background Mountain Ridge Gradient */}
                    <linearGradient id="mountainBackGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818CF8" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#C7D2FE" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Mountain Ridge Stroke Gradient */}
                    <linearGradient id="mountainRidgeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="50%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#2563EB" />
                    </linearGradient>

                    {/* Secondary Ridge Stroke */}
                    <linearGradient id="bgRidgeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>

                  {/* Elevation / Grid Lines */}
                  <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#E2E8F0" strokeWidth="1.5" />

                  {/* Background Mountain Layer (Secondary Peaks) */}
                  {bgMountainArea && (
                    <path
                      d={bgMountainArea}
                      fill="url(#mountainBackGrad)"
                    />
                  )}
                  {bgRidgePath && (
                    <path
                      d={bgRidgePath}
                      fill="none"
                      stroke="url(#bgRidgeGrad)"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                  )}

                  {/* Foreground Mountain Layer (Main Ridge & Peaks) */}
                  {mainMountainArea && (
                    <path
                      d={mainMountainArea}
                      fill="url(#mountainFrontGrad)"
                    />
                  )}
                  {mainRidgePath && (
                    <path
                      d={mainRidgePath}
                      fill="none"
                      stroke="url(#mountainRidgeGrad)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Mountain Summit Peak Points & Interactive Tooltips */}
                  {points.map((p, i) => (
                    <g key={i} className="group cursor-pointer">
                      {/* Vertical Elevation Guide Line on Hover */}
                      <line
                        x1={p.x}
                        y1={p.y}
                        x2={p.x}
                        y2={svgHeight - padding}
                        stroke="#93C5FD"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />

                      {/* Glowing Peak Halo Aura */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="8"
                        fill="#3B82F6"
                        fillOpacity="0.2"
                        className="opacity-0 group-hover:opacity-100 transition-all scale-100 group-hover:scale-125 origin-center"
                      />

                      {/* Peak Point Circle */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill="white"
                        stroke="#2563EB"
                        strokeWidth="2.5"
                        className="transition-transform group-hover:scale-125"
                      />

                      {/* Peak Tooltip Pill Badge */}
                      <g className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                        <rect
                          x={Math.max(padding, Math.min(svgWidth - padding - 64, p.x - 32))}
                          y={Math.max(2, p.y - 30)}
                          width="64"
                          height="22"
                          rx="6"
                          fill="#1E293B"
                          className="filter drop-shadow-md"
                        />
                        <polygon
                          points={`${p.x - 4},${Math.max(2, p.y - 30) + 22} ${p.x + 4},${Math.max(2, p.y - 30) + 22} ${p.x},${Math.max(2, p.y - 30) + 26}`}
                          fill="#1E293B"
                        />
                        <text
                          x={Math.max(padding, Math.min(svgWidth - padding - 64, p.x - 32)) + 32}
                          y={Math.max(2, p.y - 30) + 15}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          className="font-bold text-[10px]"
                        >
                          ₹{p.sales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </text>
                      </g>
                    </g>
                  ))}
                </svg>
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between px-4 text-[11px] text-slate-500 mt-4">
                {points.map((p, i) => {
                  let displayLabel = p.label;
                  const parts = p.label.split('-');
                  if (parts.length === 3) {
                    displayLabel = parts[2]; // Day
                  } else if (parts.length === 2) {
                    const date = new Date(parts[0], parseInt(parts[1]) - 1);
                    displayLabel = date.toLocaleString('default', { month: 'short' });
                  }
                  
                  // For 30d view, skip intermediate labels so they don't overlap
                  if (points.length > 15 && i % 5 !== 0 && i !== points.length - 1) {
                    return <span key={i} className="invisible w-0" />;
                  }
                  return <span key={i}>{displayLabel}</span>;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Recent Checkout Activities Panel */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 p-0.5 bg-blue-50 rounded" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Recent POS Orders
            </h3>
            <Link to="/reports" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
              View All Orders <span className="ml-1">→</span>
            </Link>
          </div>
          
          {recentTransactions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <p className="text-slate-500 text-sm">No recent orders</p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-[13px] whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5 rounded-l-lg">Invoice</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                    <th className="px-4 py-2.5 text-center rounded-r-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {recentTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">{tx.invoiceNumber}</td>
                      <td className="px-4 py-3 text-slate-500">{tx.customer ? tx.customer.name : 'Walk-in'}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right">₹{tx.grandTotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                          tx.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-600'
                            : tx.status === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-rose-50 text-rose-600'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row (Top Selling & Low Stock) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* Top Selling Products */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3 items-center">
              <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.286 1.05A3.981 3.981 0 0115 15a3.981 3.981 0 01-2.666-1.019 1 1 0 01-.286-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.286 1.05A3.981 3.981 0 015 15a3.981 3.981 0 01-2.666-1.019 1 1 0 01-.286-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">Top Selling Products</h3>
                <p className="text-[11px] text-slate-500">Best performing products by quantity sold</p>
              </div>
            </div>
            <Link to="/reports" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
              View All <span className="ml-1">→</span>
            </Link>
          </div>
          
          <div className="flex-1 overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-2.5 rounded-l-lg w-10">#</th>
                  <th className="px-4 py-2.5">Product</th>
                  <th className="px-4 py-2.5 text-center">Quantity Sold</th>
                  <th className="px-4 py-2.5 text-right rounded-r-lg">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {stats?.topSellingProducts && stats.topSellingProducts.length > 0 ? (
                  stats.topSellingProducts.map((p, idx) => (
                    <tr key={p._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">{p.name}</td>
                      <td className="px-4 py-3 text-center">{p.quantitySold}</td>
                      <td className="px-4 py-3 text-right">₹{p.revenue.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  // Empty state rows matching screenshot
                  [...Array(5)].map((_, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">{idx === 0 ? 'Sample Product' : '—'}</td>
                      <td className="px-4 py-3 text-center">0</td>
                      <td className="px-4 py-3 text-right">₹0.00</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3 items-center">
              <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">Low Stock Products</h3>
                <p className="text-[11px] text-slate-500">Products that are below their critical stock level</p>
              </div>
            </div>
            <Link to="/products" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
              View All <span className="ml-1">→</span>
            </Link>
          </div>

          {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
            <div className="flex-1 overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-[13px] whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5 rounded-l-lg w-10">#</th>
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5 text-center">Current Stock</th>
                    <th className="px-4 py-2.5 text-center rounded-r-lg">Alert At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {stats.lowStockProducts.map((p, idx) => (
                    <tr key={p._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">{p.name}</td>
                      <td className="px-4 py-3 text-center text-rose-600 font-bold">{p.stockQuantity}</td>
                      <td className="px-4 py-3 text-center">{p.minStockLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-10">
              <Package className="h-10 w-10 text-slate-300 mb-3" />
              <h4 className="text-slate-800 font-semibold text-sm">No low stock products</h4>
              <p className="text-slate-500 text-xs mt-1">All products are above the minimum stock level.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
