import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { 
  Building2, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Edit, 
  Key, 
  Copy, 
  Check, 
  Search, 
  ShieldCheck, 
  Share2, 
  Calendar, 
  PhoneCall,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Skeleton, Stack } from '../components/UI/Skeleton';

const SuperAdminDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState(null);
  const [isAdminsModalOpen, setIsAdminsModalOpen] = useState(false);
  const [selectedTenantForAdmins, setSelectedTenantForAdmins] = useState(null);
  const [newPasswords, setNewPasswords] = useState({});

  // License Modal for individual tenant
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [selectedTenantForLicense, setSelectedTenantForLicense] = useState(null);
  const [licenseMachineId, setLicenseMachineId] = useState('');
  const [licensePlan, setLicensePlan] = useState('Gold');
  const [licenseDuration, setLicenseDuration] = useState('365');
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [generatedLicenseResult, setGeneratedLicenseResult] = useState(null);

  // Success Welcome Modal (after onboarding new tenant)
  const [onboardedResult, setOnboardedResult] = useState(null);

  // Quick Standalone License Key Generator
  const [isQuickGenOpen, setIsQuickGenOpen] = useState(false);
  const [quickMachineId, setQuickMachineId] = useState('ANYPC000');
  const [quickStoreName, setQuickStoreName] = useState('');
  const [quickAdminEmail, setQuickAdminEmail] = useState('');
  const [quickAdminPassword, setQuickAdminPassword] = useState('');
  const [quickAdminUsername, setQuickAdminUsername] = useState('');
  const [quickPlan, setQuickPlan] = useState('Gold');
  const [quickDuration, setQuickDuration] = useState('365');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickResult, setQuickResult] = useState(null);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState('');

  // Form State for Onboarding
  const [formData, setFormData] = useState({
    businessName: '',
    contactEmail: '',
    contactPhone: '',
    plan: 'Gold',
    durationDays: '365',
    machineId: '',
    adminUsername: '',
    adminEmail: '',
    adminPassword: ''
  });

  const [editFormData, setEditFormData] = useState({
    businessName: '',
    contactEmail: '',
    contactPhone: '',
    plan: 'Gold',
    status: 'active',
    machineId: '',
    validTill: ''
  });

  useEffect(() => {
    fetchTenants();
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await api.get('/api/packages');
      setPackages(res.data.packages.filter(p => p.isActive));
    } catch (err) {
      console.error('Failed to load packages', err);
    }
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/tenants');
      setTenants(res.data.tenants || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load tenants';
      setError(errorMessage);
      console.error('Tenant fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'machineId' ? value.toUpperCase().trim() : value 
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'machineId' ? value.toUpperCase().trim() : value 
    }));
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/tenants', formData);
      if (res.data.success) {
        setIsModalOpen(false);
        setOnboardedResult({
          businessName: formData.businessName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          machineId: formData.machineId || res.data.tenant?.machineId || '',
          licenseKey: res.data.licenseKey || res.data.tenant?.licenseKey || '',
          plan: formData.plan,
          validTill: res.data.validTill || res.data.tenant?.validTill
        });

        // Reset form
        setFormData({
          businessName: '',
          contactEmail: '',
          contactPhone: '',
          plan: 'Gold',
          durationDays: '365',
          machineId: '',
          adminUsername: '',
          adminEmail: '',
          adminPassword: ''
        });

        fetchTenants();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create tenant');
    }
  };

  const openEditModal = (tenant) => {
    setEditingTenantId(tenant._id);
    setEditFormData({
      businessName: tenant.businessName || '',
      contactEmail: tenant.contactEmail || '',
      contactPhone: tenant.contactPhone || '',
      plan: tenant.plan || 'Gold',
      status: tenant.status || 'active',
      machineId: tenant.machineId || '',
      validTill: tenant.validTill ? new Date(tenant.validTill).toISOString().split('T')[0] : ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/tenants/${editingTenantId}`, editFormData);
      setIsEditModalOpen(false);
      fetchTenants();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update tenant');
    }
  };

  // License Modal Handlers
  const openLicenseModal = (tenant) => {
    setSelectedTenantForLicense(tenant);
    setLicenseMachineId(tenant.machineId || '');
    setLicensePlan(tenant.plan || 'Gold');
    setLicenseDuration('365');
    setGeneratedLicenseResult(null);
    setIsLicenseModalOpen(true);
  };

  const handleGenerateTenantLicense = async (e) => {
    e.preventDefault();
    if (!licenseMachineId) {
      alert('Please enter client Machine Hardware ID');
      return;
    }

    setLicenseLoading(true);
    try {
      const res = await api.post(`/api/tenants/${selectedTenantForLicense._id}/license`, {
        machineId: licenseMachineId,
        plan: licensePlan,
        durationDays: parseInt(licenseDuration, 10),
      });

      if (res.data.success) {
        setGeneratedLicenseResult({
          licenseKey: res.data.licenseKey,
          machineId: licenseMachineId,
          plan: licensePlan,
          validTill: res.data.validTill
        });
        fetchTenants();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate license key');
    } finally {
      setLicenseLoading(false);
    }
  };

  // Quick Key Generator Handler
  const handleQuickGenerate = async (e) => {
    e.preventDefault();
    setQuickLoading(true);
    try {
      const res = await api.post('/api/license/generate', {
        machineId: (quickMachineId || 'ANYPC000').trim().toUpperCase(),
        planName: quickPlan,
        durationDays: parseInt(quickDuration, 10),
        storeName: quickStoreName || 'Client Store',
        adminUsername: quickAdminUsername || 'Admin',
        adminEmail: quickAdminEmail || 'admin@store.com',
        adminPassword: quickAdminPassword || 'Admin@123'
      });
      if (res.data.success) {
        setQuickResult({
          ...res.data,
          storeName: quickStoreName || 'Client Store',
          adminEmail: quickAdminEmail || 'admin@store.com',
          adminPassword: quickAdminPassword || 'Admin@123',
          adminUsername: quickAdminUsername || 'Admin'
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate license key');
    } finally {
      setQuickLoading(false);
    }
  };

  // Admin Password Reset Handlers
  const openAdminsModal = (tenant) => {
    setSelectedTenantForAdmins(tenant);
    setIsAdminsModalOpen(true);
    setNewPasswords({});
  };

  const handlePasswordChange = (userId, value) => {
    setNewPasswords((prev) => ({ ...prev, [userId]: value }));
  };

  const handleResetPasswordSubmit = async (userId) => {
    if (!newPasswords[userId] || newPasswords[userId].length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    try {
      await api.put(`/api/tenants/${selectedTenantForAdmins._id}/users/${userId}/password`, {
        password: newPasswords[userId]
      });
      alert('Password reset successfully');
      setNewPasswords((prev) => ({ ...prev, [userId]: '' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  // Copy helpers
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2500);
  };

  const copyWhatsAppMessage = (data) => {
    const text = `🎉 *PRO Billing Software - Client Setup & License Details*

🏢 *Business Name*: ${data.businessName}
📧 *Admin Login*: ${data.adminEmail || 'N/A'}
🔑 *Password*: ${data.adminPassword || '(Set by SuperAdmin)'}

💻 *Machine ID*: ${data.machineId || 'Not Specified'}
🛡️ *Activation Key*: ${data.licenseKey || 'Generate from Dashboard'}
📅 *Plan*: ${data.plan?.toUpperCase() || 'GOLD'} (Valid until: ${data.validTill ? new Date(data.validTill).toLocaleDateString() : '365 Days'})

📞 *Helpline / Support*: +91 89532 08952
🌐 *PRO Billing Software*`;

    navigator.clipboard.writeText(text);
    setCopiedId('welcome-msg');
    setTimeout(() => setCopiedId(''), 2500);
  };

  // Filtered tenants by search query
  const filteredTenants = tenants.filter(t => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (t.businessName || '').toLowerCase().includes(q);
    const emailMatch = (t.contactEmail || '').toLowerCase().includes(q);
    const machineMatch = (t.machineId || '').toLowerCase().includes(q);
    const keyMatch = (t.licenseKey || '').toLowerCase().includes(q);
    return nameMatch || emailMatch || machineMatch || keyMatch;
  });

  if (loading) return (
    <div className="space-y-6">
      <Stack spacing={2} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <Skeleton variant="text" style={{ fontSize: '2rem' }} width="40%" />
        <Skeleton variant="text" style={{ fontSize: '1rem' }} width="20%" />
      </Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Stack key={i} spacing={2} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex gap-4 items-center">
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width="60%" height={24} />
            </div>
            <Skeleton variant="rectangular" height={80} className="w-full rounded-xl" />
            <Skeleton variant="rounded" height={40} className="w-full" />
          </Stack>
        ))}
      </div>
    </div>
  );

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary-600" />
            Client & License Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Setup businesses, manage client admin credentials, and generate offline cryptographic activation keys
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => {
              setQuickResult(null);
              setQuickMachineId('');
              setIsQuickGenOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-sm transition-all text-xs"
          >
            <Key className="h-4 w-4" />
            Instant Key Generator
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-sm transition-all text-xs"
          >
            <Plus className="h-4 w-4" />
            Onboard New Client
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search clients by business name, email, machine ID, or license key..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
        />
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map(tenant => {
          const isExpired = tenant.validTill && new Date(tenant.validTill) < new Date();
          const daysLeft = tenant.validTill 
            ? Math.ceil((new Date(tenant.validTill) - new Date()) / (1000 * 60 * 60 * 24)) 
            : null;

          return (
            <div key={tenant._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
              <div>
                {/* Header row */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold shrink-0">
                      {tenant.businessName ? tenant.businessName.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-tight">{tenant.businessName}</h3>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        tenant.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {tenant.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => openEditModal(tenant)}
                    className="text-slate-400 hover:text-primary-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
                    title="Edit Business Details"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>

                {/* Plan & Expiry badge */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-3">
                  <span className="font-bold uppercase tracking-wider text-primary-700 bg-primary-100/60 px-2 py-0.5 rounded-md">
                    {tenant.plan || 'Gold'}
                  </span>
                  <span className={`font-semibold ${isExpired ? 'text-rose-600' : 'text-slate-600'}`}>
                    {tenant.validTill 
                      ? isExpired ? 'Expired' : `${daysLeft} days left`
                      : 'Lifetime'}
                  </span>
                </div>

                {/* Machine Hardware ID Box */}
                <div className="space-y-2 text-xs mb-3">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 mb-1">
                      <span>Machine Hardware ID</span>
                      {tenant.machineId && (
                        <button
                          onClick={() => handleCopy(tenant.machineId, `mid-${tenant._id}`)}
                          className="text-primary-600 hover:underline flex items-center gap-1 lowercase"
                        >
                          {copiedId === `mid-${tenant._id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedId === `mid-${tenant._id}` ? 'copied' : 'copy'}</span>
                        </button>
                      )}
                    </div>
                    <code className="text-xs font-mono font-bold text-slate-800 block truncate">
                      {tenant.machineId || <span className="text-slate-400 font-normal italic">Pending Assignment</span>}
                    </code>
                  </div>

                  {/* Active License Key */}
                  <div className="p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/20">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-amber-700 mb-1">
                      <span>License Activation Key</span>
                      {tenant.licenseKey && (
                        <button
                          onClick={() => handleCopy(tenant.licenseKey, `key-${tenant._id}`)}
                          className="text-amber-700 hover:underline flex items-center gap-1 lowercase font-semibold"
                        >
                          {copiedId === `key-${tenant._id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedId === `key-${tenant._id}` ? 'copied' : 'copy key'}</span>
                        </button>
                      )}
                    </div>
                    <code className="text-xs font-mono font-bold text-amber-900 block truncate">
                      {tenant.licenseKey || <span className="text-slate-400 font-normal italic">No key generated yet</span>}
                    </code>
                  </div>
                </div>

                {/* Contact info */}
                <div className="text-xs text-slate-500 space-y-1">
                  <p className="truncate"><strong>Email:</strong> {tenant.contactEmail || 'N/A'}</p>
                  <p><strong>Phone:</strong> {tenant.contactPhone || 'N/A'}</p>
                  <p><strong>Expires:</strong> {tenant.validTill ? new Date(tenant.validTill).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => openLicenseModal(tenant)}
                  className="flex-1 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Key className="h-3.5 w-3.5" />
                  <span>Key / Renew</span>
                </button>

                <button
                  onClick={() => openAdminsModal(tenant)}
                  className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Manage Admins"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>{tenant.adminCount || 0}</span>
                </button>

                <button
                  onClick={() => copyWhatsAppMessage(tenant)}
                  className="py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Copy Details for WhatsApp"
                >
                  {copiedId === `tenant-${tenant._id}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
                  <span>{copiedId === `tenant-${tenant._id}` ? 'Copied' : 'Share'}</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredTenants.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
            No businesses found matching "{searchQuery}". Click "Onboard New Client" to add one.
          </div>
        )}
      </div>

      {/* Onboard New Tenant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Setup New Client & Generate License Key
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
              {/* Business Details */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Business Name *</label>
                    <input 
                      type="text" 
                      name="businessName" 
                      required 
                      placeholder="e.g. Gupta Garments"
                      value={formData.businessName} 
                      onChange={handleInputChange} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                    <input 
                      type="text" 
                      name="contactPhone" 
                      placeholder="+91 98765 43210"
                      value={formData.contactPhone} 
                      onChange={handleInputChange} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                    <input 
                      type="email" 
                      name="contactEmail" 
                      placeholder="contact@business.com"
                      value={formData.contactEmail} 
                      onChange={handleInputChange} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs" 
                    />
                  </div>
                </div>
              </div>

              {/* License & Machine Details */}
              <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 space-y-3">
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="h-4 w-4" />
                  2. Offline License Key Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Client Machine Hardware ID</label>
                    <input 
                      type="text" 
                      name="machineId" 
                      placeholder="e.g. PRGX-77A1-CB5A-5782"
                      value={formData.machineId} 
                      onChange={handleInputChange} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs" 
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Client copies this from their Settings page.</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Plan & Duration</label>
                    <select 
                      name="durationDays" 
                      value={formData.durationDays} 
                      onChange={(e) => {
                        const days = e.target.value;
                        const planMap = {
                          '30': 'Silver',
                          '90': 'Standard',
                          '180': 'Business',
                          '365': 'Gold',
                          '3650': 'Platinum'
                        };
                        setFormData(prev => ({
                          ...prev,
                          durationDays: days,
                          plan: planMap[days] || 'Gold'
                        }));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs"
                    >
                      <option value="30">1 Month (30 Days) - Silver</option>
                      <option value="90">3 Months (90 Days) - Standard</option>
                      <option value="180">6 Months (180 Days) - Business</option>
                      <option value="365">1 Year (365 Days) - Gold Plan</option>
                      <option value="3650">Lifetime (10 Years) - Platinum</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Admin Login Account */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">3. Primary Admin Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Admin Username *</label>
                    <input 
                      type="text" 
                      name="adminUsername" 
                      required 
                      placeholder="e.g. guptagarments"
                      value={formData.adminUsername} 
                      onChange={handleInputChange} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Admin Email *</label>
                    <input 
                      type="email" 
                      name="adminEmail" 
                      required 
                      placeholder="admin@guptagarments.com"
                      value={formData.adminEmail} 
                      onChange={handleInputChange} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Admin Password *</label>
                    <input 
                      type="password" 
                      name="adminPassword" 
                      required 
                      placeholder="Minimum 6 characters"
                      value={formData.adminPassword} 
                      onChange={handleInputChange} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-xs font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-500 transition-colors shadow-sm"
                >
                  Complete Setup & Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instant Welcome & Setup Complete Modal */}
      {onboardedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden p-6 space-y-5 animate-fade-in-up">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Client Setup Complete!</h2>
                <p className="text-xs text-slate-500">Business registered and license key generated successfully</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <p><strong>Business Name:</strong> {onboardedResult.businessName}</p>
                <p><strong>Admin Login:</strong> <span className="font-mono text-primary-600 font-bold">{onboardedResult.adminEmail}</span></p>
                <p><strong>Password:</strong> <span className="font-mono text-slate-800 font-bold">{onboardedResult.adminPassword}</span></p>
              </div>

              {onboardedResult.licenseKey ? (
                <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-amber-800">
                    <span>Generated License Key</span>
                    <button
                      onClick={() => handleCopy(onboardedResult.licenseKey, 'created-key')}
                      className="text-amber-800 hover:underline flex items-center gap-1 font-semibold"
                    >
                      {copiedId === 'created-key' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedId === 'created-key' ? 'Copied' : 'Copy Key'}</span>
                    </button>
                  </div>
                  <code className="text-xs font-mono font-bold text-slate-900 block bg-white p-2.5 rounded-xl border border-amber-200 break-all select-all">
                    {onboardedResult.licenseKey}
                  </code>
                  <p className="text-[10px] text-amber-700">
                    Valid for {onboardedResult.plan} plan (Expires: {onboardedResult.validTill ? new Date(onboardedResult.validTill).toLocaleDateString() : 'N/A'})
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-xs">
                  No Machine ID was provided. You can generate an activation key anytime from their card on the dashboard.
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => copyWhatsAppMessage(onboardedResult)}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                {copiedId === 'welcome-msg' ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                <span>{copiedId === 'welcome-msg' ? 'Copied to Clipboard!' : 'Copy WhatsApp Welcome Message'}</span>
              </button>

              <button
                type="button"
                onClick={() => setOnboardedResult(null)}
                className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* License Key Generator / Renewal Modal */}
      {isLicenseModalOpen && selectedTenantForLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden p-6 space-y-4 animate-fade-in-up">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-500" />
                License Key - {selectedTenantForLicense.businessName}
              </h2>
              <button onClick={() => setIsLicenseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateTenantLicense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Machine Hardware ID *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. PRGX-77A1-CB5A-5782"
                  value={licenseMachineId}
                  onChange={(e) => setLicenseMachineId(e.target.value.toUpperCase().trim())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plan</label>
                  <select
                    value={licensePlan}
                    onChange={(e) => setLicensePlan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs"
                  >
                    <option value="Silver">Silver</option>
                    <option value="Standard">Standard</option>
                    <option value="Business">Business</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Validity Duration</label>
                  <select
                    value={licenseDuration}
                    onChange={(e) => setLicenseDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs"
                  >
                    <option value="30">1 Month (30 Days)</option>
                    <option value="90">3 Months (90 Days)</option>
                    <option value="180">6 Months (180 Days)</option>
                    <option value="365">1 Year (365 Days)</option>
                    <option value="3650">Lifetime (10 Years)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={licenseLoading || !licenseMachineId}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {licenseLoading ? 'Generating...' : 'Generate & Save License Key'}
                </button>
              </div>
            </form>

            {generatedLicenseResult && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs animate-fade-in">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-emerald-800">
                  <span>New License Key Generated</span>
                  <button
                    onClick={() => handleCopy(generatedLicenseResult.licenseKey, 'renewed-key')}
                    className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    {copiedId === 'renewed-key' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedId === 'renewed-key' ? 'Copied!' : 'Copy Key'}</span>
                  </button>
                </div>

                <code className="text-xs font-mono font-bold text-slate-900 block bg-white p-2.5 rounded-xl border border-emerald-200 break-all select-all">
                  {generatedLicenseResult.licenseKey}
                </code>
                <p className="text-[11px] text-emerald-700">
                  Key saved to tenant! Share this key with the client to unlock their PC.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden p-6 space-y-4 animate-fade-in-up">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary-500" />
                Edit Business Details
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Business Name *</label>
                  <input type="text" name="businessName" required value={editFormData.businessName} onChange={handleEditInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select name="status" value={editFormData.status} onChange={handleEditInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Machine Hardware ID</label>
                  <input type="text" name="machineId" placeholder="PRGX-..." value={editFormData.machineId} onChange={handleEditInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valid Till Date</label>
                  <input type="date" name="validTill" value={editFormData.validTill} onChange={handleEditInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input type="email" name="contactEmail" value={editFormData.contactEmail} onChange={handleEditInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input type="text" name="contactPhone" value={editFormData.contactPhone} onChange={handleEditInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 text-xs font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-500 shadow-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Admins Modal */}
      {isAdminsModalOpen && selectedTenantForAdmins && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden p-6 space-y-4 animate-fade-in-up">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-500" />
                Manage Admins - {selectedTenantForAdmins.businessName}
              </h2>
              <button onClick={() => setIsAdminsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[60vh]">
              {(!selectedTenantForAdmins.users || selectedTenantForAdmins.users.length === 0) ? (
                <div className="text-center py-8 text-slate-400 text-xs">No admins found for this business.</div>
              ) : (
                selectedTenantForAdmins.users.map((user) => (
                  <div key={user._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-slate-200 rounded-2xl bg-slate-50 gap-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{user.username}</p>
                      <p className="text-slate-500 text-[11px] font-mono">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        placeholder="New Password" 
                        className="w-36 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={newPasswords[user._id] || ''}
                        onChange={(e) => handlePasswordChange(user._id, e.target.value)}
                      />
                      <button 
                        onClick={() => handleResetPasswordSubmit(user._id)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Key className="h-3 w-3" />
                        Reset
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instant Quick Standalone Key Generator Modal */}
      {isQuickGenOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-slate-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Instant License Key Generator</h2>
                  <p className="text-xs text-amber-100">Generate activation key for any client hardware</p>
                </div>
              </div>
              <button onClick={() => setIsQuickGenOpen(false)} className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <form onSubmit={handleQuickGenerate} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Store / Business Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gupta Garments"
                      value={quickStoreName}
                      onChange={(e) => setQuickStoreName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Admin Username
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rohit"
                      value={quickAdminUsername}
                      onChange={(e) => setQuickAdminUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Admin Login Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@store.com"
                      value={quickAdminEmail}
                      onChange={(e) => setQuickAdminEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Admin Login Password *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Store@123"
                      value={quickAdminPassword}
                      onChange={(e) => setQuickAdminPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Subscription Plan
                    </label>
                    <select
                      value={quickPlan}
                      onChange={(e) => setQuickPlan(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Silver">Silver (Trial / Monthly)</option>
                      <option value="Gold">Gold (Annual Standard)</option>
                      <option value="Platinum">Platinum (Enterprise / Lifetime)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Validity Period
                    </label>
                    <select
                      value={quickDuration}
                      onChange={(e) => setQuickDuration(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="30">30 Days (1 Month)</option>
                      <option value="90">90 Days (Quarterly)</option>
                      <option value="180">180 Days (Half Year)</option>
                      <option value="365">365 Days (1 Year)</option>
                      <option value="730">730 Days (2 Years)</option>
                      <option value="3650">3650 Days (10 Years / Lifetime)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Client Machine Hardware ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="ANYPC000 (Allow Any Computer)"
                    value={quickMachineId}
                    onChange={(e) => setQuickMachineId(e.target.value.toUpperCase().trim())}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Leave as ANYPC000 to allow activation on any client computer.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={quickLoading || !quickAdminEmail.trim() || !quickAdminPassword.trim()}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {quickLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Smart Activation Key</span>
                    </>
                  )}
                </button>
              </form>

              {/* Generated Result */}
              {quickResult && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-fade-in text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Smart Activation Key Ready!
                    </span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                      {quickResult.planName} • {quickResult.durationDays} Days
                    </span>
                  </div>

                  {/* Summary of credentials encoded in the key */}
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-1 text-[11px] text-slate-700">
                    <p><strong>Store:</strong> {quickResult.storeName || 'Client Store'}</p>
                    <p><strong>Admin Login:</strong> <span className="font-mono text-primary-600 font-bold">{quickResult.adminEmail}</span></p>
                    <p><strong>Password:</strong> <span className="font-mono text-slate-800 font-bold">{quickResult.adminPassword}</span></p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Activation Key (Paste on /activate screen):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={quickResult.licenseKey}
                        className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(quickResult.licenseKey);
                          setCopiedId('quick-key');
                          setTimeout(() => setCopiedId(''), 2500);
                        }}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm shrink-0"
                      >
                        {copiedId === 'quick-key' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Share on WhatsApp Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `🎉 PRO Billing Software - License Activated!\n\nStore: ${quickResult.storeName}\nPlan: ${quickResult.planName} (${quickResult.durationDays} Days)\n\n🔑 Your Activation Key:\n${quickResult.licenseKey}\n\n👤 Admin Login Details:\nEmail: ${quickResult.adminEmail}\nPassword: ${quickResult.adminPassword}\n\nHow to activate:\n1. Open PRO Billing Software on your PC.\n2. Paste the Activation Key and click Activate.\n3. Login with your Admin Email & Password.\n\nSupport Hotline: +91 89532 08952`;
                      navigator.clipboard.writeText(msg);
                      setCopiedId('quick-wa');
                      setTimeout(() => setCopiedId(''), 2500);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedId === 'quick-wa' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied WhatsApp Message!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Copy Complete WhatsApp Message</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminDashboard;
