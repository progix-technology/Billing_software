import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Settings, Shield, Mail, Bell, AlertTriangle } from 'lucide-react';

const SuperAdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    isMaintenanceMode: false,
    maintenanceMessage: 'System is under maintenance. Please try again later.'
  });

  // Offline License Generator States
  const [genMachineId, setGenMachineId] = useState('');
  const [genPlan, setGenPlan] = useState('Gold');
  const [genDuration, setGenDuration] = useState('365');
  const [generatedKey, setGeneratedKey] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!genMachineId) return;
    setGenLoading(true);
    setGeneratedKey('');
    try {
      const res = await api.post('/api/license/generate', {
        machineId: genMachineId,
        planName: genPlan,
        durationDays: parseInt(genDuration, 10),
      });
      if (res.data.success) {
        setGeneratedKey(res.data.licenseKey);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate license key.');
    } finally {
      setGenLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/system/settings');
      if (res.data.settings) {
        setSettings({
          isMaintenanceMode: res.data.settings.isMaintenanceMode,
          maintenanceMessage: res.data.settings.maintenanceMessage || 'System is under maintenance. Please try again later.'
        });
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceToggle = () => {
    setSettings(prev => ({ ...prev, isMaintenanceMode: !prev.isMaintenanceMode }));
  };

  const handleMessageChange = (e) => {
    setSettings(prev => ({ ...prev, maintenanceMessage: e.target.value }));
  };

  const handleSaveMaintenance = async () => {
    try {
      setSaving(true);
      await api.put('/api/system/settings', {
        isMaintenanceMode: settings.isMaintenanceMode,
        maintenanceMessage: settings.maintenanceMessage
      });
      alert('Maintenance mode settings updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure global platform settings</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
        {settings.isMaintenanceMode && (
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            MAINTENANCE ACTIVE
          </div>
        )}
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Maintenance Mode</h2>
            <p className="text-sm text-slate-500">Lock down the software for updates. Normal users will be blocked.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Enable Maintenance Mode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.isMaintenanceMode}
                onChange={handleMaintenanceToggle}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Maintenance Message (Displayed to users)</label>
            <textarea 
              rows="3" 
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={settings.maintenanceMessage}
              onChange={handleMessageChange}
              disabled={!settings.isMaintenanceMode}
            ></textarea>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button 
              onClick={handleSaveMaintenance}
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Maintenance Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Offline License Key Generator for Clients */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Offline Client License Key Generator</h2>
            <p className="text-sm text-slate-500">Generate cryptographically verified license activation keys for client desktop apps.</p>
          </div>
        </div>

        <form onSubmit={handleGenerateKey} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Client Machine Hardware ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PRGX-776E-AB6E-25E9"
                value={genMachineId}
                onChange={(e) => setGenMachineId(e.target.value.trim().toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-[10px] text-slate-400">Ask the client to copy their Machine ID from their Settings page.</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Subscription Plan & Duration
              </label>
              <select
                value={genDuration}
                onChange={(e) => {
                  setGenDuration(e.target.value);
                  const planMap = {
                    '30': 'Silver',
                    '90': 'Standard',
                    '180': 'Business',
                    '365': 'Gold',
                    '3650': 'Lifetime'
                  };
                  setGenPlan(planMap[e.target.value] || 'Gold');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="30">1 Month (30 Days) - Silver</option>
                <option value="90">3 Months (90 Days) - Standard</option>
                <option value="180">6 Months (180 Days) - Business</option>
                <option value="365">1 Year (365 Days) - Gold</option>
                <option value="3650">Lifetime (10 Years) - Platinum</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={genLoading || !genMachineId}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow transition-all disabled:opacity-50"
            >
              {genLoading ? 'Generating...' : 'Generate Activation Key'}
            </button>
          </div>
        </form>

        {generatedKey && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                License Key Ready for Client
              </span>
              <span className="text-xs bg-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
                {genPlan} Plan ({genDuration} Days)
              </span>
            </div>

            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-200">
              <code className="text-xs font-mono font-bold text-slate-900 break-all select-all">
                {generatedKey}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedKey);
                  setKeyCopied(true);
                  setTimeout(() => setKeyCopied(false), 2500);
                }}
                className="ml-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
              >
                {keyCopied ? 'Copied!' : 'Copy Key'}
              </button>
            </div>
            <p className="text-[11px] text-emerald-700">
              Send this key to the client on WhatsApp or SMS. Once entered in their app, it will instantly unlock all features.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security & Authentication */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 opacity-60">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
            <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-slate-800">Security & Authentication</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">Manage password policies, 2FA, and session timeouts.</p>
          <span className="text-xs font-medium text-slate-400">System Secured</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 opacity-60">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
            <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-slate-800">SMTP & Email Server</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">Offline local setup does not require external SMTP servers.</p>
          <span className="text-xs font-medium text-slate-400">Offline Optimized</span>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettings;
