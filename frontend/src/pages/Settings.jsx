import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Settings, Download, Upload, ShieldCheck, Store, Database, CheckCircle, AlertCircle, Key, Copy, Check, PhoneCall, Calendar } from 'lucide-react';

const SettingsPage = () => {
  const { settings, updateSettings } = useSettings();

  const [storeName, setStoreName] = useState('Enterprise Billing Solutions');
  const [storeGst, setStoreGst] = useState('27AAAAA1111A1Z1');
  const [storeAddress, setStoreAddress] = useState('Main Street, Pune, Maharashtra, India');
  const [storePhone, setStorePhone] = useState('+91 98765 43210');
  const [gstSlabsInput, setGstSlabsInput] = useState('0, 5, 12, 18, 28');
  const [dashboardBanner, setDashboardBanner] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Offline License & Subscription States
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseMessage, setLicenseMessage] = useState({ type: '', text: '' });
  const [copiedMachineId, setCopiedMachineId] = useState(false);

  const fetchLicense = async () => {
    try {
      const res = await api.get('/api/license/status');
      if (res.data.success) {
        setLicenseStatus(res.data);
      }
    } catch (err) {
      console.error('Failed to load offline license status', err);
    }
  };

  useEffect(() => {
    fetchLicense();
    if (settings) {
      if (settings.storeName) setStoreName(settings.storeName);
      if (settings.storeGst) setStoreGst(settings.storeGst);
      if (settings.storeAddress) setStoreAddress(settings.storeAddress);
      if (settings.storePhone) setStorePhone(settings.storePhone);
      if (settings.gstSlabs && Array.isArray(settings.gstSlabs)) {
        setGstSlabsInput(settings.gstSlabs.join(', '));
      }
      if (settings.dashboardBanner) {
        setDashboardBanner(settings.dashboardBanner);
        setBannerPreview(settings.dashboardBanner);
      } else {
        setDashboardBanner('');
        setBannerPreview('');
      }
    }
  }, [settings]);

  const handleCopyMachineId = () => {
    if (licenseStatus?.machineId) {
      navigator.clipboard.writeText(licenseStatus.machineId);
      setCopiedMachineId(true);
      setTimeout(() => setCopiedMachineId(false), 2500);
    }
  };

  const handleActivateLicense = async (e) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) return;
    setLicenseLoading(true);
    setLicenseMessage({ type: '', text: '' });
    try {
      const res = await api.post('/api/license/activate', { licenseKey: licenseKeyInput.trim() });
      if (res.data.success) {
        setLicenseMessage({ type: 'success', text: `License successfully activated! Plan: ${res.data.planName}` });
        setLicenseKeyInput('');
        fetchLicense();
      }
    } catch (err) {
      setLicenseMessage({ type: 'error', text: err.response?.data?.message || 'Invalid or expired license key.' });
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Image file is too large. Maximum size allowed is 8MB.');
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setDashboardBanner(reader.result);
      setBannerPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const gstSlabs = gstSlabsInput.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      const res = await api.post('/api/settings', {
        storeName,
        storeGst,
        storeAddress,
        storePhone,
        dashboardBanner,
        gstSlabs,
      });
      if (res.data.success) {
        setSuccess('Store profile settings successfully saved!');
        if (res.data.settings) {
          updateSettings(res.data.settings);
        }
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save store settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/backup/export', { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/json' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `probilling-offline-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('Full offline database backup successfully downloaded!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Database backup export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm('WARNING: Restoring the database will overwrite your current offline records (Products, Customers, Invoices, Settings). Continue?')) {
      e.target.value = null;
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('backupFile', file);

    try {
      const res = await api.post('/api/backup/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setSuccess('Database successfully restored! Reloading application...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Database restore failed. Please verify the backup JSON file.');
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary-500" />
          ERP Platform Configuration
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure shop profiles, specify company GSTINs, and manage data backup recovery options.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Shop Settings Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm transition-colors flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-sm uppercase tracking-wider text-slate-400">
              <Store className="h-5 w-5 text-primary-500" /> Store Profile details
            </h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs md:text-sm">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Company / Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Company GSTIN code</label>
                <input
                  type="text"
                  value={storeGst}
                  onChange={(e) => setStoreGst(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Billing address</label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Store Phone Contact</label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">GST Tax Slabs (%)</label>
                <input
                  type="text"
                  value={gstSlabsInput}
                  onChange={(e) => setGstSlabsInput(e.target.value)}
                  placeholder="e.g. 0, 5, 12, 18, 28"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-900 dark:text-white font-mono"
                />
                <p className="text-[9px] text-slate-400 mt-1">
                  Separate multiple GST percentages with commas. These will appear in the Products dropdown.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Dashboard Banner Image</label>
                <div className="flex flex-col gap-2">
                  {bannerPreview && (
                    <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                      <img
                        src={bannerPreview}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setDashboardBanner('');
                          setBannerPreview('');
                        }}
                        className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white p-1 rounded-lg text-[10px] font-bold transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-900 dark:text-white text-xs"
                  />
                  <p className="text-[9px] text-slate-400">
                    Recommended banner ratio is 4:1 (e.g. 1200x300px), max size 8MB.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-500 text-white font-semibold px-4 py-2 rounded-xl shadow-md text-xs disabled:opacity-50 transition-all"
              >
                {loading ? 'Saving...' : 'Save Profile Configuration'}
              </button>
            </form>
          </div>
        </div>

        {/* Database backup restoration */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm transition-colors flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-sm uppercase tracking-wider text-slate-400">
              <Database className="h-5 w-5 text-primary-500" /> Database Backup & Recovery
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Export full records of your categories, products, customers, suppliers, expenses, and invoices as a single unified backup file. Upload this backup to restore data at any time.
            </p>

            <div className="space-y-4 pt-4">
              {/* Backup */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Download Backup</span>
                  <span className="text-[10px] text-slate-400">Downloads database dump as .json file</span>
                </div>
                <button
                  onClick={handleDownloadBackup}
                  disabled={loading}
                  className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow transition-all disabled:opacity-50"
                >
                  <Download className="h-4 w-4" /> Download Backup
                </button>
              </div>

              {/* Restore */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Restore Database</span>
                  <span className="text-[10px] text-slate-400">Upload and import .json backup dump</span>
                </div>
                <label className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow cursor-pointer transition-all">
                  <Upload className="h-4 w-4" /> Restore Data
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleUploadRestore}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Software License & Subscription Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm transition-colors md:col-span-2">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-slate-400">
                <Key className="h-5 w-5 text-amber-500" /> Software License & Subscription
              </h3>
              {licenseStatus && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                  licenseStatus.isExpired 
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${licenseStatus.isExpired ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                  {licenseStatus.isExpired ? 'SUBSCRIPTION EXPIRED' : 'ACTIVE SUBSCRIPTION'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Machine ID */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Unique Machine Hardware ID</span>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <code className="text-xs font-mono font-bold text-slate-900 dark:text-primary-400 select-all">
                    {licenseStatus?.machineId || 'Generating...'}
                  </code>
                  <button
                    onClick={handleCopyMachineId}
                    title="Copy Machine ID"
                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary-600 transition-colors"
                  >
                    {copiedMachineId ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Share this ID with Progix support to renew your license.</p>
              </div>

              {/* Current Plan Details */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Plan & Validity</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {licenseStatus?.planName || 'Loading...'}
                  </span>
                  <span className={`text-xs font-semibold ${licenseStatus?.daysLeft <= 3 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'}`}>
                    {licenseStatus?.daysLeft !== undefined ? `${licenseStatus.daysLeft} days remaining` : ''}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Valid until: {licenseStatus?.expiresAt ? new Date(licenseStatus.expiresAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>

              {/* Support Contact */}
              <div className="p-4 bg-gradient-to-br from-primary-500/10 via-amber-500/5 to-transparent border border-primary-500/20 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-primary-600 dark:text-primary-400 block tracking-wider">License Renewal Support</span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1">Progix Technology Support</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-1 font-mono font-medium">
                    <PhoneCall className="h-3.5 w-3.5 text-primary-500" />
                    +91 89532 08952
                  </p>
                </div>
                <p className="text-[10px] text-slate-400">Instant offline activation key delivery via WhatsApp/Call.</p>
              </div>
            </div>

            {/* License Activation Form */}
            <form onSubmit={handleActivateLicense} className="pt-2">
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
                Enter Offline Activation License Key
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="e.g. PRGX-GOLD-20271021-776E-8F2D..."
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-mono text-slate-900 dark:text-white tracking-wider focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={licenseLoading || !licenseKeyInput.trim()}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {licenseLoading ? 'Activating...' : 'Activate License'}
                </button>
              </div>

              {licenseMessage.text && (
                <div className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  licenseMessage.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                }`}>
                  {licenseMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span>{licenseMessage.text}</span>
                </div>
              )}
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;

