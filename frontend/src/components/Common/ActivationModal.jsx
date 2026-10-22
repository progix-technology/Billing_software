import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Copy, 
  Check, 
  PhoneCall, 
  ShieldAlert, 
  ShieldCheck, 
  X, 
  Sparkles,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { api } from '../../context/AuthContext';

const ActivationModal = ({ isOpen, onClose, isDismissible = true, onActivated }) => {
  const [machineId, setMachineId] = useState('');
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    try {
      setStatusLoading(true);
      const res = await api.get('/api/license/status');
      if (res.data.success) {
        setMachineId(res.data.machineId || '');
        setLicenseStatus(res.data);
      }
    } catch (err) {
      console.error('Failed to get license status', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleCopyMachineId = () => {
    if (!machineId) return;
    navigator.clipboard.writeText(machineId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid activation key.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post('/api/license/activate', {
        licenseKey: licenseKey.trim().toUpperCase()
      });

      if (res.data.success) {
        const planName = res.data.planName || 'Active';
        setMessage({
          type: 'success',
          text: `🎉 Software Successfully Activated! Plan: ${planName}`
        });
        setLicenseKey('');
        await fetchStatus();
        if (onActivated) {
          onActivated(res.data);
        }
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Invalid or expired activation key for this machine.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const whatsappMessage = encodeURIComponent(
    `Hello Progix Support, I need an activation key for PRO Billing Software.\nMy Machine Hardware ID is: ${machineId}`
  );
  const whatsappUrl = `https://wa.me/918953208952?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header Gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-primary-700 p-6 text-white relative">
          {isDismissible && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-sm shadow-inner">
              <Key className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">PRO Billing Software</h2>
              <p className="text-xs text-blue-100 font-medium">Device License & Activation Portal</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Banner */}
          {licenseStatus && (
            <div className={`p-4 rounded-2xl flex items-center justify-between border ${
              licenseStatus.isActivated && !licenseStatus.isExpired
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-3">
                {licenseStatus.isActivated && !licenseStatus.isExpired ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0" />
                )}
                <div>
                  <h4 className="text-sm font-bold">
                    {licenseStatus.isActivated && !licenseStatus.isExpired
                      ? `License Active (${licenseStatus.planName || 'Plan Active'})`
                      : 'Activation Required'}
                  </h4>
                  <p className="text-xs opacity-85">
                    {licenseStatus.isActivated && !licenseStatus.isExpired
                      ? `${licenseStatus.daysRemaining} days remaining`
                      : 'Enter a valid license key provided by SuperAdmin to use the software.'}
                  </p>
                </div>
              </div>

              <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg ${
                licenseStatus.isActivated && !licenseStatus.isExpired
                  ? 'bg-emerald-200/60 text-emerald-900'
                  : 'bg-amber-200/80 text-amber-950'
              }`}>
                {licenseStatus.isActivated && !licenseStatus.isExpired ? 'ACTIVE' : 'LOCKED'}
              </span>
            </div>
          )}

          {/* Machine Hardware ID Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Your Machine Hardware ID
                </span>
              </div>
              <span className="text-[10px] text-slate-600 font-medium bg-slate-200/80 px-2 py-0.5 rounded">
                Unique to this PC
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={machineId || 'Reading Hardware ID...'}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-slate-900 tracking-wider select-all"
              />
              <button
                type="button"
                onClick={handleCopyMachineId}
                disabled={!machineId}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
              >
                {copiedId ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-600 mt-2">
              Copy and share this ID with your SuperAdmin to receive your Activation Key.
            </p>
          </div>

          {/* Quick WhatsApp Support Banner */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-emerald-900 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">Need an Activation Key?</p>
                <p className="text-[11px] text-emerald-700">Progix Hotline: +91 89532 08952</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:text-emerald-900">
              <span>Send ID</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Activation Key Form */}
          <form onSubmit={handleActivate} className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Paste Activation Key
              </label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="PRO-GOLD-XXXX-XXXX-XXXX-XXXX"
                className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 text-sm font-mono font-semibold tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
              />
            </div>

            {/* Notification message */}
            {message.text && (
              <div className={`p-3 rounded-xl text-xs font-medium ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !licenseKey.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Activate Software</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>PRO Billing Software v1.0.0</span>
          <span>Secured by Hardware Cryptography</span>
        </div>
      </div>
    </div>
  );
};

export default ActivationModal;
