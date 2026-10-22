import React, { useState, useEffect } from 'react';
import api from '../api';
import { Key, Search, Copy, Check, RotateCw, AlertTriangle, ShieldCheck } from 'lucide-react';

const Licenses = () => {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/licenses');
      if (res.data.success) {
        setLicenses(res.data.licenses);
      }
    } catch (err) {
      console.error('Failed to fetch licenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const copyKey = (key, id) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleRevoke = async (lic) => {
    const action = lic.status === 'active' ? 'revoke / block' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${action} this license?`)) return;

    try {
      await api.put(`/licenses/${lic._id}/revoke`);
      fetchLicenses();
    } catch (err) {
      alert('Failed to update license status');
    }
  };

  const filtered = licenses.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.licenseKey?.toLowerCase().includes(q) ||
      l.machineId?.toLowerCase().includes(q) ||
      l.issuedTo?.toLowerCase().includes(q) ||
      l.phone?.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Key className="h-6 w-6 text-indigo-400" />
            <span>Issued License Keys Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete cryptographic audit trail of all generated activation keys and hardware bindings.
          </p>
        </div>

        <button
          onClick={fetchLicenses}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold self-start sm:self-auto"
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by key, machine ID, client name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading license registry...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No licenses matching criteria found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">License Key</th>
                  <th className="py-3 px-4">Hardware Binding (Machine ID)</th>
                  <th className="py-3 px-4">Issued To</th>
                  <th className="py-3 px-4">Plan & Expiry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-normal">
                {filtered.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                      <button
                        onClick={() => copyKey(l.licenseKey, l._id)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 hover:border-slate-700"
                      >
                        <span>{l.licenseKey}</span>
                        {copiedId === l._id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-slate-500" />}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {l.machineId}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">{l.issuedTo || 'Direct Sale'}</p>
                      {l.phone && <p className="text-[10px] text-slate-500">{l.phone}</p>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-indigo-400">{l.planName}</span>
                      <p className="text-[10px] text-slate-400">
                        Expires: {new Date(l.expiryDate).toLocaleDateString()}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        l.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {l.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRevoke(l)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                          l.status === 'active'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                      >
                        {l.status === 'active' ? 'Block Key' : 'Unblock'}
                      </button>
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

export default Licenses;
