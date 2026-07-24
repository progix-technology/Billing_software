import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { BarChart3, FileSpreadsheet, Calendar, TrendingUp, IndianRupee, ShieldAlert, Award } from 'lucide-react';

const Reports = () => {
  const [gstSummary, setGstSummary] = useState([]);
  const [profitLoss, setProfitLoss] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch GST reports
      const gstRes = await api.get('/api/reports/gst', { params: { startDate, endDate } });
      // Fetch profit & loss reports
      const plRes = await api.get('/api/reports/profit-loss', { params: { startDate, endDate } });

      if (gstRes.data.success) setGstSummary(gstRes.data.taxSummary);
      if (plRes.data.success) setProfitLoss(plRes.data.report);
    } catch (err) {
      console.error('Failed to compile reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const handleExportSales = async () => {
    try {
      const response = await api.get('/api/reports/sales/excel', {
        params: { startDate, endDate },
        responseType: 'blob'
      });
      const file = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `Sales_Report_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export sales log to Excel');
    }
  };

  const handleExportStock = async () => {
    try {
      const response = await api.get('/api/reports/stock/excel', { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', 'Stock_Value_Valuation.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export stock levels to Excel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary-500" />
            Financial Analytics & Tax Reports
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate custom period Profit & Loss balance sheets, aggregate GST returns, and compile Excel sheets.
          </p>
        </div>

        {/* Date filters */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 px-4 py-2 border border-slate-200 dark:border-slate-850 rounded-xl">
          <Calendar className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent border-0 focus:outline-none font-semibold text-slate-800 dark:text-slate-200"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent border-0 focus:outline-none font-semibold text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm">Compiling financial analytics sheets...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profit Loss Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Gross Revenue</span>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-slate-900 dark:text-white">₹{profitLoss?.totalRevenue.toFixed(2)}</p>
                <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Cost of Goods Sold (COGS)</span>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-slate-700 dark:text-slate-300">₹{profitLoss?.totalCogs.toFixed(2)}</p>
                <span className="text-xs text-slate-400 font-semibold">Purchase value</span>
              </div>
            </div>


            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Net Clean Profit</span>
              <div className="flex items-baseline justify-between">
                <p className={`text-2xl font-black ${
                  profitLoss?.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  ₹{profitLoss?.netProfit.toFixed(2)}
                </p>
                <Award className={`h-5 w-5 ${
                  profitLoss?.netProfit >= 0 ? 'text-emerald-500 animate-bounce' : 'text-red-500'
                }`} />
              </div>
            </div>
          </div>

          {/* Export Action blocks & GST Summary Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GST Summary Slab Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">GST Return Slab Tax Breakdown</h3>
              
              {gstSummary.length === 0 ? (
                <p className="text-center py-8 text-sm text-slate-500">No GST activities recorded during this period</p>
              ) : (
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs md:text-sm min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-4">Tax Slab Rate</th>
                        <th className="py-3 px-4 text-right">Taxable base (₹)</th>
                        <th className="py-3 px-4 text-right">CGST split (₹)</th>
                        <th className="py-3 px-4 text-right">SGST split (₹)</th>
                        <th className="py-3 px-4 text-right">IGST split (₹)</th>
                        <th className="py-3 px-4 text-right">Total GST Dues (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                      {gstSummary.map((slab) => (
                        <tr key={slab._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{slab._id}% Slab</td>
                          <td className="py-3 px-4 text-right">₹{slab.taxableValue.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">₹{slab.cgst.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">₹{slab.sgst.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">₹{slab.igst.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-bold text-primary-500">₹{slab.totalTax.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Excel Download Actions Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Export Spreadsheet Reports</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Export structured data tables directly as Microsoft Excel binary spreadsheets (.xlsx files) for audit uploads.
                </p>
              </div>

              <div className="space-y-4">
                {/* Export Sales */}
                <button
                  onClick={handleExportSales}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all text-sm"
                >
                  <FileSpreadsheet className="h-5 w-5" /> Export Sales Ledger Excel
                </button>

                {/* Export Stock */}
                <button
                  onClick={handleExportStock}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl border border-slate-700/50 shadow-md transition-all text-sm"
                >
                  <FileSpreadsheet className="h-5 w-5" /> Export Stock Value Excel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
