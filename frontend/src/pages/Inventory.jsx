import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { History, Search, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';

const Inventory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/products/inventory/logs');
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Failed to load inventory logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.product?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.product?.sku || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.referenceId || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter ? log.type === typeFilter : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="h-6 w-6 text-primary-500" />
          Stock Activity Audit Trail
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review stock transactions, purchases, POS order deductions, and manual level alterations.
        </p>
      </div>

      {/* Logs Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-300">
        {/* Table Filter Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search product, SKU, reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary-500 text-slate-800 dark:text-slate-200 transition-colors"
              />
            </div>

            {/* Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary-500 text-slate-800 dark:text-slate-200 transition-colors"
            >
              <option value="">All Transactions</option>
              <option value="IN">Stock Inward (Purchases/Returns)</option>
              <option value="OUT">Stock Outward (Sales Checkout)</option>
              <option value="ADJUSTMENT">Manual Stock Audits</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto" />
            <p className="mt-3 text-sm">Compiling audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <History className="h-10 w-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm">No inventory activity log found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6 text-right">Quantity</th>
                  <th className="py-4 px-6 text-right">Previous Stock</th>
                  <th className="py-4 px-6 text-right">Current Stock</th>
                  <th className="py-4 px-6">Reference Ref</th>
                  <th className="py-4 px-6">Cashier / Executed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300">
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      {log.product ? (
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{log.product.name}</p>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                            SKU: {log.product.sku}
                          </span>
                        </div>
                      ) : (
                        <p className="text-red-500 font-semibold italic">Deleted Product</p>
                      )}
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      {log.type === 'IN' && (
                        <span className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs">
                          <ArrowUpCircle className="h-3.5 w-3.5" /> Inward
                        </span>
                      )}
                      {log.type === 'OUT' && (
                        <span className="inline-flex items-center gap-1 text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full text-xs">
                          <ArrowDownCircle className="h-3.5 w-3.5" /> Outward
                        </span>
                      )}
                      {log.type === 'ADJUSTMENT' && (
                        <span className="inline-flex items-center gap-1 text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full text-xs">
                          <AlertTriangle className="h-3.5 w-3.5" /> Adjustment
                        </span>
                      )}
                    </td>
                    <td className={`py-4 px-6 text-right font-bold ${
                      log.type === 'IN' ? 'text-emerald-500' : log.type === 'OUT' ? 'text-red-500' : 'text-blue-500'
                    }`}>
                      {log.type === 'OUT' ? `-${log.quantity}` : `+${log.quantity}`}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-slate-500 dark:text-slate-400">{log.previousStock}</td>
                    <td className="py-4 px-6 text-right font-mono font-semibold text-slate-900 dark:text-white">{log.currentStock}</td>
                    <td className="py-4 px-6">
                      <p className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{log.referenceId}</p>
                      <p className="text-xs text-slate-400">{log.remarks}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-semibold capitalize">
                      {log.user ? log.user.username : 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
