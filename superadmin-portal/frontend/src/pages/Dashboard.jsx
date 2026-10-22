import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Building2, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Key, 
  Copy, 
  Check, 
  Search, 
  ShieldCheck, 
  Share2, 
  Calendar, 
  PhoneCall,
  Sparkles,
  AlertTriangle,
  RotateCw,
  Power,
  Trash2,
  Loader2,
  ExternalLink
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQuickGenOpen, setIsQuickGenOpen] = useState(false);
  const [onboardedResult, setOnboardedResult] = useState(null);

  // Add Tenant Form State
  const [newTenant, setNewTenant] = useState({
    businessName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    machineId: '',
    plan: 'Gold',
    durationDays: 365,
    notes: ''
  });
  const [addLoading, setAddLoading] = useState(false);

  // Quick Gen Form State
  const [quickGen, setQuickGen] = useState({
    machineId: '',
    planName: 'Gold',
    durationDays: 365,
    issuedTo: '',
    phone: '',
    notes: ''
  });
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickResult, setQuickResult] = useState(null);

  // Renew Modal State
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedTenantForRenew, setSelectedTenantForRenew] = useState(null);
  const [renewDays, setRenewDays] = useState(365);
  const [renewLoading, setRenewLoading] = useState(false);

  // Copied state
  const [copiedId, setCopiedId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, tenantsRes, pkgsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/tenants'),
        api.get('/packages')
      ]);

      if (statsRes.data.success) setStats(statsRes.data);
      if (tenantsRes.data.success) setTenants(tenantsRes.data.tenants);
      if (pkgsRes.data.success) setPackages(pkgsRes.data.packages);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2500);
  };

  // Handle Add Tenant Submit
  const handleAddTenant = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await api.post('/tenants', newTenant);
      if (res.data.success) {
        setOnboardedResult(res.data);
        setIsAddModalOpen(false);
        setNewTenant({
          businessName: '',
          contactPerson: '',
          contactPhone: '',
          contactEmail: '',
          address: '',
          machineId: '',
          plan: 'Gold',
          durationDays: 365,
          notes: ''
        });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create tenant');
    } finally {
      setAddLoading(false);
    }
  };

  // Handle Quick License Generation
  const handleQuickGen = async (e) => {
    e.preventDefault();
    setQuickLoading(true);
    try {
      const res = await api.post('/licenses/generate', quickGen);
      if (res.data.success) {
        setQuickResult(res.data);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate key');
    } finally {
      setQuickLoading(false);
    }
  };

  // Handle Renew Tenant
  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTenantForRenew) return;
    setRenewLoading(true);
    try {
      const res = await api.post(`/tenants/${selectedTenantForRenew._id}/renew`, {
        durationDays: renewDays,
        plan: selectedTenantForRenew.plan,
        machineId: selectedTenantForRenew.machineId
      });
      if (res.data.success) {
        alert(`License renewed! New Key: ${res.data.licenseKey}`);
        setRenewModalOpen(false);
        setSelectedTenantForRenew(null);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Renew failed');
    } finally {
      setRenewLoading(false);
    }
  };

  // Toggle Suspend Status
  const handleToggleStatus = async (tenant) => {
    const action = tenant.status === 'active' ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${tenant.businessName}?`)) return;

    try {
      await api.put(`/tenants/${tenant._id}/status`, {
        status: tenant.status === 'active' ? 'suspended' : 'active'
      });
      fetchData();
    } catch (err) {
      alert('Status update failed');
    }
  };

  // Delete Tenant
  const handleDeleteTenant = async (id, name) => {
    if (!window.confirm(`Permanently delete store "${name}"?`)) return;
    try {
      await api.delete(`/tenants/${id}`);
      fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.businessName?.toLowerCase().includes(q) ||
      t.contactPhone?.includes(q) ||
      t.machineId?.toLowerCase().includes(q) ||
      t.licenseKey?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Client Stores & Subscriptions</span>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold">
              Live Cloud
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time management for all desktop billing installations across India.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setQuickResult(null);
              setIsQuickGenOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all shadow-sm"
          >
            <Key className="h-4 w-4 text-amber-400" />
            <span>Quick License Gen</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Client Store</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Stores</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats?.stats?.totalTenants ?? '—'}</p>
          <span className="text-[10px] text-slate-500 font-semibold block mt-1">All registered clients</span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Licenses</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{stats?.stats?.activeTenants ?? '—'}</p>
          <span className="text-[10px] text-emerald-500/80 font-semibold block mt-1">Operational & Paid</span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suspended</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">{stats?.stats?.suspendedTenants ?? '0'}</p>
          <span className="text-[10px] text-rose-500/80 font-semibold block mt-1">Blocked / Unpaid</span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expiring in 7 Days</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{stats?.stats?.expiringSoonCount ?? '0'}</p>
          <span className="text-[10px] text-amber-500/80 font-semibold block mt-1">Renewal follow-up required</span>
        </div>
      </div>

      {/* Expiring Soon Alert Banner */}
      {stats?.expiringSoon && stats.expiringSoon.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Upcoming Expirations ({stats.expiringSoon.length} Stores Expiring in 7 Days)
            </h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {stats.expiringSoon.map((st) => (
                <div key={st._id} className="bg-amber-900/40 border border-amber-700/50 px-3 py-1.5 rounded-xl text-xs text-amber-200 flex items-center gap-2">
                  <span className="font-bold">{st.businessName}</span>
                  <span className="text-[10px] text-amber-300/80">({st.contactPhone})</span>
                  <button
                    onClick={() => {
                      setSelectedTenantForRenew(st);
                      setRenewModalOpen(true);
                    }}
                    className="ml-1 text-[10px] px-2 py-0.5 bg-amber-500 text-slate-950 font-black rounded hover:bg-amber-400"
                  >
                    Renew
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stores List Card */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        {/* Table Top Toolbar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search store name, phone, machine ID, key..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold self-end sm:self-auto"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
            <p className="mt-2 text-xs">Loading client stores from MongoDB Atlas...</p>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building2 className="h-10 w-10 mx-auto text-slate-700 mb-2" />
            <p className="text-sm font-bold text-slate-300">No client stores found</p>
            <p className="text-xs text-slate-500 mt-0.5">Click "Add Client Store" to onboard your first shop.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Store / Client</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Plan & Validity</th>
                  <th className="py-3 px-4">Machine ID</th>
                  <th className="py-3 px-4">License Key</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-normal">
                {filteredTenants.map((t) => {
                  const isValid = new Date(t.validTill) > new Date();
                  const isExpiringSoon = isValid && (new Date(t.validTill) - new Date()) / (1000 * 60 * 60 * 24) <= 7;

                  return (
                    <tr key={t._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-[10px]">
                            {t.businessName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="block">{t.businessName}</span>
                            {t.contactPerson && <span className="text-[10px] text-slate-500 font-normal">{t.contactPerson}</span>}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-slate-200">{t.contactPhone || '—'}</p>
                        <p className="text-[10px] text-slate-500">{t.contactEmail}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
                          {t.plan || 'Gold'}
                        </span>
                        <p className={`text-[11px] font-semibold ${!isValid ? 'text-rose-400 font-bold' : isExpiringSoon ? 'text-amber-400' : 'text-slate-400'}`}>
                          Till: {new Date(t.validTill).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {t.machineId || 'ANYPC000'}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {t.licenseKey ? (
                          <button
                            onClick={() => copyToClipboard(t.licenseKey, t._id)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-indigo-300 font-bold"
                          >
                            <span>{t.licenseKey}</span>
                            {copiedId === t._id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-slate-500" />}
                          </button>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          t.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {t.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Renew / Extend License"
                            onClick={() => {
                              setSelectedTenantForRenew(t);
                              setRenewModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                          </button>

                          <button
                            title={t.status === 'active' ? 'Suspend Store' : 'Reactivate Store'}
                            onClick={() => handleToggleStatus(t)}
                            className={`p-1.5 rounded-lg border ${
                              t.status === 'active'
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>

                          <button
                            title="Delete Store"
                            onClick={() => handleDeleteTenant(t._id, t.businessName)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* ADD CLIENT STORE MODAL */}
      {/* =================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-white mb-1">Onboard New Client Store</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter client details. A cryptographically signed license key will be auto-generated.
            </p>

            <form onSubmit={handleAddTenant} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Business / Store Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharma Electronics & Retail"
                  value={newTenant.businessName}
                  onChange={(e) => setNewTenant({ ...newTenant, businessName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newTenant.contactPhone}
                    onChange={(e) => setNewTenant({ ...newTenant, contactPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Owner Name"
                    value={newTenant.contactPerson}
                    onChange={(e) => setNewTenant({ ...newTenant, contactPerson: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Client Hardware Machine ID (from their software)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PRGX-8A2F-9C1D-4E7B (Leave blank for universal ANYPC)"
                  value={newTenant.machineId}
                  onChange={(e) => setNewTenant({ ...newTenant, machineId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Plan Tier</label>
                  <select
                    value={newTenant.plan}
                    onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Silver">Silver (Starter)</option>
                    <option value="Gold">Gold (Enterprise)</option>
                    <option value="Diamond">Diamond (Premium)</option>
                    <option value="Lifetime">Permanent Lifetime</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Validity Duration</label>
                  <select
                    value={newTenant.durationDays}
                    onChange={(e) => setNewTenant({ ...newTenant, durationDays: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="30">30 Days (1 Month)</option>
                    <option value="90">90 Days (3 Months)</option>
                    <option value="180">180 Days (6 Months)</option>
                    <option value="365">365 Days (1 Year)</option>
                    <option value="730">730 Days (2 Years)</option>
                    <option value="36500">Permanent Lifetime</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Create & Generate Key</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ONBOARDED SUCCESS MODAL (WHATSAPP SHAREABLE CARD) */}
      {/* =================================================================== */}
      {onboardedResult && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="text-center pb-3">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-2">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-white">Store Successfully Onboarded!</h3>
              <p className="text-xs text-slate-400">Share this activation key with the client.</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2.5 my-4 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Store:</span>
                <span className="font-bold text-white font-sans">{onboardedResult.tenant.businessName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Plan:</span>
                <span className="text-indigo-400 font-bold">{onboardedResult.tenant.plan}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Valid Till:</span>
                <span className="text-emerald-400 font-bold">
                  {new Date(onboardedResult.validTill).toLocaleDateString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1 font-sans">Activation License Key:</span>
                <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-800/60 p-2.5 rounded-xl">
                  <span className="text-indigo-300 font-bold text-sm tracking-wider">{onboardedResult.licenseKey}</span>
                  <button
                    onClick={() => copyToClipboard(onboardedResult.licenseKey, 'new-key')}
                    className="p-1 rounded bg-indigo-600 text-white"
                  >
                    {copiedId === 'new-key' ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const message = `Hello *${onboardedResult.tenant.businessName}*,\n\nYour PRO Billing Software License is ready!\n\n🔑 *Activation Key:* \`${onboardedResult.licenseKey}\`\n📅 *Validity Till:* ${new Date(onboardedResult.validTill).toLocaleDateString()}\n📦 *Plan:* ${onboardedResult.tenant.plan}\n\nPlease enter this key inside your Billing Software to activate.\nThank you!`;
                  navigator.clipboard.writeText(message);
                  alert('WhatsApp share text copied to clipboard!');
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Share2 className="h-4 w-4" />
                <span>Copy for WhatsApp</span>
              </button>
              <button
                onClick={() => setOnboardedResult(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* QUICK STANDALONE LICENSE GENERATOR MODAL */}
      {/* =================================================================== */}
      {isQuickGenOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-400" />
              <span>Instant License Key Generator</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Paste client's Machine ID from WhatsApp to generate an instant license key.
            </p>

            <form onSubmit={handleQuickGen} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Client Machine ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PRGX-776E-AB6E-25E9"
                  value={quickGen.machineId}
                  onChange={(e) => setQuickGen({ ...quickGen, machineId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Client / Store Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gupta General Store"
                  value={quickGen.issuedTo}
                  onChange={(e) => setQuickGen({ ...quickGen, issuedTo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Plan</label>
                  <select
                    value={quickGen.planName}
                    onChange={(e) => setQuickGen({ ...quickGen, planName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Diamond">Diamond</option>
                    <option value="Lifetime">Permanent Lifetime</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Duration</label>
                  <select
                    value={quickGen.durationDays}
                    onChange={(e) => setQuickGen({ ...quickGen, durationDays: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="180">180 Days</option>
                    <option value="365">1 Year (365 Days)</option>
                    <option value="36500">Permanent Lifetime</option>
                  </select>
                </div>
              </div>

              {quickResult && (
                <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl mt-3">
                  <span className="text-[10px] text-emerald-400 font-bold block mb-1">Generated License Key:</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-white select-all">{quickResult.licenseKey}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(quickResult.licenseKey, 'quick-res')}
                      className="p-1 rounded bg-emerald-600 text-white"
                    >
                      {copiedId === 'quick-res' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickGenOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={quickLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2"
                >
                  {quickLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Generate Key</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 1-CLICK RENEW MODAL */}
      {/* =================================================================== */}
      {renewModalOpen && selectedTenantForRenew && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-white mb-1">
              Renew License: {selectedTenantForRenew.businessName}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Extend validity. The desktop app will automatically pick this up on next verification.
            </p>

            <form onSubmit={handleRenewSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Extend Validity By</label>
                <select
                  value={renewDays}
                  onChange={(e) => setRenewDays(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="30">30 Days (1 Month)</option>
                  <option value="90">90 Days (3 Months)</option>
                  <option value="180">180 Days (6 Months)</option>
                  <option value="365">365 Days (1 Full Year)</option>
                  <option value="730">730 Days (2 Years)</option>
                  <option value="36500">Permanent Lifetime</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRenewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renewLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  {renewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Confirm & Renew</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
