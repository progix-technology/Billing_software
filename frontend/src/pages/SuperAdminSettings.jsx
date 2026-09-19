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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Placeholder for future settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 opacity-60">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
            <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-slate-800">Security & Authentication</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">Manage password policies, 2FA, and session timeouts.</p>
          <span className="text-xs font-medium text-slate-400">Coming Soon</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 opacity-60">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
            <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-slate-800">SMTP & Email Server</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">Configure the email server used for sending system notifications.</p>
          <span className="text-xs font-medium text-slate-400">Coming Soon</span>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettings;
