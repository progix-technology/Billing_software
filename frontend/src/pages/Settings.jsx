import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Settings, Download, Upload, ShieldCheck, Store, Database, CheckCircle, AlertCircle, Image } from 'lucide-react';

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

  useEffect(() => {
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
      const response = await api.get('/api/settings/backup', { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/json' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `erp_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('Database backup file successfully downloaded');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Database extraction backup failed. Admin authorization required.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm('WARNING: Restoring the database will overwrite all current items, sales invoices, categories, customers, and expenses. Do you want to proceed?')) {
      e.target.value = null;
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        const res = await api.post('/api/settings/restore', { data: parsedData.data });
        if (res.data.success) {
          setSuccess('Database successfully restored! Reloading application states...');
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      } catch (err) {
        setError('Invalid backup JSON format. Please verify the integrity of the uploaded backup file.');
      } finally {
        setLoading(false);
        e.target.value = null;
      }
    };
    reader.readAsText(file);
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

      </div>
    </div>
  );
};

export default SettingsPage;

