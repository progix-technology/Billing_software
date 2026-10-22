import React, { useState, useEffect } from 'react';
import api from '../api';
import { Settings as SettingsIcon, Lock, ShieldAlert, Check, Loader2 } from 'lucide-react';

const Settings = () => {
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState('');

  const [sysSettings, setSysSettings] = useState({
    maintenanceMode: false,
    maintenanceMessage: '',
    supportPhone: '',
    supportEmail: ''
  });
  const [sysLoading, setSysLoading] = useState(false);

  useEffect(() => {
    api.get('/dashboard/settings')
      .then((res) => {
        if (res.data.success) {
          setSysSettings(res.data.settings);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    setPassLoading(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      if (res.data.success) {
        setPassMessage('Password changed successfully!');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPassMessage(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Password update failed');
    } finally {
      setPassLoading(false);
    }
  };

  const handleSysUpdate = async (e) => {
    e.preventDefault();
    setSysLoading(true);
    try {
      const res = await api.put('/dashboard/settings', sysSettings);
      if (res.data.success) {
        alert('System settings updated successfully');
      }
    } catch (err) {
      alert('Failed to update system settings');
    } finally {
      setSysLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-indigo-400" />
          <span>SuperAdmin Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Security credentials and global software controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change SuperAdmin Password */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4 text-indigo-400" />
            <span>Change Master Password</span>
          </h3>

          {passMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              {passMessage}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              disabled={passLoading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 mt-4"
            >
              {passLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Update Password</span>}
            </button>
          </form>
        </div>

        {/* Global System & Maintenance Mode */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <span>Global Remote Controls</span>
          </h3>

          <form onSubmit={handleSysUpdate} className="space-y-4">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Emergency Maintenance Mode</p>
                <p className="text-[10px] text-slate-400">Lock client apps during major infrastructure upgrades</p>
              </div>
              <input
                type="checkbox"
                checked={sysSettings.maintenanceMode}
                onChange={(e) => setSysSettings({ ...sysSettings, maintenanceMode: e.target.checked })}
                className="h-5 w-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Maintenance Lock Banner Message</label>
              <input
                type="text"
                value={sysSettings.maintenanceMessage}
                onChange={(e) => setSysSettings({ ...sysSettings, maintenanceMessage: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Support Helpline Phone</label>
              <input
                type="text"
                value={sysSettings.supportPhone}
                onChange={(e) => setSysSettings({ ...sysSettings, supportPhone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Support Email</label>
              <input
                type="email"
                value={sysSettings.supportEmail}
                onChange={(e) => setSysSettings({ ...sysSettings, supportEmail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              disabled={sysLoading}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 mt-4"
            >
              {sysLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Save Controls</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
